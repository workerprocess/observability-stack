up:
	docker compose up -d

down:
	docker compose down

logs:
	docker compose logs -f otel-collector grafana loki tempo prometheus

restart:
	docker compose down && docker compose up -d
