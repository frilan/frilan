import { InjectionKey } from "vue"
import { createLogger, createStore, Store, useStore as baseUseStore } from "vuex"
import { User } from "@frilan/models"
import http from "../utils/http"

export interface State {
    user: User
    logged: boolean
    error: string | null
}

export const key: InjectionKey<Store<State>> = Symbol()

export const store = createStore<State>({
    state: {
        user: new User(),
        logged: false,
        error: null,
    },
    mutations: {
        setUser(state, user: User) {
            state.user = user
            state.logged = true
        },
        clearUser(state) {
            state.logged = false
        },
        setError(state, error: string) {
            state.error = error
        },
        clearError(state) {
            state.error = null
        },
    },
    actions: {
        async login(context, username) {
            const user = await http.get("/login", User, { username, password: "" })
            context.commit("setUser", user)
        },
        logout(context) {
            context.commit("clearUser")
        },
    },
    plugins: process.env.NODE_ENV !== "production" ? [createLogger()] : [],
})

export function useStore(): Store<State> {
    return baseUseStore(key)
}
