import { InjectionKey } from "vue"
import { createLogger, createStore, Store, useStore as baseUseStore } from "vuex"
import { Event, Role, User, UserAndToken } from "@frilan/models"
import http from "../utils/http"
import { AxiosBasicCredentials } from "axios"
import { classToPlain, plainToClass } from "class-transformer"
import { parseJwt } from "../utils/parse-jwt"

export interface State {
    user: User
    logged: boolean
    event: Event
    latestEvent: number
    error: unknown
}

export const key: InjectionKey<Store<State>> = Symbol()

// check if token is still valid
const expiration = localStorage.getItem("exp")
if (expiration && Number(expiration) * 1000 < Date.now()) {
    localStorage.removeItem("token")
    localStorage.removeItem("exp")
}

// if logged, user data should be stored in local storage
const user = localStorage.getItem("user")
const event = localStorage.getItem("event")
const latestEvent = localStorage.getItem("latest")

export const store = createStore<State>({
    state: {
        user: user ? plainToClass(User, JSON.parse(user)) : new User(),
        logged: !!localStorage.getItem("token"),
        event: event ? plainToClass(Event, JSON.parse(event)) : new Event(),
        latestEvent: latestEvent ? Number(latestEvent) : -1,
        error: null,
    },
    getters: {
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
            state.logged = true
            localStorage.setItem("user", JSON.stringify(classToPlain(user)))
        },
        clearUser(state) {
            state.logged = false
            localStorage.removeItem("user")
        },
        setEvent(state, event: Event) {
            state.event = event
            localStorage.setItem("event", JSON.stringify(event))
        },
        setLatestEvent(state, latestEvent: number) {
            state.latestEvent = latestEvent
            localStorage.setItem("latest", JSON.stringify(latestEvent))
        },
        setError(state, error: string) {
            state.error = error
        },
        clearError(state) {
            state.error = null
        },
    },
    actions: {
        async login(context, credentials: AxiosBasicCredentials) {
            const { user, token } = await http.getOne("/login", UserAndToken, credentials)
            context.commit("setUser", user)
            http.setToken(token)

            const events = await http.getMany("/events", Event)
            events.sort((a, b) => b.start.getTime() - a.start.getTime())
            context.commit("setEvent", events[0])
            context.commit("setLatestEvent", events[0].id)

            localStorage.setItem("exp", parseJwt(token).exp.toString())
        },
        logout(context) {
            context.commit("clearUser")
            http.clearToken()
        },
        async loadEvent(context, id: number) {
            if (id === context.state.event.id)
                return

            const event = await http.getOne("/events/" + id, Event)
            context.commit("setEvent", event)
        },
    },
    plugins: process.env.NODE_ENV !== "production" ? [createLogger()] : [],
})

export function useStore(): Store<State> {
    return baseUseStore(key)
}
