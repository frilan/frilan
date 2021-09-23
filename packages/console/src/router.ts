import { createRouter, createWebHistory } from "vue-router"
import Planning from "./pages/planning.vue"
import Join from "./pages/join.vue"
import Login from "./pages/login.vue"
import Tournament from "./pages/tournament.vue"
import TournamentEditor from "./pages/tournament-editor.vue"
import Ranking from "./pages/ranking.vue"
import User from "./pages/user.vue"
import { store } from "./store/store"

const router = createRouter({
    history: createWebHistory(),
    routes: [
        { path: "/", name: "home", component: Planning, meta: { title: "Planning" } },

        { path: "/login", name: "login", component: Login, meta: { visitor: true, title: "Log In" } },
        { path: "/join", name: "join", component: Join, meta: { visitor: true, title: "Sign Up" } },

        { path: "/planning", name: "planning", component: Planning, meta: { title: "Planning" } },
        { path: "/ranking", name: "ranking", component: Ranking, meta: { title: "Ranking" } },
        { path: "/user/:name", name: "user", component: User },

        {
            path: "/new-tournament",
            name: "new-tournament",
            component: TournamentEditor,
            meta: { title: "New Tournament" },
        },
        {
            path: "/tournament/:id",
            name: "tournament",
            component: Tournament,
        },
        {
            path: "/tournament/:id/edit",
            name: "edit-tournament",
            component: TournamentEditor,
            meta: { organizer: true },
        },
    ],
})

router.beforeEach(to => {
    store.commit("clearError")

    if (to.meta.visitor && store.state.logged)
        return { name: "/" }

    if (!to.meta.visitor && !store.state.logged)
        return { name: "login" }

    if (to.meta.organizer && !store.getters.isOrganizer)
        return false

    if (!to.meta.title)
        document.title = "Console"
    else
        document.title = to.meta.title + " - Console"
})

export default router
