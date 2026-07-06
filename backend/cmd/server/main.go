package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"strings"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/pritam/socio-backend/internal/config"
	"github.com/pritam/socio-backend/internal/database"
	"github.com/pritam/socio-backend/internal/handlers"
	"github.com/pritam/socio-backend/internal/middleware"
	"github.com/pritam/socio-backend/internal/platform"
	"github.com/pritam/socio-backend/internal/platform/twitter"
	"github.com/pritam/socio-backend/internal/platform/reddit"
	"github.com/pritam/socio-backend/internal/repository"
	"github.com/pritam/socio-backend/internal/services"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("failed to load config: %v", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	pool, err := database.Connect(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}
	defer pool.Close()

	migrationsDir := filepath.Join("migrations")
	if err := database.RunMigrations(context.Background(), pool, migrationsDir); err != nil {
		log.Fatalf("failed to run migrations: %v", err)
	}

	userRepo := repository.NewUserRepo(pool)
	postRepo := repository.NewPostRepo(pool)
	mediaRepo := repository.NewMediaRepo(pool)
	socialRepo := repository.NewSocialRepo(pool)
	schedRepo := repository.NewSchedulerRepo(pool)

	cryptoService := services.NewCryptoService(cfg.EncryptionKey)

	emailService := services.NewEmailService(
		cfg.SMTPHost, cfg.SMTPPort, cfg.SMTPUsername, cfg.SMTPPassword, cfg.SMTPFrom,
	)

	authService := services.NewAuthService(
		userRepo, cfg.JWTSecret, cfg.JWTAccessExpiry, cfg.JWTRefreshExpiry,
		cfg.AppURL, cfg.FrontendURL, emailService,
	)

	providers := map[string]platform.Provider{}

	if cfg.TwitterClientID != "" {
		providers["twitter"] = twitter.NewTwitterProvider(
			cfg.TwitterClientID, cfg.TwitterSecret, cfg.TwitterCallback,
		)
	}

	if cfg.RedditClientID != "" {
		providers["reddit"] = reddit.NewRedditProvider(
			cfg.RedditClientID, cfg.RedditSecret, cfg.RedditCallback,
		)
	}

	postService := services.NewPostService(postRepo, mediaRepo, socialRepo, providers)

	schedulerService := services.NewSchedulerService(
		postRepo, socialRepo, schedRepo, postService.PublishNow,
	)

	go schedulerService.Start(context.Background())
	defer schedulerService.Stop()

	router := gin.Default()

	router.MaxMultipartMemory = 32 << 20

	router.Use(corsMiddleware(cfg.FrontendURL))

	authHandler := handlers.NewAuthHandler(authService)
	postHandler := handlers.NewPostHandler(postService)
	socialHandler := handlers.NewSocialHandler(socialRepo, cryptoService, providers, cfg.FrontendURL)
	mediaHandler := handlers.NewMediaHandler(mediaRepo, "uploads")

	uploadDir := "uploads"
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		log.Fatalf("failed to create uploads directory: %v", err)
	}
	router.Static("/uploads", uploadDir)

	api := router.Group("/api/v1")
	{
		auth := api.Group("/auth")
		{
			auth.POST("/register", authHandler.Register)
			auth.GET("/verify", authHandler.VerifyEmail)
			auth.POST("/request-login", authHandler.RequestLogin)
			auth.POST("/resend-verification", authHandler.ResendVerification)
			auth.POST("/refresh", authHandler.RefreshToken)
		}

		api.GET("/social/:platform/callback", socialHandler.Callback)

		protected := api.Group("")
		protected.Use(middleware.AuthMiddleware(authService))
		{
			protected.POST("/auth/logout", authHandler.Logout)

			protected.GET("/social/connect", socialHandler.ConnectURL)
			protected.GET("/social/accounts", socialHandler.ListAccounts)
			protected.DELETE("/social/accounts/:id", socialHandler.Disconnect)

			protected.POST("/posts", postHandler.Create)
			protected.GET("/posts", postHandler.List)
			protected.GET("/posts/dashboard", postHandler.Dashboard)
			protected.GET("/posts/:id", postHandler.Get)
			protected.PUT("/posts/:id", postHandler.Update)
			protected.DELETE("/posts/:id", postHandler.Delete)
			protected.POST("/posts/:id/publish", postHandler.PublishNow)

			protected.POST("/posts/:id/media", mediaHandler.Upload)
			protected.DELETE("/media/:mediaId", mediaHandler.Delete)
		}
	}

	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok", "service": "socio"})
	})

	router.GET("/favicon.ico", func(c *gin.Context) {
		c.Status(http.StatusNoContent)
	})

	srv := &http.Server{
		Addr:         ":" + cfg.ServerPort,
		Handler:      router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		log.Printf("socio server starting on port %s", cfg.ServerPort)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("server failed: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("shutting down server...")

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer shutdownCancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Fatalf("server forced to shutdown: %v", err)
	}

	log.Println("server stopped")
}

func corsMiddleware(frontendURL string) gin.HandlerFunc {
	return func(c *gin.Context) {
		origin := c.GetHeader("Origin")
		if origin == "" {
			origin = frontendURL
		}

		allowedOrigin := frontendURL
		if strings.HasPrefix(origin, "http://localhost:") {
			allowedOrigin = origin
		}

		c.Header("Access-Control-Allow-Origin", allowedOrigin)
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Authorization")
		c.Header("Access-Control-Allow-Credentials", "true")
		c.Header("Vary", "Origin")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	}
}
