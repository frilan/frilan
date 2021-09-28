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
    mainEvent: string
    error: unknown
}

export const key: InjectionKey<Store<State>> = Symbol()

// check if token is still valid
const expiration = localStorage.getItem("exp")
if (expiration && Number(expiration) * 1000 < Date.now())
    localStorage.clear()

// if logged, user data should be stored in local storage
const user = localStorage.getItem("user")
const event = localStorage.getItem("event")
const main = localStorage.getItem("main")

export const store = createStore<State>({
    state: {
        user: user ? plainToClass(User, JSON.parse(user)) : new User(),
        logged: !!localStorage.getItem("token"),
        event: event ? plainToClass(Event, JSON.parse(event)) : new Event(),
        mainEvent: main ?? "",
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
    },
    actions: {
        async loadEvents(context) {
            const events = await http.getMany("/events", Event)
            events.sort((a, b) => b.start.getTime() - a.start.getTime())
            context.commit("setEvent", events[0])
            context.commit("setMainEvent", events[0].shortName)
        },
        async login(context, credentials: AxiosBasicCredentials) {
            const { user, token } = await http.getOne("/login", UserAndToken, credentials)
            http.setToken(token)

            await context.dispatch("loadEvents")
            context.commit("setUser", user)

            localStorage.setItem("exp", parseJwt(token).exp.toString())
        },
        logout(context) {
            context.state.logged = false
            localStorage.clear()
            http.clearToken()
        },
        async loadEvent(context, name: string) {
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
