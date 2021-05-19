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
        ],
        components: {
            responses: {
                ValidationError: {
                    description: "body validation failed",
                },
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
        hideTopbar: true,
    })
}
