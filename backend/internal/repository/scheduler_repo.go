package repository

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/pritam/socio-backend/internal/models"
)

type SchedulerRepo struct {
	pool *pgxpool.Pool
}

func NewSchedulerRepo(pool *pgxpool.Pool) *SchedulerRepo {
	return &SchedulerRepo{pool: pool}
}

func (r *SchedulerRepo) CreateJob(ctx context.Context, job *models.ScheduledJob) error {
	return r.pool.QueryRow(ctx, `
		INSERT INTO scheduled_jobs (post_id, platform, scheduled_at, status,
			max_attempts, next_attempt_at)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, created_at, updated_at
	`, job.PostID, job.Platform, job.ScheduledAt, job.Status, job.MaxAttempts,
		job.NextAttemptAt,
	).Scan(&job.ID, &job.CreatedAt, &job.UpdatedAt)
}

func (r *SchedulerRepo) GetPendingJobs(ctx context.Context, limit int) ([]models.ScheduledJob, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, post_id, platform, scheduled_at, status, attempt_count,
			max_attempts, next_attempt_at, last_error, created_at, updated_at
		FROM scheduled_jobs
		WHERE status IN ('pending', 'failed')
		AND attempt_count < max_attempts
		AND (next_attempt_at IS NULL OR next_attempt_at <= $1)
		ORDER BY scheduled_at
		LIMIT $2
		FOR UPDATE SKIP LOCKED
	`, time.Now(), limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var jobs []models.ScheduledJob
	for rows.Next() {
		var j models.ScheduledJob
		if err := rows.Scan(&j.ID, &j.PostID, &j.Platform, &j.ScheduledAt,
			&j.Status, &j.AttemptCount, &j.MaxAttempts, &j.NextAttemptAt,
			&j.LastError, &j.CreatedAt, &j.UpdatedAt); err != nil {
			return nil, err
		}
		jobs = append(jobs, j)
	}
	return jobs, nil
}

func (r *SchedulerRepo) MarkProcessing(ctx context.Context, id uuid.UUID) error {
	_, err := r.pool.Exec(ctx, `
		UPDATE scheduled_jobs
		SET status = 'processing', attempt_count = attempt_count + 1, updated_at = NOW()
		WHERE id = $1
	`, id)
	return err
}

func (r *SchedulerRepo) MarkCompleted(ctx context.Context, id uuid.UUID) error {
	_, err := r.pool.Exec(ctx, `
		UPDATE scheduled_jobs
		SET status = 'completed', updated_at = NOW()
		WHERE id = $1
	`, id)
	return err
}

func (r *SchedulerRepo) MarkFailed(ctx context.Context, id uuid.UUID, errMsg string) error {
	_, err := r.pool.Exec(ctx, `
		UPDATE scheduled_jobs
		SET status = 'failed', last_error = $2,
			next_attempt_at = NOW() + INTERVAL '5 minutes',
			updated_at = NOW()
		WHERE id = $1
	`, id, errMsg)
	return err
}
