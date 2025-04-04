import { describe, it, beforeEach, expect } from 'vitest';
import { CircuitBreaker } from '../circuit-breaker';
import { ProviderLogs } from '@app/audit/provider-logs';
import sinon from 'sinon';

function mockRequestLogEntry(date: Date, responseCode:number): ProviderLogs {
    let logEntry = new ProviderLogs();
    logEntry.requestDateTime = date;
    logEntry.responseCode = responseCode;
    return logEntry;
}

describe('CircuitBreaker', () => {
    let circuitBreaker: CircuitBreaker;
    let clock: sinon.SinonFakeTimers;

    beforeEach(() => {
        circuitBreaker = new CircuitBreaker(50, 60000, 3);
        clock = sinon.useFakeTimers();
    });

    afterEach(() => {
        clock.restore();
    });

    it('should initialize with default values', () => {
        const defaultBreaker = new CircuitBreaker();
        expect(defaultBreaker.openCircuitThreshold).toBe(0.05);
        expect(defaultBreaker.timeWindow).toBe(60000);
        expect(defaultBreaker.requests).toEqual([]);
    });

    it('should be closed when no requests are made', () => {
        expect(circuitBreaker.isOpen()).toBe(false);
    });

    it('should remain closed when not enough entries are available', () => {
        circuitBreaker.addRequest(mockRequestLogEntry(new Date(), 500));
        circuitBreaker.addRequest(mockRequestLogEntry(new Date(), 500));  

        expect(circuitBreaker.isOpen()).toBe(false);
    });

    it('should open when failures reach threshold', () => {
        circuitBreaker.addRequest(mockRequestLogEntry(new Date(), 500));
        circuitBreaker.addRequest(mockRequestLogEntry(new Date(), 500)); 
        circuitBreaker.addRequest(mockRequestLogEntry(new Date(), 500)); 
        expect(circuitBreaker.isOpen()).toBe(true);
    });

    it('should ignore old failures outside the window', () => {
        // Add old failures
        circuitBreaker.addRequest(mockRequestLogEntry(new Date(), 500));
        circuitBreaker.addRequest(mockRequestLogEntry(new Date(), 500));  
        circuitBreaker.addRequest(mockRequestLogEntry(new Date(), 500));  
        clock.tick(61000); // Move time forward by 61 seconds

        // Add one recent failure
        circuitBreaker.addRequest(mockRequestLogEntry(new Date(), 200)); 

        expect(circuitBreaker.isOpen()).toBe(false);
    });

    it('should ignore successful responses', () => {

        circuitBreaker.addRequest(mockRequestLogEntry(new Date(), 200)); // Success
        circuitBreaker.addRequest(mockRequestLogEntry(new Date(), 200));  
        
        circuitBreaker.addRequest(mockRequestLogEntry(new Date(), 500));
        circuitBreaker.addRequest(mockRequestLogEntry(new Date(), 200));  
        expect(circuitBreaker.isOpen()).toBe(false);
    });
    // The test cases are not exhaustive and are just to show the functionality of the circuit breaker.
});