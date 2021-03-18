import { InjectionKey } from "vue"
import { createLogger, createStore, Store, useStore as baseUseStore } from "vuex"
import axios from "axios"

export interface User {
    username: string
    displayName: string
    profilePicture: string
}

export interface State {
    user: User
    logged: boolean
    error: string | null
}

export const key: InjectionKey<Store<State>> = Symbol()

export const store = createStore<State>({
    state: {
        user: {
            username: "",
            displayName: "",
            profilePicture: "",
        },
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
            const user = await axios.get("/login", { auth: { username, password: "" } })
            context.commit("setUser", user.data)
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
