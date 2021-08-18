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
    id: number,
    admin: boolean,
    roles: { [key: number]: Role }
}

export function getUserFromToken(action: Action): AuthUser {
    return action.context.state.user
}

export function getAuthorizationFromToken(action: Action, roles: string[]): boolean {
    const state = action.context.state

    // if JWT could not be decoded, show error message
    if (!state.user && "authorization" in action.request.headers)
        throw new UnauthorizedError(state.jwtOriginalError.message)

    if (!state.user)
        throw new UnauthorizedError("Authentication is required")

    return state.user && !roles.length || state.user?.admin && roles.includes("admin")
}
