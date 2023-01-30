build:
	docker compose -f docker-compose.yaml up --build -d --remove-orphans
up:
	docker compose -f docker-compose.yaml up -d
down:
	docker compose -f docker-compose.yaml down
show_logs:
	docker compose -f docker-compose.yaml logs