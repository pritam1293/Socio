package handlers

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/pritam/socio-backend/internal/middleware"
	"github.com/pritam/socio-backend/internal/models"
	"github.com/pritam/socio-backend/internal/platform"
	"github.com/pritam/socio-backend/internal/repository"
	"github.com/pritam/socio-backend/internal/services"
)

type SocialHandler struct {
	socialRepo  *repository.SocialRepo
	crypto      *services.CryptoService
	providers   map[string]platform.Provider
	frontendURL string
}

func NewSocialHandler(socialRepo *repository.SocialRepo, crypto *services.CryptoService, providers map[string]platform.Provider, frontendURL string) *SocialHandler {
	return &SocialHandler{
		socialRepo:  socialRepo,
		crypto:      crypto,
		providers:   providers,
		frontendURL: frontendURL,
	}
}

func (h *SocialHandler) ConnectURL(c *gin.Context) {
	userID := middleware.GetUserID(c)
	platform := c.Query("platform")
	if platform == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "platform query parameter required"})
		return
	}

	provider, ok := h.providers[platform]
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "unsupported platform"})
		return
	}

	state := uuid.New().String()
	pair := generatePKCE()

	log.Printf("[OAUTH] generated state=%s verifier_len=%d for platform=%s", state[:8]+"...", len(pair.verifier), platform)

	c.SetCookie("oauth_state", state, 600, "/", "", false, false)
	c.SetCookie("oauth_verifier", pair.verifier, 600, "/", "", false, false)
	c.SetCookie("oauth_user_id", userID.String(), 600, "/", "", false, false)

	authURL := provider.GetAuthURL(state, pair.challenge)

	c.JSON(http.StatusOK, gin.H{
		"auth_url": authURL,
	})
}

