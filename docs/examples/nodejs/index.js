import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';

const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter(),
  instrumentations: [getNodeAutoInstrumentations()]
});

sdk.start();

const { default: express } = await import('express');

const app = express();

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: process.env.OTEL_SERVICE_NAME || 'node-example' });
});

app.get('/profile/:id', async (req, res) => {
  await new Promise(resolve => setTimeout(resolve, 80));
  res.json({ profile_id: req.params.id, display_name: 'Demo User' });
});

app.listen(8080, () => {
  console.log('Node example listening on http://localhost:8080');
});
