import axios from 'axios';
import { parseStringPromise } from 'xml2js';

import { VehicleValuation } from '../models/vehicle-valuation';
import { PremiumCarValuationResponse } from './types/premium-valuation-response';


export async function fetchValuationFromPremiumCarValuation(
  vrm: string,
  mileage: number,
): Promise<VehicleValuation> {
  axios.defaults.baseURL =
    ' https://run.mocky.io/v3/0dfda26a-3a5a-43e5-b68c-51f148eda473';
  const response = await axios.get<PremiumCarValuationResponse>(
    `valueCar/?vrm=${vrm}`,
  );
  if (response.status !== 200) {
    throw new Error('Failed to fetch data from the API');
  }
  const parsedResponse = await parseStringPromise(response.data, { explicitArray: false });
  const root = parsedResponse.Response;
  const valuation = new VehicleValuation();
  valuation.vrm = vrm;
  valuation.valuationSource = 'Premium Car Valuation'; 
  // Assuming dealership valuation is the one you want to use
  
  valuation.lowestValue = parseInt(root.ValuationDealershipMinimum, 10);
  valuation.highestValue = parseInt(root.ValuationDealershipMaximum, 10);

  return valuation;
}
