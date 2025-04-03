import axios from "axios";
import { FastifyInstance } from 'fastify';
import { RequestLogEntry } from "@app/models/request-log-entry";
// This code is not tested yet. I am not sure whether it will work as expected.
// But registering a default interceptor seems to be the right way to do create audit logs for all requests made by axios.

axios.interceptors.request.use((config) => {
    (config as any).startTime = new Date(); // Track request start time
    return config;
});

const logEntry = async (fastify: FastifyInstance, requestUrl: string, responseCode: number, config: any, errorMessage?: string) => {
    const endTime = new Date();
    const duration = (endTime.getTime() - config.startTime.getTime()) / 1000;

    // Log request details
    const logEntry = new RequestLogEntry();
    logEntry.requestDateTime = new Date();
    logEntry.requestDuration = duration;
    logEntry.requestUrl = requestUrl;
    logEntry.responseCode = responseCode;
    
    // I don't know whether it is possible but this could be set when making the call to the API
    logEntry.providerName = config.providerName || "Unknown Provider";

    const valuationRepository = fastify.orm.getRepository(RequestLogEntry);
    const repo = fastify.orm.getRepository(RequestLogEntry);
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