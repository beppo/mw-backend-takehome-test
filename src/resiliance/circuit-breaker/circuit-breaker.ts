import { RequestLogEntry } from "@app/models/request-log-entry";

export class CircuitBreaker {
    // openCircuitThreshold: number; // Percentage of failures before circuit opens
    openCircuitThreshold: number;
    // window: number; // Sliding window size (in milliseconds)
    timeWindow: number;
    // minNumberOfRequests: number; // Minimum number of requests to consider for circuit state
    minNumberOfRequests: number;
    // requests: RequestLogEntry[]; // Array to store request logs
    requests: RequestLogEntry[];
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

    addRequest(request: RequestLogEntry): void {
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

};