import { createApp } from "vue"
import App from "./app.vue"
import router from "./router"
import { key, store } from "./store/store"
import axios from "axios"

axios.defaults.baseURL = import.meta.env.VITE_API_URL as string ?? "http://localhost"

const app = createApp(App)

app.use(router)
app.use(store, key)
app.mount("#app")
