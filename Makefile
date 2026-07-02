.PHONY: help backend-up backend-dev db-up db-reset test clean

help:
	@echo "Socio - Development Commands"
	@echo "============================"
	@echo ""
	@echo "make db-up        Start PostgreSQL container"
	@echo "make db-reset     Reset database (drop & recreate)"
	@echo "make backend-dev  Run backend with hot reload (requires air)"
	@echo "make backend-run  Run backend directly"
	@echo "make backend-build Build backend binary"
	@echo "make up           Start all services with docker-compose"
	@echo "make down         Stop all services"
	@echo "make tidy         Tidy Go modules"
	@echo "make test         Run backend tests"
	@echo "make clean        Clean build artifacts"

db-up:
	docker compose up -d postgres

db-reset:
	docker compose down -v postgres
	docker compose up -d postgres

backend-dev:
	cd backend && go run ./cmd/server

backend-run:
	cd backend && go build -o bin/server ./cmd/server && ./bin/server

backend-build:
	cd backend && go build -o bin/server ./cmd/server

up:
	docker compose up -d

down:
	docker compose down

tidy:
	cd backend && go mod tidy

test:
	cd backend && go test ./...

clean:
	cd backend && rm -rf bin/
	rm -rf frontend/build/ frontend/.dart_tool/
