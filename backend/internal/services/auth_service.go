package services

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"log"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/pritam/socio-backend/internal/models"
	"github.com/pritam/socio-backend/internal/repository"
)

type AuthService struct {
	userRepo    *repository.UserRepo
	jwtSecret   []byte
	accessTTL   time.Duration
	refreshTTL  time.Duration
	appURL      string
	frontendURL string
	emailService *EmailService
}

func NewAuthService(
	userRepo *repository.UserRepo,
	jwtSecret string,
	accessTTL, refreshTTL time.Duration,
	appURL, frontendURL string,
	emailService *EmailService,
) *AuthService {
	return &AuthService{
		userRepo:     userRepo,
		jwtSecret:    []byte(jwtSecret),
		accessTTL:    accessTTL,
		refreshTTL:   refreshTTL,
		appURL:       appURL,
		frontendURL:  frontendURL,
		emailService: emailService,
	}
}

func (s *AuthService) Register(ctx context.Context, req *models.RegisterRequest) (*models.User, error) {
	existing, err := s.userRepo.FindByEmail(ctx, req.Email)
	if err == nil && existing != nil {
		return nil, fmt.Errorf("email already registered")
	}
	if err != nil && err != pgx.ErrNoRows {
		return nil, fmt.Errorf("failed to check existing user: %w", err)
	}

	verificationToken := generateToken(64)
	expiresAt := time.Now().Add(15 * time.Minute)

	user := &models.User{
		Email:                       req.Email,
		FullName:                    req.FullName,
		EmailVerified:               false,
		VerificationToken:           &verificationToken,
		VerificationTokenExpiresAt:  &expiresAt,
	}

	if err := s.userRepo.Create(ctx, user); err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	verifyLink := fmt.Sprintf("%s/verify-email?token=%s", s.frontendURL, verificationToken)
	if err := s.emailService.SendVerificationEmail(req.Email, req.FullName, verifyLink); err != nil {
		log.Printf("[WARN] failed to send verification email to %s: %v", req.Email, err)
	}

	if !s.emailService.IsConfigured() {
		log.Printf("[INFO] SMTP not configured, auto-verifying user %s", req.Email)
		if err := s.userRepo.MarkVerified(ctx, user.ID); err != nil {
			log.Printf("[WARN] failed to auto-verify user %s: %v", req.Email, err)
		}
		user.EmailVerified = true
	}

	return user, nil
}

func (s *AuthService) RequestLogin(ctx context.Context, email string) error {
	user, err := s.userRepo.FindByEmail(ctx, email)
	if err != nil {
		if err == pgx.ErrNoRows {
			return fmt.Errorf("no account found with this email")
		}
		return fmt.Errorf("failed to find user: %w", err)
	}

	token := generateToken(64)
	expiresAt := time.Now().Add(15 * time.Minute)

	if err := s.userRepo.UpdateVerificationToken(ctx, user.ID, token, expiresAt); err != nil {
		return fmt.Errorf("failed to update login token: %w", err)
	}

	loginLink := fmt.Sprintf("%s/verify-email?token=%s", s.frontendURL, token)
	if err := s.emailService.SendLoginEmail(email, loginLink); err != nil {
		log.Printf("[WARN] failed to send login email to %s: %v", email, err)
		return fmt.Errorf("failed to send login email")
	}

	return nil
}

func (s *AuthService) VerifyAndLogin(ctx context.Context, token string) (*models.AuthResponse, error) {
	user, err := s.userRepo.FindByVerificationToken(ctx, token)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("invalid or expired link")
		}
		return nil, fmt.Errorf("failed to find user: %w", err)
	}

	wasVerified := user.EmailVerified

	if err := s.userRepo.MarkVerified(ctx, user.ID); err != nil {
		return nil, fmt.Errorf("failed to verify: %w", err)
	}
	user.EmailVerified = true

	tokens, err := s.generateTokenPair(user.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to generate tokens: %w", err)
	}

	refreshHash := hashToken(tokens.RefreshToken)
	if err := s.userRepo.UpdateRefreshTokenHash(ctx, user.ID, &refreshHash); err != nil {
		return nil, fmt.Errorf("failed to store refresh token: %w", err)
	}

	log.Printf("[INFO] user %s %s via magic link", user.Email, func() string {
		if wasVerified { return "logged in" }
		return "verified and logged in"
	}())

	return &models.AuthResponse{
		User:         *user,
		AccessToken:  tokens.AccessToken,
		RefreshToken: tokens.RefreshToken,
	}, nil
}

