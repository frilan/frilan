import { createRouter, createWebHistory } from "vue-router"
import Home from "./components/home.vue"
import Join from "./components/join.vue"
import Login from "./components/login.vue"

export default createRouter({
    history: createWebHistory(),
    routes: [
        { path: "/", name: "home", component: Home },
        { path: "/login", name: "login", component: Login },
        { path: "/join", name: "join", component: Join },
    ],
})
