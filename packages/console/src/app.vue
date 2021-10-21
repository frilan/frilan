<script setup lang="ts">
import { onErrorCaptured, toRefs } from "vue"
import { useStore } from "./store/store"
import { useRoute, useRouter } from "vue-router"
import axios from "axios"
import ErrorHandler from "./components/common/error-handler.vue"
import AppHeader from "./components/common/app-header.vue"

const store = useStore()
const router = useRouter()
const route = useRoute()

let { logged } = $(toRefs(store.state))

// catch unhandled errors
onErrorCaptured(err => {
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
app-header
main
  error-handler
  suspense
    router-view(v-slot="{ Component }")
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
