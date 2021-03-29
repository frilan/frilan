import { Method } from "routing-controllers"
import { ActionType } from "routing-controllers/types/metadata/types/ActionType"

export type MethodDecorator = ReturnType<typeof Method>

export function MethodById(method: ActionType, route = ""): MethodDecorator {
    return Method(method, route + "/:id(\\d+)")
}

export const GetById = (route?: string): MethodDecorator => MethodById("get", route)
export const PatchById = (route?: string): MethodDecorator => MethodById("patch", route)
export const DeleteById = (route?: string): MethodDecorator => MethodById("delete", route)
