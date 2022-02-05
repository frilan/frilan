import { InjectionKey } from "vue"
import { createLogger, createStore, Store, useStore as baseUseStore } from "vuex"
import { Event, Role, User, UserAndToken } from "@frilan/models"
import http from "../utils/http"
import { AxiosBasicCredentials } from "axios"
import { classToPlain, plainToClass } from "class-transformer"
import { parseJwt } from "../utils/parse-jwt"
import { RouteLocationNormalized } from "vue-router"

export interface State {
    /**
     * The user currently logged in
     */
    user: User

    /**
     * True if the user is logged in
     */
    logged: boolean

    /**
     * The active event
     */
    event: Event

    /**
     * The main (most recent) event name
     */
    mainEvent: string

    /**
     * True if there are no events yet
     */
    init?: boolean

    /**
     * The last thrown error
     */
    error: unknown

    /**
     * The next page to redirect to after logging in
     */
    next?: RouteLocationNormalized

    /**
     * The current page status
     */
    status: PageStatus
}

export enum PageStatus {
    Ok,
    NotFound,
    AccessDenied,
}

export const key: InjectionKey<Store<State>> = Symbol()

// check if token is still valid
const expiration = localStorage.getItem("exp")
if (expiration && Number(expiration) * 1000 < Date.now())
    localStorage.clear()

// if logged, user data should be stored in local storage
let user = localStorage.getItem("user")
let event = localStorage.getItem("event")
let main = localStorage.getItem("main")

// clear local storage if corrupted
if (!user || !event || !main) {
    localStorage.clear()
    user = event = main = null
}

export const store = createStore<State>({
    state: {
        user: user ? plainToClass(User, JSON.parse(user)) : new User(),
        logged: !!localStorage.getItem("token"),
        event: event ? plainToClass(Event, JSON.parse(event)) : new Event(),
        mainEvent: main ?? "",
        error: null,
        init: !!user && !event,
        status: PageStatus.Ok,
    },
    getters: {
        isRegistered(state) {
            return state.user.registrations.some(r => r.eventId === state.event.id)
        },
        isOrganizer(state) {
            return state.user.admin
                || state.user.registrations.some(r =>
                    r.eventId === state.event.id
                    && r.role === Role.Organizer)
        },
    },
    mutations: {
        setUser(state, user: User) {
            state.user = user
            localStorage.setItem("user", JSON.stringify(classToPlain(user)))
        },
        setEvent(state, event: Event) {
            state.event = event
            localStorage.setItem("event", JSON.stringify(event))
        },
        setMainEvent(state, mainEvent: string) {
            state.mainEvent = mainEvent
            localStorage.setItem("main", mainEvent)
        },
        setError(state, error: string) {
            state.error = error
        },
        clearError(state) {
            state.error = null
        },
        setNext(state, next: RouteLocationNormalized) {
            state.next = next
        },
        setPageStatus(state, status: PageStatus) {
            state.status = status
        },
    },
    actions: {
        async reloadEvents(context) {
            const events = await http.getMany("/events", Event)
            if (!events.length)
                if (context.state.user.admin) {
                    context.state.init = true
                    return
                } else {
                    await context.dispatch("logout")
                    throw "There are no events yet"
                }

            // the most recent event is the main one
            events.sort((a, b) => b.start.getTime() - a.start.getTime())
            context.commit("setMainEvent", events[0].shortName)

            // select the most recent event that the user is registered for
            if (context.state.user.registrations.length) {
                const userEvents = context.state.user.registrations.map(r => r.eventId)
                context.commit("setEvent", events.find(({ id }) => userEvents.includes(id)))
            } else
                // select main event if user is not registered for any event
                context.commit("setEvent", events[0])

            // no need to create the initial event
            context.state.init = false
        },
        async login(context, credentials: AxiosBasicCredentials) {
            const { user, token } = await http.getOne("/login", UserAndToken, credentials)
            http.setToken(token)
            localStorage.setItem("exp", parseJwt(token).exp.toString())
            context.commit("setUser", user)
            await context.dispatch("reloadEvents")
            context.state.logged = true
        },
        logout(context) {
            context.state.logged = false
            context.state.init = false
            context.state.next = undefined
            localStorage.clear()
            http.clearToken()
        },
        async setActiveEvent(context, name: string) {
            // skip if already active
            if (name === context.state.event.shortName)
                return

            const events = await http.getMany("/events?shortName=" + name, Event)
            if (!events.length)
                throw "Event not found: " + name
            context.commit("setEvent", events[0])
        },
    },
    plugins: process.env.NODE_ENV !== "production" ? [createLogger()] : [],
})

export function useStore(): Store<State> {
    return baseUseStore(key)
}
