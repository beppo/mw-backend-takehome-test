import { VehicleValuation } from "@app/models/vehicle-valuation";
// Inferface for price query of a car
// This interface defines the contract for any class that implements it
export interface CarPriceQuery {
    /**
     * Calculates the car's price based on VRM and mileage
     * @param vrm Vehicle Registration Mark
     * @param mileage Total mileage of the vehicle
     * @returns The calculated price of the car
     */
    getPrice(vrm: string, mileage: number): Promise<VehicleValuation>;
}