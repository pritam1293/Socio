.PHONY: help backend-up backend-dev db-up db-reset test clean

help:
	@echo "Socio - Development Commands"
	@echo "============================"
	@echo ""
	@echo "make backend      Run backend on :8080"
	@echo "make frontend     Run frontend on :3000 (Chrome)"
	@echo "make db-up        Start PostgreSQL container"
	@echo "make db-reset     Reset database (drop & recreate)"
	@echo "make tidy         Tidy Go modules"
	@echo "make test         Run backend tests"
	@echo "make clean        Clean build artifacts"

db-up:
	docker compose up -d postgres

db-reset:
	docker compose down -v postgres
	docker compose up -d postgres

backend:
	cd backend && go run ./cmd/server

frontend:
	cd frontend && npm install && npx expo start --web --port 3000

tidy:
	cd backend && go mod tidy

test:
	cd backend && go test ./...

clean:
	cd backend && rm -rf bin/
	rm -rf frontend/build/ frontend/.dart_tool/
