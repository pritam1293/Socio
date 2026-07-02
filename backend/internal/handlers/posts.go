package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/pritam/socio-backend/internal/middleware"
	"github.com/pritam/socio-backend/internal/models"
	"github.com/pritam/socio-backend/internal/services"
)

type PostHandler struct {
	postService *services.PostService
}

func NewPostHandler(postService *services.PostService) *PostHandler {
	return &PostHandler{postService: postService}
}

func (h *PostHandler) Create(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var req models.CreatePostRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	post, err := h.postService.Create(c.Request.Context(), userID, &req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, post)
}

func (h *PostHandler) Get(c *gin.Context) {
	userID := middleware.GetUserID(c)

	postID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid post id"})
		return
	}

	post, err := h.postService.Get(c.Request.Context(), postID, userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, post)
}

func (h *PostHandler) List(c *gin.Context) {
	userID := middleware.GetUserID(c)

	status := c.Query("status")
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	posts, total, err := h.postService.List(c.Request.Context(), userID, &status, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"posts": posts,
		"total": total,
		"limit": limit,
		"offset": offset,
	})
}

func (h *PostHandler) Update(c *gin.Context) {
	userID := middleware.GetUserID(c)

	postID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid post id"})
		return
	}

	var req models.UpdatePostRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	post, err := h.postService.Update(c.Request.Context(), postID, userID, &req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, post)
}

func (h *PostHandler) Delete(c *gin.Context) {
	userID := middleware.GetUserID(c)

	postID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid post id"})
		return
	}

	if err := h.postService.Delete(c.Request.Context(), postID, userID); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "post deleted"})
}

func (h *PostHandler) PublishNow(c *gin.Context) {
	userID := middleware.GetUserID(c)

	postID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid post id"})
		return
	}

	post, err := h.postService.PublishNow(c.Request.Context(), postID, userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, post)
}

func (h *PostHandler) Dashboard(c *gin.Context) {
	userID := middleware.GetUserID(c)

	drafts, totalDrafts, _ := h.postService.List(c.Request.Context(), userID, strPtr("draft"), 5, 0)
	scheduled, totalScheduled, _ := h.postService.List(c.Request.Context(), userID, strPtr("scheduled"), 5, 0)
	published, totalPublished, _ := h.postService.List(c.Request.Context(), userID, strPtr("published"), 5, 0)
	failed, totalFailed, _ := h.postService.List(c.Request.Context(), userID, strPtr("failed"), 5, 0)

	c.JSON(http.StatusOK, gin.H{
		"overview": gin.H{
			"drafts":     totalDrafts,
			"scheduled":  totalScheduled,
			"published":  totalPublished,
			"failed":     totalFailed,
		},
		"upcoming":   scheduled,
		"published":  published,
		"failed":     failed,
		"drafts":     drafts,
	})
}

func strPtr(s string) *string {
	return &s
}
