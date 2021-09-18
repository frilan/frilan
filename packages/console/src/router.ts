import { createRouter, createWebHistory } from "vue-router"
import Planning from "./pages/planning.vue"
import Join from "./pages/join.vue"
import Login from "./pages/login.vue"
import Tournament from "./pages/tournament.vue"
import Ranking from "./pages/ranking.vue"
import User from "./pages/user.vue"
import { store } from "./store/store"

const router = createRouter({
    history: createWebHistory(),
    routes: [
        { path: "/", name: "home", component: Planning },
        { path: "/login", name: "login", component: Login, meta: { visitor: true } },
        { path: "/join", name: "join", component: Join, meta: { visitor: true } },
        { path: "/tournament/:id", name: "tournament", component: Tournament },
        { path: "/user/:name", name: "user", component: User },
        { path: "/ranking", name: "ranking", component: Ranking },
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
