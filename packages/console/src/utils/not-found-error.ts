/**
 * When thrown, displays the not-found page until navigation changes.
 */
export class NotFoundError extends Error {
    name = "NotFoundError"

    constructor() {
        super("Page not found")
    }
}

/**
 * Check if the provided error is an instance of NotFoundError.
 * @param error Any thrown error
 */
export function isNotFoundError(error: unknown): error is NotFoundError {
    return error instanceof NotFoundError
}
