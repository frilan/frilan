import type { RouteParamsRaw } from "vue-router"
import { routeInEvent } from "./route-in-event"
import { store } from "@/store/store"
import router from "@/router"

/**
 * Redirects to the desired route within the current active event.
 * @param name The target route name
 * @param params The optional route parameters
 */
export function redirectToEvent(name: string, params?: RouteParamsRaw): ReturnType<typeof router["push"]> {
    const eventName = store.state.event.shortName
    if (store.state.mainEvent === eventName)
        return router.push({ name, ...params })
    else
        return router.push(routeInEvent(name, eventName, params))
}
