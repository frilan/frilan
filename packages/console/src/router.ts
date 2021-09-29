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

/**
 * Meta properties:
 * - tile:      a static document title for the page
 * - event:     true if the page is about a specific event
 * - organizer: true if the page is only for organizers & admins
 * - admin:     true if the page is only for adins
 */

const eventRoutes = [
    { path: "/", name: "home", component: Planning, meta: { title: "Planning", event: true } },
    { path: "/planning", name: "planning", component: Planning, meta: { title: "Planning", event: true } },
    { path: "/ranking", name: "ranking", component: Ranking, meta: { title: "Ranking", event: true } },
    { path: "/user/:name", name: "user", component: User, meta: { event: true } },
    {
        path: "/tournaments/new",
        name: "new-tournament",
        component: TournamentEditor,
        meta: { title: "New Tournament", organizer: true, event: true },
    },
    {
        path: "/tournaments/:name",
        name: "tournament",
        component: Tournament,
        meta: { event: true },
    },
    {
        path: "/tournaments/:name/edit",
        name: "edit-tournament",
        component: TournamentEditor,
        meta: { organizer: true, event: true },
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

    // if page is about a specific event
    if (store.state.logged && to.meta.event)
        try {
            // update active event
            if ("eventName" in to.params)
                await store.dispatch("setActiveEvent", to.params.eventName)
            else
                await store.dispatch("setActiveEvent", store.state.mainEvent)
        } catch (err) {
            // cancel navigation if specified event doesn't exist
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
