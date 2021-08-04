import { Middleware } from "koa"
import swaggerJSDoc, { Options } from "swagger-jsdoc"
import { koaSwagger } from "koa2-swagger-ui"

const options: Options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "FriLAN API",
            version: "0.1.0",
        },
        tags: [
            { name: "authentication" },
            { name: "users" },
            { name: "events" },
            { name: "registrations" },
            { name: "tournaments" },
            { name: "teams" },
        ],
        components: {
            responses: {
                ValidationError: {
                    description: "body validation failed",
                },
                AuthenticationRequired: {
                    description: "authentication is required",
                },
                NotEnoughPrivilege: {
                    description: "not enough privilege",
                }
            },
        },
    },
    apis: [
        "../models/src/entities/**/*.ts",
        "src/controllers/*.ts",
    ],
}

const spec = swaggerJSDoc(options) as Record<string, unknown>

export default function (): Middleware {
    return koaSwagger({
        swaggerOptions: { spec },
        title: options.definition?.info.title,
        hideTopbar: true,
    })
}
