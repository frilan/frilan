import { createRouter, createWebHistory } from "vue-router"
import Planning from "./pages/planning.vue"
import Join from "./pages/join.vue"
import Login from "./pages/login.vue"
import Tournament from "./pages/tournament.vue"
import TournamentEditor from "./pages/tournament-editor.vue"
import Events from "./pages/events.vue"
import EventEditor from "./pages/event-editor.vue"
import Ranking from "./pages/ranking.vue"
import User from "./pages/user.vue"
import { store } from "./store/store"

const eventRoutes = [
    { path: "/", name: "home", component: Planning, meta: { title: "Planning" } },
    { path: "/planning", name: "planning", component: Planning, meta: { title: "Planning" } },
    { path: "/ranking", name: "ranking", component: Ranking, meta: { title: "Ranking" } },
    { path: "/user/:name", name: "user", component: User },
    {
        path: "/tournaments/new",
        name: "new-tournament",
        component: TournamentEditor,
        meta: { title: "New Tournament", organizer: true },
    },
    {
        path: "/tournaments/:name",
        name: "tournament",
        component: Tournament,
    },
    {
        path: "/tournaments/:name/edit",
        name: "edit-tournament",
        component: TournamentEditor,
        meta: { organizer: true },
    },
]

const nestedRoutes = eventRoutes
    .map(({ path, name, component, meta }) => ({
        path: "/:eventName" + path,
        name: "event-" + name,
        component,
        meta,
    }))

const router = createRouter({
    history: createWebHistory(),
    routes: [
        { path: "/login", name: "login", component: Login, meta: { visitor: true, title: "Log In" } },
        { path: "/join", name: "join", component: Join, meta: { visitor: true, title: "Sign Up" } },
        {
            path: "/events",
            name: "events",
            component: Events,
            meta: { title: "Events" },
        },
        {
            path: "/events/new",
            name: "new-event",
            component: EventEditor,
            meta: { title: "New Event", admin: true },
        },
        {
            path: "/events/:name",
            redirect: to => ({ name: "event-home", params: { eventName: to.params.name } }),
        },
        {
            path: "/events/:name/edit",
            name: "edit-event",
            component: EventEditor,
            meta: { admin: true },
        },
        ...eventRoutes,
        ...nestedRoutes,
    ],
})

router.beforeEach(async to => {
    store.commit("clearError")

    if (to.meta.visitor && store.state.logged)
        return { name: "/" }

    if (!to.meta.visitor && !store.state.logged)
        return { name: "login" }

    try {
        // load specific event if needed
        if (store.state.logged)
            if ("eventName" in to.params)
                await store.dispatch("loadEvent", to.params.eventName)
            else
                await store.dispatch("loadEvent", store.state.mainEvent)
    } catch (err) {
        // cancel navigation if specified event couldn't be loaded
        return false
    }

    if (to.meta.organizer && !store.getters.isOrganizer)
        return false

    if (to.meta.admin && !store.state.user.admin)
        return false

    // set page title accordingly
    if (!to.meta.title)
        document.title = "Console"
    else
        document.title = to.meta.title + " - Console"
})

export default router