func (h *SocialHandler) Callback(c *gin.Context) {
	platform := c.Param("platform")

	log.Printf("[OAUTH] callback received: platform=%s", platform)

	userIDStr, err := c.Cookie("oauth_user_id")
	if err != nil {
		log.Printf("[OAUTH] no user_id cookie: %v (did you sign in on this browser?)", err)
		c.Redirect(http.StatusTemporaryRedirect, h.frontendURL+"/connect-accounts?error=oauth+cookie+not+found+sign+in+again")
		return
	}
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		log.Printf("[OAUTH] invalid user_id cookie: %v", err)
		c.Redirect(http.StatusTemporaryRedirect, h.frontendURL+"/connect-accounts?error=invalid+session")
		return
	}

	provider, ok := h.providers[platform]
	if !ok {
		log.Printf("[OAUTH] unsupported platform: %s", platform)
		c.Redirect(http.StatusTemporaryRedirect, h.frontendURL+"/connect-accounts?error=unsupported+platform")
		return
	}

	code := c.Query("code")
	state := c.Query("state")
	errParam := c.Query("error")

	if errParam != "" {
		desc := c.Query("error_description")
		log.Printf("[OAUTH] authorization denied: error=%s desc=%s", errParam, desc)
		c.Redirect(http.StatusTemporaryRedirect, h.frontendURL+"/connect-accounts?error="+errParam)
		return
	}

	cookieState, err := c.Cookie("oauth_state")
	if err != nil || state == "" || state != cookieState {
		log.Printf("[OAUTH] state mismatch: query=%s cookie=%s", state, cookieState)
		c.Redirect(http.StatusTemporaryRedirect, h.frontendURL+"/connect-accounts?error=invalid+state")
		return
	}

	codeVerifier, _ := c.Cookie("oauth_verifier")
	log.Printf("[OAUTH] exchanging code for tokens, code_len=%d verifier_len=%d", len(code), len(codeVerifier))

	tokenResult, err := provider.ExchangeCode(c.Request.Context(), code, codeVerifier)
	if err != nil {
		log.Printf("[OAUTH] token exchange failed: %v", err)
		c.Redirect(http.StatusTemporaryRedirect, h.frontendURL+"/connect-accounts?error=token+exchange+failed")
		return
	}

	log.Printf("[OAUTH] token exchange success, expires_in=%d", tokenResult.ExpiresIn)

	userInfo, err := provider.GetUserInfo(c.Request.Context(), tokenResult.AccessToken)
	if err != nil {
		log.Printf("[OAUTH] get user info failed: %v", err)
		c.Redirect(http.StatusTemporaryRedirect, h.frontendURL+"/connect-accounts?error=user+info+failed")
		return
	}

	log.Printf("[OAUTH] user info fetched: id=%s username=%s", userInfo.PlatformUserID, userInfo.PlatformUsername)

	encryptedAccessToken, err := h.crypto.Encrypt(tokenResult.AccessToken)
	if err != nil {
		log.Printf("[OAUTH] token encryption failed: %v", err)
		c.Redirect(http.StatusTemporaryRedirect, h.frontendURL+"/connect-accounts?error=encryption+failed")
		return
	}

	var encryptedRefreshToken *string
	if tokenResult.RefreshToken != "" {
		encrypted, err := h.crypto.Encrypt(tokenResult.RefreshToken)
		if err != nil {
			log.Printf("[OAUTH] refresh token encryption failed: %v", err)
			c.Redirect(http.StatusTemporaryRedirect, h.frontendURL+"/connect-accounts?error=encryption+failed")
			return
		}
		encryptedRefreshToken = &encrypted
	}

	var expiresAt *time.Time
	if tokenResult.ExpiresIn > 0 {
		t := time.Now().Add(time.Duration(tokenResult.ExpiresIn) * time.Second)
		expiresAt = &t
	}

	account := &models.SocialAccount{
		UserID:           userID,
		Platform:         platform,
		PlatformUserID:   &userInfo.PlatformUserID,
		PlatformUsername: &userInfo.PlatformUsername,
		AccessToken:      encryptedAccessToken,
		RefreshToken:     encryptedRefreshToken,
		TokenExpiresAt:   expiresAt,
	}

	if err := h.socialRepo.Create(c.Request.Context(), account); err != nil {
		log.Printf("[OAUTH] failed to save account: %v", err)
		c.Redirect(http.StatusTemporaryRedirect, h.frontendURL+"/connect-accounts?error=save+failed")
		return
	}

	log.Printf("[OAUTH] account connected: platform=%s username=%s", platform, userInfo.PlatformUsername)
	c.Redirect(http.StatusTemporaryRedirect, h.frontendURL+"/connect-accounts?connected=twitter&username="+urlEncode(userInfo.PlatformUsername))
}

func (h *SocialHandler) ListAccounts(c *gin.Context) {
	userID := middleware.GetUserID(c)

	accounts, err := h.socialRepo.ListByUserID(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	sanitized := make([]gin.H, len(accounts))
	for i, a := range accounts {
		sanitized[i] = sanitizeAccount(&a)
	}

	c.JSON(http.StatusOK, gin.H{"accounts": sanitized})
}

func (h *SocialHandler) Disconnect(c *gin.Context) {
	userID := middleware.GetUserID(c)

	accountID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid account id"})
		return
	}

	if err := h.socialRepo.Deactivate(c.Request.Context(), accountID, userID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "account disconnected"})
}

func sanitizeAccount(a *models.SocialAccount) gin.H {
	return gin.H{
		"id":                a.ID,
		"platform":          a.Platform,
		"platform_username": a.PlatformUsername,
		"is_active":         a.IsActive,
		"created_at":        a.CreatedAt,
	}
}

type pkcePair struct {
	challenge string
	verifier  string
}

func generatePKCE() pkcePair {
	verifierBytes := make([]byte, 32)
	rand.Read(verifierBytes)
	verifier := base64.RawURLEncoding.EncodeToString(verifierBytes)

	hash := sha256.Sum256([]byte(verifier))
	challenge := base64.RawURLEncoding.EncodeToString(hash[:])

	return pkcePair{challenge: challenge, verifier: verifier}
}

func urlEncode(s string) string {
	return strings.ReplaceAll(s, " ", "+")
}
