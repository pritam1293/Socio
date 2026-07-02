package config

import (
	"fmt"
	"os"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	ServerPort        string
	DatabaseURL       string
	JWTSecret         string
	JWTAccessExpiry   time.Duration
	JWTRefreshExpiry  time.Duration
	EncryptionKey     string
	SMTPHost          string
	SMTPPort          string
	SMTPUsername      string
	SMTPPassword      string
	SMTPFrom          string
	AppURL            string
	FrontendURL       string
	TwitterClientID   string
	TwitterSecret     string
	TwitterCallback   string
	RedditClientID    string
	RedditSecret      string
	RedditCallback    string
	ThreadsClientID   string
	ThreadsSecret     string
	ThreadsCallback   string
}

func Load() (*Config, error) {
	godotenv.Load()

	accessExpiry, err := time.ParseDuration(getEnv("JWT_ACCESS_EXPIRY", "15m"))
	if err != nil {
		return nil, fmt.Errorf("invalid JWT_ACCESS_EXPIRY: %w", err)
	}

	refreshExpiry, err := time.ParseDuration(getEnv("JWT_REFRESH_EXPIRY", "7d"))
	if err != nil {
		return nil, fmt.Errorf("invalid JWT_REFRESH_EXPIRY: %w", err)
	}

	encKey := getEnv("ENCRYPTION_KEY", "")
	if len(encKey) != 32 {
		return nil, fmt.Errorf("ENCRYPTION_KEY must be exactly 32 bytes")
	}

	return &Config{
		ServerPort:        getEnv("SERVER_PORT", "8080"),
		DatabaseURL:       getEnv("DATABASE_URL", ""),
		JWTSecret:         getEnv("JWT_SECRET", ""),
		JWTAccessExpiry:   accessExpiry,
		JWTRefreshExpiry:  refreshExpiry,
		EncryptionKey:     encKey,
		SMTPHost:          getEnv("SMTP_HOST", ""),
		SMTPPort:          getEnv("SMTP_PORT", "587"),
		SMTPUsername:      getEnv("SMTP_USERNAME", ""),
		SMTPPassword:      getEnv("SMTP_PASSWORD", ""),
		SMTPFrom:          getEnv("SMTP_FROM", ""),
		AppURL:            getEnv("APP_URL", "http://localhost:8080"),
		FrontendURL:       getEnv("FRONTEND_URL", "http://localhost:3000"),
		TwitterClientID:   getEnv("TWITTER_CLIENT_ID", ""),
		TwitterSecret:     getEnv("TWITTER_CLIENT_SECRET", ""),
		TwitterCallback:   getEnv("TWITTER_CALLBACK_URL", ""),
		RedditClientID:    getEnv("REDDIT_CLIENT_ID", ""),
		RedditSecret:      getEnv("REDDIT_CLIENT_SECRET", ""),
		RedditCallback:    getEnv("REDDIT_CALLBACK_URL", ""),
		ThreadsClientID:   getEnv("THREADS_CLIENT_ID", ""),
		ThreadsSecret:     getEnv("THREADS_CLIENT_SECRET", ""),
		ThreadsCallback:   getEnv("THREADS_CALLBACK_URL", ""),
	}, nil
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
