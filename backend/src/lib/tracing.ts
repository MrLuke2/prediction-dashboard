import { NodeSDK } from '@opentelemetry/sdk-node';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { FastifyInstrumentation } from '@opentelemetry/instrumentation-fastify';
import { PgInstrumentation } from '@opentelemetry/instrumentation-pg';
import { IORedisInstrumentation } from '@opentelemetry/instrumentation-ioredis';
import { logger } from './logger.js';

const jaegerUrl = process.env.JAEGER_URL || 'http://localhost:14268/api/traces';

let sdk: NodeSDK | null = null;

export function initTracing() {
  if (process.env.NODE_ENV === 'production' || process.env.ENABLE_TRACING === 'true') {
    sdk = new NodeSDK({
      resource: resourceFromAttributes({
        [ATTR_SERVICE_NAME]: 'alpha-mode-predict-backend',
      }),
      traceExporter: new JaegerExporter({ endpoint: jaegerUrl }),
      instrumentations: [
        new HttpInstrumentation(),
        new FastifyInstrumentation(),
        new PgInstrumentation(),
        new IORedisInstrumentation(),
      ],
    });
    sdk.start();
    logger.info({ jaegerUrl }, 'OpenTelemetry tracing initialized');
  }
}

export async function shutdownTracing() {
  if (sdk) {
    await sdk.shutdown();
    logger.info('Tracing terminated');
  }
}
