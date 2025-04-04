import axios from "axios";
import { FastifyInstance } from 'fastify';
import { ProviderLogs } from "@app/audit/provider-logs";

axios.interceptors.request.use((config) => {
    console.log(`[Outgoing Request] ${config.method?.toUpperCase()} ${config.url}`); // Log the request method and URL
    (config as any).startTime = new Date(); // Track request start time
    return config;
});


const logEntry = async (fastify: FastifyInstance, requestUrl: string, responseCode: number, config: any, errorMessage?: string) => {
    const endTime = new Date();
    const duration = (endTime.getTime() - config.startTime.getTime()) / 1000;

    // Log request details
    const logEntry = new ProviderLogs();
    logEntry.requestDateTime = new Date();
    logEntry.requestDuration = duration;
    logEntry.requestUrl = requestUrl;
    logEntry.responseCode = responseCode;
    
    // I don't know whether it is possible but this could be set when making the call to the API
    logEntry.providerName = config.providerName || "Unknown Provider";

    const valuationRepository = fastify.orm.getRepository(ProviderLogs);
    const repo = fastify.orm.getRepository(ProviderLogs);
    await repo.save(logEntry);
}

// Registering the interceptor this way might not be the best way to do it
export function startAudit(fastify: FastifyInstance) {
    // Attach a response interceptor to log the request and response details
    axios.interceptors.response.use(
        async (response) => {
            logEntry(fastify, response.config.url || "", response.status, response.config);
            return response;
        },
        async (error) => {
            logEntry(fastify, error.config.url || "", error.response?.status || 500, error.config, error.message);
            return Promise.reject(error);
        }
    );
}