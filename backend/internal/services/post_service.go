package services

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/pritam/socio-backend/internal/models"
	"github.com/pritam/socio-backend/internal/platform"
	"github.com/pritam/socio-backend/internal/repository"
)

type PostService struct {
	postRepo   *repository.PostRepo
	mediaRepo  *repository.MediaRepo
	socialRepo *repository.SocialRepo
	providers  map[string]platform.Provider
}

func NewPostService(
	postRepo *repository.PostRepo,
	mediaRepo *repository.MediaRepo,
	socialRepo *repository.SocialRepo,
	providers map[string]platform.Provider,
) *PostService {
	return &PostService{
		postRepo:   postRepo,
		mediaRepo:  mediaRepo,
		socialRepo: socialRepo,
		providers:  providers,
	}
}

func (s *PostService) Create(ctx context.Context, userID uuid.UUID, req *models.CreatePostRequest) (*models.Post, error) {
	post := &models.Post{
		UserID:   userID,
		Hashtags: req.Hashtags,
	}

	if req.Caption != "" {
		post.Caption = &req.Caption
	}

	if req.ScheduledAt != nil && *req.ScheduledAt != "" {
		parsed, err := time.Parse(time.RFC3339, *req.ScheduledAt)
		if err != nil {
			return nil, fmt.Errorf("invalid scheduled_at format, use RFC3339: %w", err)
		}
		if parsed.Before(time.Now()) {
			return nil, fmt.Errorf("scheduled_at must be in the future")
		}
		post.ScheduledAt = &parsed
		post.Status = models.PostStatusScheduled
	} else {
		post.Status = models.PostStatusDraft
	}

	if err := s.postRepo.Create(ctx, post); err != nil {
		return nil, fmt.Errorf("failed to create post: %w", err)
	}

	if err := s.postRepo.AddPlatforms(ctx, post.ID, req.Platforms); err != nil {
		return nil, fmt.Errorf("failed to add platforms: %w", err)
	}

	loaded, err := s.postRepo.FindByID(ctx, post.ID, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to load created post: %w", err)
	}

	return loaded, nil
}

func (s *PostService) Get(ctx context.Context, postID, userID uuid.UUID) (*models.Post, error) {
	post, err := s.postRepo.FindByID(ctx, postID, userID)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("post not found")
		}
		return nil, err
	}
	return post, nil
}

func (s *PostService) List(ctx context.Context, userID uuid.UUID, status *string, limit, offset int) ([]models.Post, int, error) {
	return s.postRepo.ListByUserID(ctx, userID, status, limit, offset)
}

func (s *PostService) Update(ctx context.Context, postID, userID uuid.UUID, req *models.UpdatePostRequest) (*models.Post, error) {
	post, err := s.postRepo.FindByID(ctx, postID, userID)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("post not found")
		}
		return nil, err
	}

	if req.Caption != nil {
		post.Caption = req.Caption
	}
	if req.Hashtags != nil {
		post.Hashtags = req.Hashtags
	}
	if req.ScheduledAt != nil && *req.ScheduledAt != "" {
		parsed, err := time.Parse(time.RFC3339, *req.ScheduledAt)
		if err != nil {
			return nil, fmt.Errorf("invalid scheduled_at format: %w", err)
		}
		post.ScheduledAt = &parsed
		post.Status = models.PostStatusScheduled
	}
	if req.Platforms != nil {
		if err := s.postRepo.RemovePlatforms(ctx, post.ID); err != nil {
			return nil, err
		}
		if err := s.postRepo.AddPlatforms(ctx, post.ID, req.Platforms); err != nil {
			return nil, err
		}
	}

	if err := s.postRepo.Update(ctx, post); err != nil {
		return nil, err
	}

	return s.postRepo.FindByID(ctx, postID, userID)
}

func (s *PostService) Delete(ctx context.Context, postID, userID uuid.UUID) error {
	_, err := s.postRepo.FindByID(ctx, postID, userID)
	if err != nil {
		if err == pgx.ErrNoRows {
			return fmt.Errorf("post not found")
		}
		return err
	}
	return s.postRepo.Delete(ctx, postID, userID)
}

func (s *PostService) PublishNow(ctx context.Context, postID, userID uuid.UUID) (*models.Post, error) {
	post, err := s.postRepo.FindByID(ctx, postID, userID)
	if err != nil {
		return nil, fmt.Errorf("post not found")
	}

	post.Status = models.PostStatusPublished
	post.PublishedAt = timePtr(time.Now())

	if err := s.postRepo.Update(ctx, post); err != nil {
		return nil, err
	}

	allSuccess := true
	for _, pp := range post.Platforms {
		provider, ok := s.providers[pp.Platform]
		if !ok {
			s.postRepo.UpdatePlatformStatus(ctx, pp.ID, "failed", nil, strPtr("unsupported platform"))
			allSuccess = false
			continue
		}

		account, err := s.socialRepo.FindByUserAndPlatform(ctx, userID, pp.Platform)
		if err != nil {
			s.postRepo.UpdatePlatformStatus(ctx, pp.ID, "failed", nil, strPtr("platform not connected"))
			allSuccess = false
			continue
		}

		platformPostID, err := provider.PublishPost(ctx, account, post)
		if err != nil {
			errMsg := err.Error()
			s.postRepo.UpdatePlatformStatus(ctx, pp.ID, "failed", nil, &errMsg)
			allSuccess = false
		} else {
			s.postRepo.UpdatePlatformStatus(ctx, pp.ID, "published", &platformPostID, nil)
		}
	}

	if !allSuccess {
		post.Status = models.PostStatusPartial
		s.postRepo.Update(ctx, post)
	}

	return s.postRepo.FindByID(ctx, postID, userID)
}
