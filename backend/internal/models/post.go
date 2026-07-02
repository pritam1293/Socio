package models

import (
	"time"

	"github.com/google/uuid"
)

type PostStatus string

const (
	PostStatusDraft     PostStatus = "draft"
	PostStatusScheduled PostStatus = "scheduled"
	PostStatusPublished PostStatus = "published"
	PostStatusFailed    PostStatus = "failed"
	PostStatusPartial   PostStatus = "partial"
)

type Post struct {
	ID          uuid.UUID  `json:"id"`
	UserID      uuid.UUID  `json:"user_id"`
	Caption     *string    `json:"caption"`
	Hashtags    []string   `json:"hashtags"`
	Status      PostStatus `json:"status"`
	ScheduledAt *time.Time `json:"scheduled_at"`
	PublishedAt *time.Time `json:"published_at"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
	Platforms   []PostPlatform `json:"platforms,omitempty"`
	MediaFiles  []MediaFile    `json:"media_files,omitempty"`
}

type CreatePostRequest struct {
	Caption     string   `json:"caption"`
	Hashtags    []string `json:"hashtags"`
	Platforms   []string `json:"platforms" binding:"required,min=1"`
	ScheduledAt *string  `json:"scheduled_at"`
	MediaIDs    []string `json:"media_ids"`
}

type UpdatePostRequest struct {
	Caption     *string  `json:"caption"`
	Hashtags    []string `json:"hashtags"`
	Platforms   []string `json:"platforms"`
	ScheduledAt *string  `json:"scheduled_at"`
	MediaIDs    []string `json:"media_ids"`
}

type PostPlatformStatus string

const (
	PlatformStatusPending   PostPlatformStatus = "pending"
	PlatformStatusPublished PostPlatformStatus = "published"
	PlatformStatusFailed    PostPlatformStatus = "failed"
)

type PostPlatform struct {
	ID             uuid.UUID          `json:"id"`
	PostID         uuid.UUID          `json:"post_id"`
	Platform       string             `json:"platform"`
	Status         PostPlatformStatus `json:"status"`
	PlatformPostID *string            `json:"platform_post_id"`
	PublishedAt    *time.Time         `json:"published_at"`
	ErrorMessage   *string            `json:"error_message"`
	CreatedAt      time.Time          `json:"created_at"`
}

type PostListRequest struct {
	Status *string `form:"status"`
	Limit  int     `form:"limit"`
	Offset int     `form:"offset"`
}
