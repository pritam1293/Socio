package reddit

import (
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

type RedditProvider struct {
	clientID     string
	clientSecret string
	callbackURL  string
	authURL      string
	tokenURL     string
	apiBaseURL   string
	httpClient   *http.Client
	userAgent    string
}

func NewRedditProvider(clientID, clientSecret, callbackURL string) *RedditProvider {
	return &RedditProvider{
		clientID:     clientID,
		clientSecret: clientSecret,
		callbackURL:  callbackURL,
		authURL:      "https://www.reddit.com/api/v1/authorize",
		tokenURL:     "https://www.reddit.com/api/v1/access_token",
		apiBaseURL:   "https://oauth.reddit.com",
		httpClient:   &http.Client{Timeout: 30 * time.Second},
		userAgent:    "Socio/1.0",
	}
}

func (p *RedditProvider) GetName() string {
	return "reddit"
}

func (p *RedditProvider) GetAuthURL(state, codeChallenge string) string {
	params := url.Values{}
	params.Set("response_type", "code")
	params.Set("client_id", p.clientID)
	params.Set("redirect_uri", p.callbackURL)
	params.Set("scope", "identity submit read")
	params.Set("state", state)
	params.Set("duration", "permanent")

	return fmt.Sprintf("%s?%s", p.authURL, params.Encode())
}

func (p *RedditProvider) ExchangeCode(ctx context.Context, code, codeVerifier string) (*platform.TokenResult, error) {
	log.Printf("[REDDIT] exchanging authorization code")

	data := url.Values{}
	data.Set("grant_type", "authorization_code")
	data.Set("code", code)
	data.Set("redirect_uri", p.callbackURL)

	req, err := http.NewRequestWithContext(ctx, "POST", p.tokenURL, strings.NewReader(data.Encode()))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Set("User-Agent", p.userAgent)
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
		return nil, fmt.Errorf("reddit token error [%d]: %s", resp.StatusCode, string(body))
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

func (p *RedditProvider) RefreshToken(ctx context.Context, refreshToken string) (*platform.TokenResult, error) {
	log.Printf("[REDDIT] refreshing token")

	data := url.Values{}
	data.Set("grant_type", "refresh_token")
	data.Set("refresh_token", refreshToken)

	req, err := http.NewRequestWithContext(ctx, "POST", p.tokenURL, strings.NewReader(data.Encode()))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Set("User-Agent", p.userAgent)
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
		return nil, fmt.Errorf("reddit refresh error [%d]: %s", resp.StatusCode, string(body))
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

func (p *RedditProvider) PublishPost(ctx context.Context, account *models.SocialAccount, post *models.Post) (string, error) {
	caption := ""
	if post.Caption != nil {
		caption = *post.Caption
	}

	// Reddit requires a subreddit and a title. For now, post to u_<username> (user profile)
	title := caption
	if len(title) > 300 {
		title = title[:297] + "..."
	}
	if title == "" {
		title = "New post from Socio"
	}

	data := url.Values{}
	data.Set("title", title)
	data.Set("kind", "self")
	data.Set("sr", "u_"+*account.PlatformUsername)
	if caption != "" {
		data.Set("text", caption)
	}
	data.Set("api_type", "json")

	req, err := http.NewRequestWithContext(ctx, "POST", p.apiBaseURL+"/api/submit", strings.NewReader(data.Encode()))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Set("Authorization", "Bearer "+account.AccessToken)
	req.Header.Set("User-Agent", p.userAgent)

	resp, err := p.httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("reddit publish failed: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	if resp.StatusCode >= 400 {
		return "", fmt.Errorf("reddit publish error [%d]: %s", resp.StatusCode, string(respBody))
	}

	var result struct {
		JSON struct {
			Data struct {
				ID   string `json:"id"`
				Name string `json:"name"`
			} `json:"data"`
		} `json:"json"`
	}
	if err := json.Unmarshal(respBody, &result); err != nil {
		return string(respBody), nil
	}

	return result.JSON.Data.Name, nil
}

func (p *RedditProvider) ValidateConnection(ctx context.Context, accessToken string) (bool, error) {
	req, err := http.NewRequestWithContext(ctx, "GET", p.apiBaseURL+"/api/v1/me", nil)
	if err != nil {
		return false, err
	}
	req.Header.Set("Authorization", "Bearer "+accessToken)
	req.Header.Set("User-Agent", p.userAgent)

	resp, err := p.httpClient.Do(req)
	if err != nil {
		return false, err
	}
	defer resp.Body.Close()

	return resp.StatusCode == http.StatusOK, nil
}

func (p *RedditProvider) GetUserInfo(ctx context.Context, accessToken string) (*platform.UserInfo, error) {
	log.Printf("[REDDIT] fetching user info")

	req, err := http.NewRequestWithContext(ctx, "GET", p.apiBaseURL+"/api/v1/me", nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+accessToken)
	req.Header.Set("User-Agent", p.userAgent)

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
		return nil, fmt.Errorf("reddit user info error [%d]: %s", resp.StatusCode, string(body))
	}

	var result struct {
		ID   string `json:"id"`
		Name string `json:"name"`
		Icon string `json:"icon_img"`
	}
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("failed to parse user info: %w", err)
	}

	return &platform.UserInfo{
		PlatformUserID:   result.Name,
		PlatformUsername: result.Name,
		AvatarURL:        result.Icon,
	}, nil
}
