import { InjectionKey } from "vue"
import { createLogger, createStore, Store, useStore as baseUseStore } from "vuex"
import { User, UserAndToken } from "@frilan/models"
import http from "../utils/http"
import { AxiosBasicCredentials } from "axios"
import { classToPlain, plainToClass } from "class-transformer"

export interface State {
    user: User
    logged: boolean
    error: unknown
}

export const key: InjectionKey<Store<State>> = Symbol()

// if logged, user data should be stored in local storage
const currentUser = localStorage.getItem("user")

export const store = createStore<State>({
    state: {
        user: currentUser ? plainToClass(User, JSON.parse(currentUser)) : new User(),
        logged: !!localStorage.getItem("token"),
        error: null,
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
        setError(state, error: string) {
            state.error = error
        },
        clearError(state) {
            state.error = null
        },
    },
    actions: {
        async login(context, credentials: AxiosBasicCredentials) {
            const { user, token } = await http.get("/login", UserAndToken, credentials)
            context.commit("setUser", user)
            http.setToken(token)
        },
        logout(context) {
            context.commit("clearUser")
            http.clearToken()
        },
    },
    plugins: process.env.NODE_ENV !== "production" ? [createLogger()] : [],
})

export function useStore(): Store<State> {
    return baseUseStore(key)
}
