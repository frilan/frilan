import { InjectionKey } from "vue"
import { createLogger, createStore, Store, useStore as baseUseStore } from "vuex"
import { User, UserAndToken } from "@frilan/models"
import http from "../utils/http"
import { ValidationError } from "class-validator"
import { AxiosBasicCredentials } from "axios"

export interface State {
    user: User
    logged: boolean
    error: string | null
    validationErrors: ValidationError[]
}

export const key: InjectionKey<Store<State>> = Symbol()

export const store = createStore<State>({
    state: {
        user: new User(),
        logged: false,
        error: null,
        validationErrors: [],
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
        setValidationErrors(state, errors: ValidationError[]) {
            state.validationErrors = errors
        },
        clearError(state) {
            state.error = null
            state.validationErrors = []
        },
    },
    actions: {
        async login(context, credentials: AxiosBasicCredentials) {
            const { user } = await http.get("/login", UserAndToken, credentials)
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
