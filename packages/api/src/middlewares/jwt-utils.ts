import jwt from "koa-jwt"
import { Context, Next } from "koa"
import { Action, UnauthorizedError } from "routing-controllers"
import { Role } from "@frilan/models"
import jwtConfig from "../config/jwt"

export function tokenDecoder() {
    return async (ctx: Context, next: Next): Promise<void> => {
        await jwt({ secret: jwtConfig.secret, passthrough: true })(ctx, next)
    }
}

export interface AuthUser {
    id: number
    admin: boolean
    roles: Record<number, Role>
}

/**
 * Throws an HTTP error if there's a token in the request but it is not valid (expired, malformed, etc.).
 */
function checkTokenValidity(action: Action) {
    if (!action.context.state.user && "authorization" in action.request.headers)
        throw new UnauthorizedError(action.context.state.jwtOriginalError.message)
}

export function getUserFromToken(action: Action): AuthUser {
    checkTokenValidity(action)
    return action.context.state.user
}

export function getAuthorizationFromToken(action: Action, roles: string[]): boolean {
    checkTokenValidity(action)

    const state = action.context.state
    if (!state.user)
        throw new UnauthorizedError("Authentication is required")

    return state.user && !roles.length || state.user?.admin && roles.includes("admin")
}
