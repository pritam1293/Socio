package handlers

import (
	"net/http"
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
	socialRepo *repository.SocialRepo
	crypto     *services.CryptoService
	providers  map[string]platform.Provider
}

func NewSocialHandler(socialRepo *repository.SocialRepo, crypto *services.CryptoService, providers map[string]platform.Provider) *SocialHandler {
	return &SocialHandler{
		socialRepo: socialRepo,
		crypto:     crypto,
		providers:  providers,
	}
}

func (h *SocialHandler) ConnectURL(c *gin.Context) {
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
	codeChallenge := generateCodeChallenge()

	c.SetCookie("oauth_state", state, 600, "/", "", false, true)
	c.SetCookie("oauth_verifier", codeChallenge.verifier, 600, "/", "", false, true)

	authURL := provider.GetAuthURL(state, codeChallenge.challenge)

	c.JSON(http.StatusOK, gin.H{
		"auth_url": authURL,
	})
}

func (h *SocialHandler) Callback(c *gin.Context) {
	userID := middleware.GetUserID(c)
	platform := c.Param("platform")

	provider, ok := h.providers[platform]
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "unsupported platform"})
		return
	}

	code := c.Query("code")
	state := c.Query("state")

	cookieState, _ := c.Cookie("oauth_state")
	if state == "" || state != cookieState {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid state parameter"})
		return
	}

	codeVerifier, _ := c.Cookie("oauth_verifier")

	tokenResult, err := provider.ExchangeCode(c.Request.Context(), code, codeVerifier)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "failed to exchange code: " + err.Error()})
		return
	}

	userInfo, err := provider.GetUserInfo(c.Request.Context(), tokenResult.AccessToken)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "failed to get user info: " + err.Error()})
		return
	}

	encryptedAccessToken, err := h.crypto.Encrypt(tokenResult.AccessToken)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to encrypt token"})
		return
	}

	var encryptedRefreshToken *string
	if tokenResult.RefreshToken != "" {
		encrypted, err := h.crypto.Encrypt(tokenResult.RefreshToken)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to encrypt refresh token"})
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
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save account: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":  "account connected successfully",
		"account":  sanitizeAccount(account),
	})
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

type codeChallengePair struct {
	challenge string
	verifier  string
}

func generateCodeChallenge() codeChallengePair {
	return codeChallengePair{
		challenge: uuid.New().String() + uuid.New().String(),
		verifier:  uuid.New().String() + uuid.New().String(),
	}
}
