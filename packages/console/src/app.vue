<script setup lang="ts">
import { onErrorCaptured, toRefs } from "vue"
import { PageStatus, useStore } from "./store/store"
import { useRoute, useRouter } from "vue-router"
import axios from "axios"
import { isNotFoundError } from "./utils/not-found-error"
import ErrorHandler from "./components/common/error-handler.vue"
import AppHeader from "./components/common/app-header.vue"
import NotFound from "./pages/not-found.vue"

const store = useStore()
const router = useRouter()
const route = useRoute()

let { logged, status } = $(toRefs(store.state))

// catch unhandled errors
onErrorCaptured((err: unknown) => {
  // if not found error thrown, set page status accordingly
  if (isNotFoundError(err)) {
    store.commit("setPageStatus", PageStatus.NotFound)
    return false
  }
  // if authentication failed, log user out
  if (logged && axios.isAxiosError(err) && err.response?.status === 401) {
    store.dispatch("logout")
    router.push({ name: "login" })
    return false
  }
  store.commit("setError", err)
  return true
})
</script>

<template lang="pug">
app-header(v-if="logged")
main
  error-handler
  not-found(v-if="status === PageStatus.NotFound")
  router-view(v-else v-slot="{ Component }")
    suspense
      component(:is="Component" :key="route.fullPath")
</template>

<style lang="sass">
#app
  font-family: Avenir, Helvetica, Arial, sans-serif
  -webkit-font-smoothing: antialiased
  -moz-osx-font-smoothing: grayscale

main
  max-width: 800px
  margin: 30px auto
</style>
