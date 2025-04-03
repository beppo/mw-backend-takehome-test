import axios from 'axios';

import { VehicleValuation } from '@app/models/vehicle-valuation';
import { SuperCarValuationResponse } from './types/super-car-valuation-response';
import { CarPriceQuery } from '../car-price-query';

export class SuperCarValuation implements CarPriceQuery {
  private baseUrl: string;
  constructor(baseUrl: string = 'https://run.mocky.io/v3/9245229e-5c57-44e1-964b-36c7fb29168b') {
    this.baseUrl = baseUrl;
  }
  async getPrice(vrm: string, mileage: number): Promise<VehicleValuation> {
    axios.defaults.baseURL = this.baseUrl;
    const response = await axios.get<SuperCarValuationResponse>(
      `valuations/${vrm}?mileage=${mileage}`,
    );

    const valuation = new VehicleValuation();

    valuation.vrm = vrm;
    valuation.lowestValue = response.data.valuation.lowerValue;
    valuation.highestValue = response.data.valuation.upperValue;

    return valuation;
  }
}
