import { Role } from "@frilan/models"

interface JwtPayload {
    id: number
    admin: boolean
    roles: Record<number, Role>
    exp: number
    iat: number
}

/**
 * Extracts the payload from a JSON Web Token.
 * @param jwt The token
 */
export function parseJwt(jwt: string): JwtPayload {
    const base64url = jwt.split(".")[1]
    const base64 = base64url.replace("-", "+").replace("_", "/")
    return JSON.parse(atob(base64))
}
