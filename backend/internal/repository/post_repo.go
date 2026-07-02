package repository

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/pritam/socio-backend/internal/models"
)

type PostRepo struct {
	pool *pgxpool.Pool
}

func NewPostRepo(pool *pgxpool.Pool) *PostRepo {
	return &PostRepo{pool: pool}
}

func (r *PostRepo) Create(ctx context.Context, post *models.Post) error {
	return r.pool.QueryRow(ctx, `
		INSERT INTO posts (user_id, caption, hashtags, status, scheduled_at)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, created_at, updated_at
	`, post.UserID, post.Caption, post.Hashtags, post.Status, post.ScheduledAt,
	).Scan(&post.ID, &post.CreatedAt, &post.UpdatedAt)
}

func (r *PostRepo) FindByID(ctx context.Context, id uuid.UUID, userID uuid.UUID) (*models.Post, error) {
	post := &models.Post{}
	err := r.pool.QueryRow(ctx, `
		SELECT id, user_id, caption, hashtags, status, scheduled_at, published_at,
			   created_at, updated_at
		FROM posts WHERE id = $1 AND user_id = $2
	`, id, userID).Scan(
		&post.ID, &post.UserID, &post.Caption, &post.Hashtags, &post.Status,
		&post.ScheduledAt, &post.PublishedAt, &post.CreatedAt, &post.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	post.Platforms, err = r.findPlatformsByPostID(ctx, post.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to load platforms: %w", err)
	}

	post.MediaFiles, err = r.findMediaByPostID(ctx, post.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to load media: %w", err)
	}

	return post, nil
}

func (r *PostRepo) ListByUserID(ctx context.Context, userID uuid.UUID, status *string, limit, offset int) ([]models.Post, int, error) {
	if limit <= 0 {
		limit = 20
	}
	if offset < 0 {
		offset = 0
	}

	var total int
	args := []interface{}{userID}
	baseQuery := `FROM posts WHERE user_id = $1`

	if status != nil && *status != "" {
		args = append(args, *status)
		baseQuery += fmt.Sprintf(` AND status = $%d`, len(args))
	}

	err := r.pool.QueryRow(ctx, "SELECT COUNT(*) "+baseQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	args = append(args, limit, offset)
	query := fmt.Sprintf(`
		SELECT id, user_id, caption, hashtags, status, scheduled_at, published_at,
			   created_at, updated_at
		%s
		ORDER BY created_at DESC
		LIMIT $%d OFFSET $%d
	`, baseQuery, len(args)-1, len(args))

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var posts []models.Post
	for rows.Next() {
		var p models.Post
		if err := rows.Scan(&p.ID, &p.UserID, &p.Caption, &p.Hashtags, &p.Status,
			&p.ScheduledAt, &p.PublishedAt, &p.CreatedAt, &p.UpdatedAt); err != nil {
			return nil, 0, err
		}
		posts = append(posts, p)
	}

	for i := range posts {
		posts[i].Platforms, _ = r.findPlatformsByPostID(ctx, posts[i].ID)
		posts[i].MediaFiles, _ = r.findMediaByPostID(ctx, posts[i].ID)
	}

	return posts, total, nil
}

func (r *PostRepo) Update(ctx context.Context, post *models.Post) error {
	_, err := r.pool.Exec(ctx, `
		UPDATE posts SET caption = $2, hashtags = $3, status = $4,
			scheduled_at = $5, published_at = $6, updated_at = NOW()
		WHERE id = $1 AND user_id = $7
	`, post.ID, post.Caption, post.Hashtags, post.Status, post.ScheduledAt,
		post.PublishedAt, post.UserID)
	return err
}

func (r *PostRepo) Delete(ctx context.Context, id uuid.UUID, userID uuid.UUID) error {
	_, err := r.pool.Exec(ctx, "DELETE FROM posts WHERE id = $1 AND user_id = $2", id, userID)
	return err
}

func (r *PostRepo) AddPlatforms(ctx context.Context, postID uuid.UUID, platforms []string) error {
	query := `INSERT INTO post_platforms (post_id, platform) VALUES `
	values := []interface{}{postID}
	placeholders := []string{}

	for i, p := range platforms {
		values = append(values, p)
		placeholders = append(placeholders, fmt.Sprintf("($1, $%d)", i+2))
	}

	query += strings.Join(placeholders, ", ")
	_, err := r.pool.Exec(ctx, query, values...)
	return err
}

func (r *PostRepo) RemovePlatforms(ctx context.Context, postID uuid.UUID) error {
	_, err := r.pool.Exec(ctx, "DELETE FROM post_platforms WHERE post_id = $1", postID)
	return err
}

func (r *PostRepo) findPlatformsByPostID(ctx context.Context, postID uuid.UUID) ([]models.PostPlatform, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, post_id, platform, status, platform_post_id, published_at,
			   error_message, created_at
		FROM post_platforms WHERE post_id = $1
		ORDER BY created_at
	`, postID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var platforms []models.PostPlatform
	for rows.Next() {
		var pp models.PostPlatform
		if err := rows.Scan(&pp.ID, &pp.PostID, &pp.Platform, &pp.Status,
			&pp.PlatformPostID, &pp.PublishedAt, &pp.ErrorMessage, &pp.CreatedAt); err != nil {
			return nil, err
		}
		platforms = append(platforms, pp)
	}
	return platforms, nil
}

func (r *PostRepo) findMediaByPostID(ctx context.Context, postID uuid.UUID) ([]models.MediaFile, error) {
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

func (r *PostRepo) GetScheduledPosts(ctx context.Context, before time.Time) ([]models.Post, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, user_id, caption, hashtags, status, scheduled_at, published_at,
			   created_at, updated_at
		FROM posts
		WHERE status = 'scheduled' AND scheduled_at <= $1
		ORDER BY scheduled_at
	`, before)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var posts []models.Post
	for rows.Next() {
		var p models.Post
		if err := rows.Scan(&p.ID, &p.UserID, &p.Caption, &p.Hashtags, &p.Status,
			&p.ScheduledAt, &p.PublishedAt, &p.CreatedAt, &p.UpdatedAt); err != nil {
			return nil, err
		}
		posts = append(posts, p)
	}

	for i := range posts {
		posts[i].Platforms, _ = r.findPlatformsByPostID(ctx, posts[i].ID)
	}
	return posts, nil
}

func (r *PostRepo) UpdatePlatformStatus(ctx context.Context, postPlatformID uuid.UUID, status string, platformPostID, errorMsg *string) error {
	_, err := r.pool.Exec(ctx, `
		UPDATE post_platforms
		SET status = $2, platform_post_id = COALESCE($3, platform_post_id),
			error_message = $4, published_at = CASE WHEN $2 = 'published' THEN NOW() END
		WHERE id = $1
	`, postPlatformID, status, platformPostID, errorMsg)
	return err
}
