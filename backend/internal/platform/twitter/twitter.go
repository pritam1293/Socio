package twitter

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/pritam/socio-backend/internal/models"
	"github.com/pritam/socio-backend/internal/platform"
)

type TwitterProvider struct {
	clientID     string
	clientSecret string
	callbackURL  string
	authURL      string
	tokenURL     string
	apiBaseURL   string
	httpClient   *http.Client
}

func NewTwitterProvider(clientID, clientSecret, callbackURL string) *TwitterProvider {
	return &TwitterProvider{
		clientID:     clientID,
		clientSecret: clientSecret,
		callbackURL:  callbackURL,
		authURL:      "https://twitter.com/i/oauth2/authorize",
		tokenURL:     "https://api.twitter.com/2/oauth2/token",
		apiBaseURL:   "https://api.twitter.com/2",
		httpClient:   &http.Client{Timeout: 30 * time.Second},
	}
}

func (p *TwitterProvider) GetName() string {
	return "twitter"
}

func (p *TwitterProvider) GetAuthURL(state, codeChallenge string) string {
	params := url.Values{}
	params.Set("response_type", "code")
	params.Set("client_id", p.clientID)
	params.Set("redirect_uri", p.callbackURL)
	params.Set("scope", "tweet.read tweet.write users.read offline.access")
	params.Set("state", state)
	params.Set("code_challenge", codeChallenge)
	params.Set("code_challenge_method", "S256")

	return fmt.Sprintf("%s?%s", p.authURL, params.Encode())
}

func (p *TwitterProvider) ExchangeCode(ctx context.Context, code, codeVerifier string) (*platform.TokenResult, error) {
	log.Printf("[TWITTER] exchanging authorization code, code_len=%d verifier_len=%d", len(code), len(codeVerifier))

	data := url.Values{}
	data.Set("code", code)
	data.Set("grant_type", "authorization_code")
	data.Set("client_id", p.clientID)
	data.Set("redirect_uri", p.callbackURL)
	data.Set("code_verifier", codeVerifier)

	req, err := http.NewRequestWithContext(ctx, "POST", p.tokenURL, strings.NewReader(data.Encode()))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.SetBasicAuth(p.clientID, p.clientSecret)

	resp, err := p.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("token request failed: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("twitter token error [%d]: %s", resp.StatusCode, string(body))
	}

	var result struct {
		AccessToken  string `json:"access_token"`
		RefreshToken string `json:"refresh_token"`
		ExpiresIn    int64  `json:"expires_in"`
	}
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("failed to parse token response: %w", err)
	}

	return &platform.TokenResult{
		AccessToken:  result.AccessToken,
		RefreshToken: result.RefreshToken,
		ExpiresIn:    result.ExpiresIn,
	}, nil
}

func (p *TwitterProvider) RefreshToken(ctx context.Context, refreshToken string) (*platform.TokenResult, error) {
	data := url.Values{}
	data.Set("grant_type", "refresh_token")
	data.Set("refresh_token", refreshToken)
	data.Set("client_id", p.clientID)

	req, err := http.NewRequestWithContext(ctx, "POST", p.tokenURL, strings.NewReader(data.Encode()))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.SetBasicAuth(p.clientID, p.clientSecret)

	resp, err := p.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("refresh request failed: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("twitter refresh error [%d]: %s", resp.StatusCode, string(body))
	}

	var result struct {
		AccessToken  string `json:"access_token"`
		RefreshToken string `json:"refresh_token"`
		ExpiresIn    int64  `json:"expires_in"`
	}
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("failed to parse refresh response: %w", err)
	}

	return &platform.TokenResult{
		AccessToken:  result.AccessToken,
		RefreshToken: result.RefreshToken,
		ExpiresIn:    result.ExpiresIn,
	}, nil
}

func (p *TwitterProvider) PublishPost(ctx context.Context, account *models.SocialAccount, post *models.Post) (string, error) {
	body := map[string]interface{}{
		"text": getText(post),
	}
	bodyBytes, _ := json.Marshal(body)

	req, err := http.NewRequestWithContext(ctx, "POST", p.apiBaseURL+"/tweets", bytes.NewReader(bodyBytes))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+account.AccessToken)

	resp, err := p.httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("tweet request failed: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	if resp.StatusCode != http.StatusCreated {
		return "", fmt.Errorf("twitter publish error [%d]: %s", resp.StatusCode, string(respBody))
	}

	var result struct {
		Data struct {
			ID   string `json:"id"`
			Text string `json:"text"`
		} `json:"data"`
	}
	if err := json.Unmarshal(respBody, &result); err != nil {
		return "", fmt.Errorf("failed to parse tweet response: %w", err)
	}

	return result.Data.ID, nil
}

func (p *TwitterProvider) ValidateConnection(ctx context.Context, accessToken string) (bool, error) {
	req, err := http.NewRequestWithContext(ctx, "GET", p.apiBaseURL+"/users/me", nil)
	if err != nil {
		return false, err
	}
	req.Header.Set("Authorization", "Bearer "+accessToken)

	resp, err := p.httpClient.Do(req)
	if err != nil {
		return false, err
	}
	defer resp.Body.Close()

	return resp.StatusCode == http.StatusOK, nil
}

func (p *TwitterProvider) GetUserInfo(ctx context.Context, accessToken string) (*platform.UserInfo, error) {
	req, err := http.NewRequestWithContext(ctx, "GET",
		p.apiBaseURL+"/users/me?user.fields=profile_image_url,username", nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+accessToken)

	resp, err := p.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("user info request failed: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("twitter user info error [%d]: %s", resp.StatusCode, string(body))
	}

	var result struct {
		Data struct {
			ID              string `json:"id"`
			Username        string `json:"username"`
			ProfileImageURL string `json:"profile_image_url"`
		} `json:"data"`
	}
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("failed to parse user info: %w", err)
	}

	return &platform.UserInfo{
		PlatformUserID:   result.Data.ID,
		PlatformUsername: result.Data.Username,
		AvatarURL:        result.Data.ProfileImageURL,
	}, nil
}

func getText(post *models.Post) string {
	text := ""
	if post.Caption != nil {
		text = *post.Caption
	}
	if len(post.Hashtags) > 0 {
		for _, tag := range post.Hashtags {
			text += "\n#" + strings.TrimPrefix(tag, "#")
		}
	}
	return text
}
