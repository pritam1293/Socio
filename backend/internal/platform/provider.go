package platform

import (
	"context"

	"github.com/pritam/socio-backend/internal/models"
)

type Provider interface {
	GetName() string
	GetAuthURL(state, codeChallenge string) string
	ExchangeCode(ctx context.Context, code, codeVerifier string) (*TokenResult, error)
	RefreshToken(ctx context.Context, refreshToken string) (*TokenResult, error)
	PublishPost(ctx context.Context, account *models.SocialAccount, post *models.Post) (string, error)
	ValidateConnection(ctx context.Context, accessToken string) (bool, error)
	GetUserInfo(ctx context.Context, accessToken string) (*UserInfo, error)
}

type TokenResult struct {
	AccessToken  string
	RefreshToken string
	ExpiresIn    int64
}

type UserInfo struct {
	PlatformUserID   string
	PlatformUsername string
	AvatarURL        string
}
