package models

import (
	"time"

	"github.com/google/uuid"
)

type SocialAccount struct {
	ID               uuid.UUID  `json:"id"`
	UserID           uuid.UUID  `json:"user_id"`
	Platform         string     `json:"platform"`
	PlatformUserID   *string    `json:"platform_user_id"`
	PlatformUsername *string    `json:"platform_username"`
	AccessToken      string     `json:"-"`
	RefreshToken     *string    `json:"-"`
	TokenExpiresAt   *time.Time `json:"token_expires_at"`
	IsActive         bool       `json:"is_active"`
	CreatedAt        time.Time  `json:"created_at"`
	UpdatedAt        time.Time  `json:"updated_at"`
}

type ConnectAccountRequest struct {
	Platform string `json:"platform" binding:"required"`
	Code     string `json:"code" binding:"required"`
	CodeVerifier string `json:"code_verifier"`
}
