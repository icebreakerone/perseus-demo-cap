
import * as undici from 'undici';
import { readFileSync } from 'fs';
import { config } from './config';

// Load mTLS certificates and CA chain
const key = readFileSync(config.mtlsKeyPath, 'utf8');
const cert = readFileSync(config.mtlsBundlePath, 'utf8');
const ca = readFileSync(config.serverCaPath, 'utf8'); // Root CA cert

// Create an undici agent for mTLS
const agent = new undici.Agent({
    connect: {
        key,
        cert,
        ca,
    },
});

// Custom fetch function that ensures all requests use mTLS
export const customFetch: typeof fetch = async (url, options = {}) => {
    return undici.fetch(url, { ...options, dispatcher: agent }) as unknown as Response;
};
