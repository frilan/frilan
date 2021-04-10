import { Transform, TransformOptions } from "class-transformer"

export function Trim(options?: TransformOptions): ReturnType<typeof Transform> {
    return Transform(({ value }) => typeof value === "string" ? value.trim() : value, options)
}
