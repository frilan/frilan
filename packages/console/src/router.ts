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
        { path: "/", name: "home", component: Planning },

        { path: "/login", name: "login", component: Login, meta: { visitor: true } },
        { path: "/join", name: "join", component: Join, meta: { visitor: true } },

        { path: "/planning", name: "planning", component: Planning },
        { path: "/ranking", name: "ranking", component: Ranking },
        { path: "/user/:name", name: "user", component: User },

        { path: "/new-tournament", name: "new-tournament", component: TournamentEditor },
        { path: "/tournament/:id", name: "tournament", component: Tournament },
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
})

export default router
