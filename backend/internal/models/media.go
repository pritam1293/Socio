package models

import (
	"time"

	"github.com/google/uuid"
)

type MediaFile struct {
	ID        uuid.UUID `json:"id"`
	PostID    uuid.UUID `json:"post_id"`
	FileURL   string    `json:"file_url"`
	FileType  string    `json:"file_type"`
	FileName  *string   `json:"file_name"`
	FileSize  *int64    `json:"file_size"`
	CreatedAt time.Time `json:"created_at"`
}
