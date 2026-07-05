package models

import (
	"time"

	"github.com/google/uuid"
)

type User struct {
	ID                          uuid.UUID  `json:"id"`
	Email                       string     `json:"email"`
	PasswordHash                string     `json:"-"`
	FullName                    string     `json:"full_name"`
	AvatarURL                   *string    `json:"avatar_url"`
	EmailVerified               bool       `json:"email_verified"`
	VerificationToken           *string    `json:"-"`
	VerificationTokenExpiresAt  *time.Time `json:"-"`
	RefreshTokenHash            *string    `json:"-"`
	CreatedAt                   time.Time  `json:"created_at"`
	UpdatedAt                   time.Time  `json:"updated_at"`
}

type RegisterRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
	FullName string `json:"full_name" binding:"required,min=2"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type VerifyEmailRequest struct {
	Token string `json:"token" binding:"required"`
}

type ResendVerificationRequest struct {
	Email string `json:"email" binding:"required,email"`
}

type RefreshTokenRequest struct {
	RefreshToken string `json:"refresh_token" binding:"required"`
}

type AuthResponse struct {
	User         User   `json:"user"`
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
}

type TokenPair struct {
	AccessToken  string
	RefreshToken string
}
