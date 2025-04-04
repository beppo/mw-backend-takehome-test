// Initially planned to use the same log entry for both audit and circuit but that will require
// change in the 
import { ProviderLogs } from "@app/audit/provider-logs";

export class CircuitBreaker {
    // openCircuitThreshold: number; // Percentage of failures before circuit opens
    openCircuitThreshold: number;
    // window: number; // Sliding window size (in milliseconds)
    timeWindow: number;
    // minNumberOfRequests: number; // Minimum number of requests to consider for circuit state
    minNumberOfRequests: number;
    // requests: RequestLogEntry[]; // Array to store request logs
    requests: ProviderLogs[];
    // numberOfRequests: number; // Number of requests to keep track of
    // Consider only the last n requests within the time window as too many requests are expected and last n request will be the most relavant ones
    aproximateNumberOfRequestsToKeep: number;

    constructor(threshold: number = 5, window: number = 60000, minNumberOfRequests: number = 5, numberOfRequestsToKeep: number = 20) {

        this.minNumberOfRequests = minNumberOfRequests;
        this.aproximateNumberOfRequestsToKeep = numberOfRequestsToKeep;
        this.openCircuitThreshold = threshold / 100; // Convert to percentage
        this.timeWindow = window;
        this.requests = [];
    }

    isOpen(): boolean {
        if (this.requests.length < this.minNumberOfRequests) {
            return false; // Not enough requests to determine circuit state
        }
        const now = new Date();
        const recentRequests = this.requests.filter(request => {
            const requestDateTime = new Date(request.requestDateTime);
            return (now.getTime() - requestDateTime.getTime()) < 60000; // 1 minute
        });
        const failureCount = recentRequests.filter(request => request.responseCode >= 500).length;
        return failureCount/recentRequests.length >= this.openCircuitThreshold;
    }

    addRequest(request: ProviderLogs): void {
        this.requests.push(request);
        // Remove old requests outside the window
        const now = new Date();
        this.requests = this.requests.filter(request => {
            const requestDateTime = new Date(request.requestDateTime);
            return (now.getTime() - requestDateTime.getTime()) < this.timeWindow;
        });
        if (this.requests.length - this.aproximateNumberOfRequestsToKeep > 10) { // Discard only if we have more than 10 request above the limit
            this.requests = this.requests.slice(this.requests.length - this.aproximateNumberOfRequestsToKeep);
        }

    }

    // This function is not tested, so might not work as expected
    execute<T>(fn: () => Promise<T>): Promise<T> {
        if (this.isOpen()) {
            return Promise.reject(new Error("Circuit is open"));
        }
        return fn().then(result => {this.addRequest({
            requestDateTime: new Date(),
            requestDuration: 0, // Placeholder for request duration
            requestUrl: "", // Placeholder for request URL
            responseCode: 200, // Placeholder for response code
            providerName: "CircuitBreaker",
        });
            return result;
        }).catch((error) => {
            this.addRequest({
                requestDateTime: new Date(),
                requestDuration: 0, // Placeholder for request duration
                requestUrl: "", // Placeholder for request URL
                responseCode: 500, // Placeholder for response code
                errorMessage: error.message,
                providerName: "CircuitBreaker",
            });
            throw error;
        });
    }
};