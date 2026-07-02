package repository

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/pritam/socio-backend/internal/models"
)

type SocialRepo struct {
	pool *pgxpool.Pool
}

func NewSocialRepo(pool *pgxpool.Pool) *SocialRepo {
	return &SocialRepo{pool: pool}
}

func (r *SocialRepo) Create(ctx context.Context, account *models.SocialAccount) error {
	return r.pool.QueryRow(ctx, `
		INSERT INTO social_accounts (user_id, platform, platform_user_id, platform_username,
			access_token, refresh_token, token_expires_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		ON CONFLICT (user_id, platform)
		DO UPDATE SET platform_user_id = $3, platform_username = $4,
			access_token = $5, refresh_token = $6, token_expires_at = $7,
			is_active = true, updated_at = NOW()
		RETURNING id, created_at, updated_at
	`, account.UserID, account.Platform, account.PlatformUserID, account.PlatformUsername,
		account.AccessToken, account.RefreshToken, account.TokenExpiresAt,
	).Scan(&account.ID, &account.CreatedAt, &account.UpdatedAt)
}

func (r *SocialRepo) FindByUserAndPlatform(ctx context.Context, userID uuid.UUID, platform string) (*models.SocialAccount, error) {
	account := &models.SocialAccount{}
	err := r.pool.QueryRow(ctx, `
		SELECT id, user_id, platform, platform_user_id, platform_username,
			access_token, refresh_token, token_expires_at, is_active, created_at, updated_at
		FROM social_accounts
		WHERE user_id = $1 AND platform = $2 AND is_active = true
	`, userID, platform).Scan(
		&account.ID, &account.UserID, &account.Platform, &account.PlatformUserID,
		&account.PlatformUsername, &account.AccessToken, &account.RefreshToken,
		&account.TokenExpiresAt, &account.IsActive, &account.CreatedAt, &account.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return account, nil
}

func (r *SocialRepo) ListByUserID(ctx context.Context, userID uuid.UUID) ([]models.SocialAccount, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, user_id, platform, platform_user_id, platform_username,
			access_token, refresh_token, token_expires_at, is_active, created_at, updated_at
		FROM social_accounts
		WHERE user_id = $1
		ORDER BY created_at DESC
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var accounts []models.SocialAccount
	for rows.Next() {
		var a models.SocialAccount
		if err := rows.Scan(&a.ID, &a.UserID, &a.Platform, &a.PlatformUserID,
			&a.PlatformUsername, &a.AccessToken, &a.RefreshToken, &a.TokenExpiresAt,
			&a.IsActive, &a.CreatedAt, &a.UpdatedAt); err != nil {
			return nil, err
		}
		accounts = append(accounts, a)
	}
	return accounts, nil
}

func (r *SocialRepo) Deactivate(ctx context.Context, id uuid.UUID, userID uuid.UUID) error {
	_, err := r.pool.Exec(ctx, `
		UPDATE social_accounts SET is_active = false, updated_at = NOW()
		WHERE id = $1 AND user_id = $2
	`, id, userID)
	return err
}

func (r *SocialRepo) UpdateTokens(ctx context.Context, id uuid.UUID, accessToken, refreshToken *string, expiresAt *time.Time) error {
	_, err := r.pool.Exec(ctx, `
		UPDATE social_accounts
		SET access_token = COALESCE($2, access_token),
			refresh_token = COALESCE($3, refresh_token),
			token_expires_at = COALESCE($4, token_expires_at),
			updated_at = NOW()
		WHERE id = $1
	`, id, accessToken, refreshToken, expiresAt)
	return err
}
