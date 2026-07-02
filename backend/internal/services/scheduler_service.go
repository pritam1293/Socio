package services

import (
	"context"
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/pritam/socio-backend/internal/models"
	"github.com/pritam/socio-backend/internal/repository"
)

type SchedulerService struct {
	postRepo    *repository.PostRepo
	socialRepo  *repository.SocialRepo
	schedRepo   *repository.SchedulerRepo
	publishFunc func(ctx context.Context, postID, userID uuid.UUID) (*models.Post, error)
	mu          sync.Mutex
	stopCh      chan struct{}
}

func NewSchedulerService(
	postRepo *repository.PostRepo,
	socialRepo *repository.SocialRepo,
	schedRepo *repository.SchedulerRepo,
	publishFunc func(ctx context.Context, postID, userID uuid.UUID) (*models.Post, error),
) *SchedulerService {
	return &SchedulerService{
		postRepo:    postRepo,
		socialRepo:  socialRepo,
		schedRepo:   schedRepo,
		publishFunc: publishFunc,
		stopCh:      make(chan struct{}),
	}
}

func (s *SchedulerService) Start(ctx context.Context) {
	log.Println("[scheduler] started")
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-s.stopCh:
			log.Println("[scheduler] stopped")
			return
		case <-ticker.C:
			s.processJobs(ctx)
		case <-ctx.Done():
			return
		}
	}
}

func (s *SchedulerService) Stop() {
	close(s.stopCh)
}

func (s *SchedulerService) processJobs(ctx context.Context) {
	s.mu.Lock()
	defer s.mu.Unlock()

	jobs, err := s.schedRepo.GetPendingJobs(ctx, 10)
	if err != nil {
		log.Printf("[scheduler] error fetching jobs: %v", err)
		return
	}

	for _, job := range jobs {
		go s.processJob(ctx, job)
	}
}

func (s *SchedulerService) processJob(ctx context.Context, job models.ScheduledJob) {
	if err := s.schedRepo.MarkProcessing(ctx, job.ID); err != nil {
		log.Printf("[scheduler] error marking job %s as processing: %v", job.ID, err)
		return
	}

	post, err := s.postRepo.FindByID(ctx, job.PostID, uuid.Nil)
	if err != nil {
		errMsg := fmt.Sprintf("post not found: %v", err)
		s.schedRepo.MarkFailed(ctx, job.ID, errMsg)
		return
	}

	_, err = s.publishFunc(ctx, post.ID, post.UserID)
	if err != nil {
		errMsg := fmt.Sprintf("publish failed: %v", err)
		s.schedRepo.MarkFailed(ctx, job.ID, errMsg)
		return
	}

	s.schedRepo.MarkCompleted(ctx, job.ID)
	log.Printf("[scheduler] job %s completed for post %s", job.ID, job.PostID)
}
