import { createApp } from "vue"
import "reflect-metadata"
import App from "./app.vue"
import router from "./router"
import { key, store } from "./store/store"
import "@fontsource/inter"

const app = createApp(App)

app.use(router)
app.use(store, key)
app.mount("#app")
