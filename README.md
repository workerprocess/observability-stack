# Core Telemetry Stack

OpenTelemetry-based observability stack for local/dev/staging use.

## Components

- OpenTelemetry Collector: receives OTLP from apps
- Grafana: dashboard
- Loki: logs
- Tempo: traces
- Prometheus: metrics

## Start

```bash
cp .env.example .env
docker compose up -d
```

Open:

- Grafana: http://localhost:3000
- Prometheus: http://localhost:9090
- Loki: http://localhost:3100
- Tempo: http://localhost:3200
- OTLP gRPC: localhost:4317
- OTLP HTTP: http://localhost:4318

Default Grafana login:

```text
admin / admin
```

Change password in `.env` before production use.

## App Integration

### Standard environment variables

```bash
OTEL_SERVICE_NAME=profile-api
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf
OTEL_RESOURCE_ATTRIBUTES=deployment.environment=local,service.namespace=scc
```

For Docker app containers in the same compose network, use:

```bash
OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4318
```

## Recommended correlation fields

Use these fields in logs, traces, and Core Event Log:

```text
trace_id
span_id
correlation_id
request_id
actor_id
entity_type
entity_id
source_service
```

Example business event relation:

```json
{
  "event_type": "PROFILE_UPDATED",
  "entity_type": "profile",
  "entity_id": "profile_123",
  "actor_id": "user_456",
  "correlation_id": "corr_abc123",
  "trace_id": "trace_xxx",
  "source_service": "profile-service"
}
```

## Architecture

```text
Application (.NET / Node / Mobile)
        |
        | OTLP gRPC 4317 / HTTP 4318
        v
OpenTelemetry Collector
        |
        |-- Logs ----> Loki
        |-- Metrics -> Prometheus
        |-- Traces --> Tempo
        v
Grafana
```

## Notes

This stack intentionally does not use Redis/BullMQ. Keep Redis/BullMQ for Core Event Log and background jobs. Telemetry should flow through OpenTelemetry Collector directly. If traffic grows very large, add Kafka between Collector and storage.
