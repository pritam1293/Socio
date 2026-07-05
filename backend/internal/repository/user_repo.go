package repository

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/pritam/socio-backend/internal/models"
)

type UserRepo struct {
	pool *pgxpool.Pool
}

func NewUserRepo(pool *pgxpool.Pool) *UserRepo {
	return &UserRepo{pool: pool}
}

func (r *UserRepo) Create(ctx context.Context, user *models.User) error {
	return r.pool.QueryRow(ctx, `
		INSERT INTO users (email, full_name, avatar_url, email_verified,
			verification_token, verification_token_expires_at)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, created_at, updated_at
	`, user.Email, user.FullName, user.AvatarURL, user.EmailVerified,
		user.VerificationToken, user.VerificationTokenExpiresAt,
	).Scan(&user.ID, &user.CreatedAt, &user.UpdatedAt)
}

func (r *UserRepo) FindByEmail(ctx context.Context, email string) (*models.User, error) {
	user := &models.User{}
	err := r.pool.QueryRow(ctx, `
		SELECT id, email, full_name, avatar_url, email_verified,
			verification_token, verification_token_expires_at, refresh_token_hash,
			created_at, updated_at
		FROM users WHERE email = $1
	`, email).Scan(
		&user.ID, &user.Email, &user.FullName, &user.AvatarURL,
		&user.EmailVerified, &user.VerificationToken, &user.VerificationTokenExpiresAt,
		&user.RefreshTokenHash, &user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return user, nil
}

func (r *UserRepo) FindByID(ctx context.Context, id uuid.UUID) (*models.User, error) {
	user := &models.User{}
	err := r.pool.QueryRow(ctx, `
		SELECT id, email, full_name, avatar_url, email_verified,
			verification_token, verification_token_expires_at, refresh_token_hash,
			created_at, updated_at
		FROM users WHERE id = $1
	`, id).Scan(
		&user.ID, &user.Email, &user.FullName, &user.AvatarURL,
		&user.EmailVerified, &user.VerificationToken, &user.VerificationTokenExpiresAt,
		&user.RefreshTokenHash, &user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return user, nil
}

func (r *UserRepo) FindByVerificationToken(ctx context.Context, token string) (*models.User, error) {
	user := &models.User{}
	err := r.pool.QueryRow(ctx, `
		SELECT id, email, full_name, avatar_url, email_verified,
			verification_token, verification_token_expires_at, refresh_token_hash,
			created_at, updated_at
		FROM users WHERE verification_token = $1 AND verification_token_expires_at > $2
	`, token, time.Now()).Scan(
		&user.ID, &user.Email, &user.FullName, &user.AvatarURL,
		&user.EmailVerified, &user.VerificationToken, &user.VerificationTokenExpiresAt,
		&user.RefreshTokenHash, &user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return user, nil
}

func (r *UserRepo) MarkVerified(ctx context.Context, id uuid.UUID) error {
	_, err := r.pool.Exec(ctx, `
		UPDATE users SET email_verified = true, verification_token = NULL,
			verification_token_expires_at = NULL, updated_at = NOW()
		WHERE id = $1
	`, id)
	return err
}

func (r *UserRepo) UpdateVerificationToken(ctx context.Context, id uuid.UUID, token string, expiresAt time.Time) error {
	_, err := r.pool.Exec(ctx, `
		UPDATE users SET verification_token = $2, verification_token_expires_at = $3,
			updated_at = NOW()
		WHERE id = $1
	`, id, token, expiresAt)
	return err
}

func (r *UserRepo) UpdateRefreshTokenHash(ctx context.Context, id uuid.UUID, hash *string) error {
	_, err := r.pool.Exec(ctx, `
		UPDATE users SET refresh_token_hash = $2, updated_at = NOW() WHERE id = $1
	`, id, hash)
	return err
}

func (r *UserRepo) FindByRefreshTokenHash(ctx context.Context, hash string) (*models.User, error) {
	user := &models.User{}
	err := r.pool.QueryRow(ctx, `
		SELECT id, email, full_name, avatar_url, email_verified,
			verification_token, verification_token_expires_at, refresh_token_hash,
			created_at, updated_at
		FROM users WHERE refresh_token_hash = $1
	`, hash).Scan(
		&user.ID, &user.Email, &user.FullName, &user.AvatarURL,
		&user.EmailVerified, &user.VerificationToken, &user.VerificationTokenExpiresAt,
		&user.RefreshTokenHash, &user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return user, nil
}

func (r *UserRepo) Update(ctx context.Context, user *models.User) error {
	_, err := r.pool.Exec(ctx, `
		UPDATE users SET full_name = $2, avatar_url = $3, updated_at = NOW() WHERE id = $1
	`, user.ID, user.FullName, user.AvatarURL)
	return err
}
