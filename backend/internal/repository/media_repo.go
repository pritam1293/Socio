package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/pritam/socio-backend/internal/models"
)

type MediaRepo struct {
	pool *pgxpool.Pool
}

func NewMediaRepo(pool *pgxpool.Pool) *MediaRepo {
	return &MediaRepo{pool: pool}
}

func (r *MediaRepo) Create(ctx context.Context, media *models.MediaFile) error {
	return r.pool.QueryRow(ctx, `
		INSERT INTO media_files (post_id, file_url, file_type, file_name, file_size)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, created_at
	`, media.PostID, media.FileURL, media.FileType, media.FileName, media.FileSize,
	).Scan(&media.ID, &media.CreatedAt)
}

func (r *MediaRepo) FindByPostID(ctx context.Context, postID uuid.UUID) ([]models.MediaFile, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, post_id, file_url, file_type, file_name, file_size, created_at
		FROM media_files WHERE post_id = $1 ORDER BY created_at
	`, postID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var media []models.MediaFile
	for rows.Next() {
		var m models.MediaFile
		if err := rows.Scan(&m.ID, &m.PostID, &m.FileURL, &m.FileType,
			&m.FileName, &m.FileSize, &m.CreatedAt); err != nil {
			return nil, err
		}
		media = append(media, m)
	}
	return media, nil
}

func (r *MediaRepo) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := r.pool.Exec(ctx, "DELETE FROM media_files WHERE id = $1", id)
	return err
}
