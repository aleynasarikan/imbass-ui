import { Pool, PoolClient, QueryResult } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Concurrency considerations for financial-grade SaaS
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export const query = async (text: string, params?: any[]): Promise<QueryResult> => {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log('Executed query', { text, duration, rows: res.rowCount });
  return res;
};

// For transactions
export const getClient = async (): Promise<PoolClient> => {
  const client = await pool.connect();
  const queryFn = client.query.bind(client);
  const releaseFn = client.release.bind(client);

  // monkey patch for convenience
  client.query = async (...args: any[]): Promise<QueryResult> => {
    // @ts-ignore
    return queryFn(...args);
  };

  client.release = () => {
    client.query = queryFn;
    releaseFn();
  };

  return client;
};
