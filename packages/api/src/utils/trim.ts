import { Transform, TransformOptions } from "class-transformer"

export function Trim(options?: TransformOptions): PropertyDecorator {
    return Transform(({ value }) => value.trim(), options)
}
