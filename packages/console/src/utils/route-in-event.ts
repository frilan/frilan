import type { RouteLocationRaw, RouteParamsRaw } from "vue-router"

/**
 * Returns a route location nested in a specific event.
 * @param name The route name
 * @param eventName The active event
 * @param params The optional route parameters
 */
export function routeInEvent(name: string, eventName: string, params?: RouteParamsRaw): RouteLocationRaw {
    return { name: "event-" + name, params: { ...params, eventName } }
}
