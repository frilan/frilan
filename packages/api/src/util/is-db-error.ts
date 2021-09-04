import { QueryFailedError } from "typeorm"
import { DatabaseError } from "pg"

/**
 * Type guard for PostgreSQL driver errors.
 * When a TypeORM query fails, properties from DatabaseError get assigned to QueryFailedError.
 * @param error The thrown error
 */
export function isDbError(error: unknown): error is QueryFailedError & DatabaseError {
    return error instanceof QueryFailedError
}