func (s *AuthService) ResendVerification(ctx context.Context, email string) error {
	user, err := s.userRepo.FindByEmail(ctx, email)
	if err != nil {
		if err == pgx.ErrNoRows {
			return fmt.Errorf("no account found with this email")
		}
		return fmt.Errorf("failed to find user: %w", err)
	}

	token := generateToken(64)
	expiresAt := time.Now().Add(15 * time.Minute)

	if err := s.userRepo.UpdateVerificationToken(ctx, user.ID, token, expiresAt); err != nil {
		return fmt.Errorf("failed to update verification token: %w", err)
	}

	verifyLink := fmt.Sprintf("%s/verify-email?token=%s", s.frontendURL, token)
	if err := s.emailService.SendVerificationEmail(email, user.FullName, verifyLink); err != nil {
		log.Printf("[WARN] failed to resend verification email to %s: %v", email, err)
		return fmt.Errorf("failed to send verification email")
	}

	return nil
}

func (s *AuthService) RefreshToken(ctx context.Context, refreshToken string) (*models.TokenPair, error) {
	refreshHash := hashToken(refreshToken)

	user, err := s.userRepo.FindByRefreshTokenHash(ctx, refreshHash)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("invalid refresh token")
		}
		return nil, fmt.Errorf("failed to find user: %w", err)
	}

	tokens, err := s.generateTokenPair(user.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to generate tokens: %w", err)
	}

	newRefreshHash := hashToken(tokens.RefreshToken)
	if err := s.userRepo.UpdateRefreshTokenHash(ctx, user.ID, &newRefreshHash); err != nil {
		return nil, fmt.Errorf("failed to store refresh token: %w", err)
	}

	return tokens, nil
}

func (s *AuthService) Logout(ctx context.Context, userID uuid.UUID) error {
	return s.userRepo.UpdateRefreshTokenHash(ctx, userID, nil)
}

func (s *AuthService) ValidateAccessToken(tokenString string) (*jwt.RegisteredClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &jwt.RegisteredClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return s.jwtSecret, nil
	})
	if err != nil {
		return nil, fmt.Errorf("invalid token: %w", err)
	}

	claims, ok := token.Claims.(*jwt.RegisteredClaims)
	if !ok || !token.Valid {
		return nil, fmt.Errorf("invalid token claims")
	}

	if claims.ExpiresAt != nil && claims.ExpiresAt.Before(time.Now()) {
		return nil, fmt.Errorf("token expired")
	}

	return claims, nil
}

func (s *AuthService) generateTokenPair(userID uuid.UUID) (*models.TokenPair, error) {
	now := time.Now()

	accessClaims := jwt.RegisteredClaims{
		Subject:   userID.String(),
		IssuedAt:  jwt.NewNumericDate(now),
		ExpiresAt: jwt.NewNumericDate(now.Add(s.accessTTL)),
		Issuer:    "socio",
	}

	accessToken, err := jwt.NewWithClaims(jwt.SigningMethodHS256, accessClaims).SignedString(s.jwtSecret)
	if err != nil {
		return nil, err
	}

	refreshToken := generateToken(64)

	return &models.TokenPair{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
	}, nil
}

func generateToken(length int) string {
	b := make([]byte, length)
	rand.Read(b)
	return hex.EncodeToString(b)
}

func hashToken(token string) string {
	h := sha256.Sum256([]byte(token))
	return hex.EncodeToString(h[:])
}
