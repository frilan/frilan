import { createRouter, createWebHistory } from "vue-router"
import Join from "./pages/join.vue"
import Login from "./pages/login.vue"
import Tournaments from "./pages/tournaments.vue"
import Tournament from "./pages/tournament.vue"
import TournamentEditor from "./pages/tournament-editor.vue"
import ResultsEditor from "./pages/results-editor.vue"
import Events from "./pages/events.vue"
import EventEditor from "./pages/event-editor.vue"
import Ranking from "./pages/ranking.vue"
import User from "./pages/user.vue"
import Results from "./pages/results.vue"
import UserEditor from "./pages/user-editor.vue"
import Registrations from "./pages/registrations.vue"
import { store } from "./store/store"

/**
 * Meta properties:
 * - tile:      a static document title for the page
 * - event:     true if the page is about a specific event
 * - organizer: true if the page is only for organizers & admins
 * - self:      true if the page is only for the current user & admins
 * - admin:     true if the page is only for admins
 */

const eventRoutes = [
    { path: "/", name: "home", component: Tournaments, meta: { title: "Tournaments", event: true } },
    { path: "/tournaments", name: "tournaments", component: Tournaments, meta: { title: "Tournaments", event: true } },
    { path: "/ranking", name: "ranking", component: Ranking, meta: { title: "Ranking", event: true } },
    { path: "/results/:name", name: "results", component: Results, meta: { event: true } },
    {
        path: "/registrations",
        name: "registrations",
        component: Registrations,
        meta: { title: "Registrations", organizer: true, event: true },
    },
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
    {
        path: "/tournaments/:name/results",
        name: "tournament-results",
        component: ResultsEditor,
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
        { path: "/user/:name", name: "user", component: User },
        { path: "/user/:name/edit", name: "edit-user", component: UserEditor, meta: { self: true } },
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
        return { name: "home" }

    if (!to.meta.visitor && !store.state.logged) {
        store.commit("setNext", to)
        return { name: "login" }
    }

    // if there are no events yet, redirect to event creation page
    if (store.state.init && to.name !== "new-event")
        return { name: "new-event" }

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

    if (to.meta.self && !store.state.user.admin && store.state.user.username !== to.params.name)
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
