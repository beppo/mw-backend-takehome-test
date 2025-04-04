import { VehicleValuation } from "@app/models/vehicle-valuation";
import { CarPriceQuery } from "./car-price-query";
import { SuperCarValuation } from "./super-car/super-car-valuation";
import { PremiumCarValuation } from "./premium-car/premium-car-valuation";
import { CircuitBreaker } from "@app/resiliance/circuit-breaker/circuit-breaker";
import { FastifyInstance } from "fastify";

declare module 'fastify' {
	export interface FastifyInstance {
		carPriceQuery: CarPriceQuery;
	}
}

/**
 * DelegatingCarPriceQuery is a class that implements the CarPriceQuery interface.
 * It delegates the price query to either SuperCarValuation or PremiumCarValuation based on the circuit breaker state.
 * If the circuit breaker is open, it will use PremiumCarValuation.
 */
class DelegatingCarPriceQuery implements CarPriceQuery {
    private superCarPriceQuery: CarPriceQuery;
    private premiumCarPriceQuery: CarPriceQuery;
    private circuitBreaker = new CircuitBreaker();
    private fastify: FastifyInstance

    constructor(superCarPriceQuery: CarPriceQuery, premiumCarPriceQuery: CarPriceQuery, fastify: FastifyInstance) {
        this.superCarPriceQuery = superCarPriceQuery;
        this.premiumCarPriceQuery = premiumCarPriceQuery;
        this.fastify = fastify;
    }

    async getPrice(vrm: string, mileage: number): Promise<VehicleValuation> {
        // This implemenation is not tested but demonstrate the idea of using circuit breaker and fallback
        try {
            const result = await this.circuitBreaker.execute(() => this.superCarPriceQuery.getPrice(vrm, mileage));
            this.fastify.log.info('Result from super car valuation:', result);
            if (!result) {
                return await this.premiumCarPriceQuery.getPrice(vrm, mileage);
            }
            return result;
        } catch (error) {
            if (this.circuitBreaker.isOpen()) {  // A circuit breaker open error could be thrown by circuit breaker, so that this doesn't require access to circuit breaker
                this.fastify.log.info('Circuit is open getting valuation from premium car');
                return await this.premiumCarPriceQuery.getPrice(vrm, mileage);
            }
            throw error;
        }
    }
}

export const createCarPriceQuery = async (fastify: FastifyInstance): Promise<CarPriceQuery> => {
    const carPriceQuery = new DelegatingCarPriceQuery(
        new SuperCarValuation(),
        new PremiumCarValuation(),
        fastify
    );
    fastify.decorate('carPriceQuery', carPriceQuery);
    return carPriceQuery;
};