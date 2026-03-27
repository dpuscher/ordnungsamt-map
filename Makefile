SHELL := /bin/sh

DEFAULT_POSTGRES_DB := ordnungsamt
DEFAULT_POSTGRES_USER := ordnungsamt

YARN := yarn
COMPOSE := docker compose -f docker-compose.yml
COMPOSE_DEV := docker compose -f docker-compose.yml -f docker-compose.dev.yml

.DEFAULT_GOAL := help

.PHONY: help install build lint format format-check typecheck typecheck-backend typecheck-frontend
.PHONY: up up-detach stop reset logs ps
.PHONY: dev dev-detach dev-stop dev-reset dev-logs dev-ps
.PHONY: backend-shell frontend-shell db-shell redis-shell

help: ## Show available commands
	@awk 'BEGIN {FS = ":.*## "}; /^[a-zA-Z0-9_.-]+:.*## / {printf "%-18s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install: ## Install workspace dependencies
	$(YARN) install

build: ## Build all workspaces
	$(YARN) build

lint: ## Lint all workspaces
	$(YARN) lint

format: ## Format the repository
	$(YARN) format

format-check: ## Check formatting without changing files
	$(YARN) format:check

typecheck: typecheck-backend typecheck-frontend ## Run frontend and backend typechecks

typecheck-backend: ## Run backend typecheck
	./node_modules/.bin/tsc -p apps/backend/tsconfig.json --noEmit

typecheck-frontend: ## Run frontend typecheck
	./node_modules/.bin/tsc -p apps/frontend/tsconfig.json --noEmit

up: ## Start the production-like stack in the foreground
	$(COMPOSE) up --build

up-detach: ## Start the production-like stack in the background
	$(COMPOSE) up -d --build

stop: ## Stop the production-like stack
	$(COMPOSE) down

reset: ## Stop the production-like stack and remove volumes
	$(COMPOSE) down -v

logs: ## Tail production-like logs; optionally pass SERVICE=<name>
	$(COMPOSE) logs -f $(SERVICE)

ps: ## Show production-like container status
	$(COMPOSE) ps

dev: ## Start the dev stack with hot reload in the foreground
	$(COMPOSE_DEV) up --build

dev-detach: ## Start the dev stack with hot reload in the background
	$(COMPOSE_DEV) up -d --build

dev-stop: ## Stop the dev stack
	$(COMPOSE_DEV) down

dev-reset: ## Stop the dev stack and remove volumes
	$(COMPOSE_DEV) down -v

dev-logs: ## Tail dev logs; optionally pass SERVICE=<name>
	$(COMPOSE_DEV) logs -f $(SERVICE)

dev-ps: ## Show dev container status
	$(COMPOSE_DEV) ps

backend-shell: ## Open a shell in the dev backend container
	$(COMPOSE_DEV) exec backend sh

frontend-shell: ## Open a shell in the dev frontend container
	$(COMPOSE_DEV) exec frontend sh

db-shell: ## Open psql in the dev postgres container
	$(COMPOSE_DEV) exec postgres psql -U $${POSTGRES_USER:-$(DEFAULT_POSTGRES_USER)} -d $${POSTGRES_DB:-$(DEFAULT_POSTGRES_DB)}

redis-shell: ## Open redis-cli in the dev redis container
	$(COMPOSE_DEV) exec redis redis-cli
