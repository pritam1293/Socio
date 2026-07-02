package handlers

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/pritam/socio-backend/internal/middleware"
	"github.com/pritam/socio-backend/internal/models"
	"github.com/pritam/socio-backend/internal/repository"
)

type MediaHandler struct {
	mediaRepo  *repository.MediaRepo
	uploadDir  string
}

func NewMediaHandler(mediaRepo *repository.MediaRepo, uploadDir string) *MediaHandler {
	return &MediaHandler{
		mediaRepo: mediaRepo,
		uploadDir: uploadDir,
	}
}

func (h *MediaHandler) Upload(c *gin.Context) {
	_ = middleware.GetUserID(c)

	postID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid post id"})
		return
	}

	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "file is required"})
		return
	}
	defer file.Close()

	fileType := "image"
	contentType := header.Header.Get("Content-Type")
	if contentType != "" {
		if isVideo(contentType) {
			fileType = "video"
		}
	}

	userDir := filepath.Join(h.uploadDir, postID.String())
	if err := os.MkdirAll(userDir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create upload directory"})
		return
	}

	ext := filepath.Ext(header.Filename)
	fileName := fmt.Sprintf("%s%s", uuid.New().String(), ext)
	filePath := filepath.Join(userDir, fileName)

	dst, err := os.Create(filePath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create file"})
		return
	}
	defer dst.Close()

	size, err := io.Copy(dst, file)
	if err != nil {
		os.Remove(filePath)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save file"})
		return
	}

	fileURL := fmt.Sprintf("/uploads/%s/%s", postID.String(), fileName)

	name := header.Filename
	media := &models.MediaFile{
		PostID:   postID,
		FileURL:  fileURL,
		FileType: fileType,
		FileName: &name,
		FileSize: &size,
	}

	if err := h.mediaRepo.Create(c.Request.Context(), media); err != nil {
		os.Remove(filePath)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save media record"})
		return
	}

	c.JSON(http.StatusCreated, media)
}

func (h *MediaHandler) Delete(c *gin.Context) {
	_ = middleware.GetUserID(c)

	mediaID, err := uuid.Parse(c.Param("mediaId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid media id"})
		return
	}

	if err := h.mediaRepo.Delete(c.Request.Context(), mediaID); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "media deleted"})
}

func isVideo(contentType string) bool {
	videoTypes := map[string]bool{
		"video/mp4":        true,
		"video/quicktime":  true,
		"video/x-msvideo":  true,
		"video/webm":       true,
	}
	return videoTypes[contentType]
}
