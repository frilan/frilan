import { InjectionKey } from "vue"
import { createLogger, createStore, Store, useStore as baseUseStore } from "vuex"
import axios from "axios"

interface User {
    username: string
    displayName: string
    profilePicture: string
}

export interface State {
    user: User | null
}

export const key: InjectionKey<Store<State>> = Symbol()

export const store = createStore<State>({
    state: {
        user: null,
    },
    getters: {
        logged(state) {
            return state.user !== null
        },
    },
    mutations: {
        setUser(state, user) {
            state.user = user
        },
        clearUser(state) {
            state.user = null
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
