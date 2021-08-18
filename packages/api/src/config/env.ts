/**
 * The current environment. Can be either "dev", "prod", "test", or whatever NODE_ENV is.
 */
export const env = process.env.TS_NODE_DEV ? "dev" : process.env.NODE_ENV ?? "prod"
