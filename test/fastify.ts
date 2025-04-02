import { beforeAll, afterAll } from 'vitest'
import { VehicleValuation } from '@app/models/vehicle-valuation';
import sinon from 'sinon';
import fp from 'fastify-plugin'; // Import fastify-plugin to maintain structure


export const mockRepository = {
  // Mock the findOneBy method to return a resolved promise
  findOneBy: sinon.stub().resolves({
    vrm: 'ABC123',
      lowestValue: 5000,
      highestValue: 10000,
  }), 
  insert: sinon.stub().callsFake(async (vehicleValuation: VehicleValuation) => {
    return { ...vehicleValuation, id: 1 };
  }),
};

// Mock the Default Export Using `fastify-plugin`
vi.mock('typeorm-fastify-plugin', async () => {
  // Define the plugin function Fastify will use
  const mockPlugin = async (fastify: any) => {
    fastify.decorate('orm', {
      getRepository: vi.fn(() => mockRepository), // Ensure stub is used
    });
  };

  // Wrap in `fp` exactly like the real plugin
  return {
    default: fp(mockPlugin, { fastify: '4.26.2', name: 'typeorm-fastify-plugin' }),
  };
});

// This must be imported after the mock to ensure the mock is used
import { app } from '@app/app'

export const fastify = app()

beforeAll(async () => {
  // called once before all tests run
  await fastify.ready()
})
afterAll(async () => {
  // called once after all tests run
  await fastify.close()
})