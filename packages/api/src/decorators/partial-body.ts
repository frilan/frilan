import { Body } from "routing-controllers"

export function PartialBody(options?: { required?: boolean }): ReturnType<typeof Body> {
    return Body({
        required: !!(options && options.required),
        validate: { skipMissingProperties: true },
    })
}
