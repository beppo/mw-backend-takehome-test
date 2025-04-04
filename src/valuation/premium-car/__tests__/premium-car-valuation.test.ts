import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import sinon from 'sinon';
import axios from 'axios';
import { PremiumCarValuation } from '../premium-car-valuation';
import { VehicleValuation } from '@app/models/vehicle-valuation';

describe('PremiumCarValuations test', () => {
    let axiosGetStub: sinon.SinonStub;
    let premiumCarValuation = new PremiumCarValuation();

    beforeEach(() => {
        axiosGetStub = sinon.stub(axios, 'get');
    });

    afterEach(() => {
        axiosGetStub.restore();
    });

    it('should return vehicle valuation when API call is successful', async () => {
        const mockXmlResponse = `<?xml version="1.0" encoding="UTF-8"?>
        <Response>
            <RegistrationDate>2012-06-14T00:00:00.0000000</RegistrationDate>
            <RegistrationYear>2001</RegistrationYear>
            <RegistrationMonth>10</RegistrationMonth>
            <ValuationPrivateSaleMinimum>11500</ValuationPrivateSaleMinimum>
            <ValuationPrivateSaleMaximum>12750</ValuationPrivateSaleMaximum>
            <ValuationDealershipMinimum>9500</ValuationDealershipMinimum>
            <ValuationDealershipMaximum>10275</ValuationDealershipMaximum>
        </Response>`;
        
        axiosGetStub.resolves({
            status: 200,
            data: mockXmlResponse
        });

        // Act
        const result = await premiumCarValuation.getPrice('ABC123', 50000);

        // Assert
        expect(result).toBeInstanceOf(VehicleValuation);
        expect(result.vrm).toBe('ABC123');
        expect(result.lowestValue).toBe(9500);
        expect(result.highestValue).toBe(10275);
        expect(result.valuationSource).toBe('Premium Car Valuation');
        expect(axiosGetStub.calledOnce).toBe(true);
    });

    it('should throw error when API returns non-200 status', async () => {
        // Arrange
        axiosGetStub.resolves({
            status: 404,
            data: null
        });

        // Act & Assert
        await expect(
            premiumCarValuation.getPrice('ABC123', 50000)
        ).rejects.toThrow('Failed to fetch data from the API');
    });

    it('should throw error when API call fails', async () => {
        // Arrange
        axiosGetStub.rejects(new Error('Network error'));

        // Act & Assert
        await expect(
            premiumCarValuation.getPrice('ABC123', 50000)
        ).rejects.toThrow('Network error');
    });

    it('should throw error when XML parsing fails', async () => {
        // Arrange
        axiosGetStub.resolves({
            status: 200,
            data: '<invalid>xml'
        });

        // Act & Assert
        await expect(
            premiumCarValuation.getPrice('ABC123', 50000)
        ).rejects.toThrow('Unclosed root tag');
    });
});