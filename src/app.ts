import './env';
import 'reflect-metadata';

import { fastify as Fastify, FastifyServerOptions } from 'fastify';
import { valuationRoutes } from './routes/valuation';

import databaseConnection from 'typeorm-fastify-plugin';
import { VehicleValuation } from './models/vehicle-valuation';
import { startAudit } from './audit/audit';
import { RequestLogEntry } from './audit/request-log-entry';
import { createCarPriceQuery } from './valuation';

export const app = (opts?: FastifyServerOptions) => {
  const fastify = Fastify(opts);
  fastify
    .register(databaseConnection, {
      type: 'sqlite',
      database: process.env.DATABASE_PATH!,
      synchronize: process.env.SYNC_DATABASE === 'true',
      logging: false,
      entities: [VehicleValuation, RequestLogEntry],
      migrations: [],
      subscribers: [],
    })
    .ready();

  // I am not sure whether this is the right way to inject Fastify into the audit
  startAudit(fastify);

  createCarPriceQuery(fastify);

  fastify.get('/', async () => {
    return { hello: 'world' };
  });

  valuationRoutes(fastify);

  return fastify;
};
