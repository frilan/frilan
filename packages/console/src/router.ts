import { createRouter, createWebHistory } from "vue-router"
import Home from "./components/home.vue"
import Join from "./components/join.vue"
import Login from "./components/login.vue"
import { store } from "./store/store"

const router = createRouter({
    history: createWebHistory(),
    routes: [
        { path: "/", name: "home", component: Home },
        { path: "/login", name: "login", component: Login, meta: { visitor: true } },
        { path: "/join", name: "join", component: Join, meta: { visitor: true } },
    ],
})

router.beforeEach((to, _, next) => {
    store.commit("clearError")

    if (to.meta.visitor && store.state.logged)
        next({ name: "/" })

    if (!to.meta.visitor && !store.state.logged)
        next({ name: "login" })

    else
        next()
})

export default router
