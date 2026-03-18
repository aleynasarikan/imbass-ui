"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClient = exports.query = void 0;
const pg_1 = require("pg");
const pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20, // Concurrency considerations for financial-grade SaaS
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});
const query = async (text, params) => {
    const start = Date.now();
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
};
exports.query = query;
// For transactions
const getClient = async () => {
    const client = await pool.connect();
    const queryFn = client.query.bind(client);
    const releaseFn = client.release.bind(client);
    // monkey patch for convenience
    client.query = async (...args) => {
        // @ts-ignore
        return queryFn(...args);
    };
    client.release = () => {
        client.query = queryFn;
        releaseFn();
    };
    return client;
};
exports.getClient = getClient;
