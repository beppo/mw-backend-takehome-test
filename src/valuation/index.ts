import { VehicleValuation } from "@app/models/vehicle-valuation";
import { CarPriceQuery } from "./car-price-query";
import { SuperCarValuation } from "./super-car/super-car-valuation";
import { PremiumCarValuation } from "./premium-car/premium-car-valuation";

class DelegatingCarPriceQuery implements CarPriceQuery {
    private superCarPriceQuery: CarPriceQuery;
    private premiumCarPriceQuery: CarPriceQuery;

    constructor(superCarPriceQuery: CarPriceQuery, premiumCarPriceQuery: CarPriceQuery) {
        this.superCarPriceQuery = superCarPriceQuery;
        this.premiumCarPriceQuery = premiumCarPriceQuery;
    }

    async getPrice(vrm: string, mileage: number): Promise<VehicleValuation> {
        try {
            return await this.superCarPriceQuery.getPrice(vrm, mileage);
        } catch (error) {
            return await this.premiumCarPriceQuery.getPrice(vrm, mileage);
        }
    }
}

export const carPriceQuery = new DelegatingCarPriceQuery(
    new SuperCarValuation(),
    new PremiumCarValuation()
);