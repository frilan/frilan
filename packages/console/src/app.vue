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
  router-view(v-else v-slot="{ Component, route }")
    suspense
      transition(:name="route.meta.transition")
        .router-view(:key="route.fullPath")
          component(:is="Component" :key="route.fullPath")
</template>

<style lang="sass">
@import "./assets/styles/main"

#app
  height: 100vh
  display: flex
  flex-flow: column

main
  position: relative
  min-width: 800px
  margin: 0 auto
  background-color: $main-bg
  overflow-y: auto

  $scroll-track: rgba(200, 200, 255, 0.15)
  $scroll-thumb: rgba(200, 200, 255, 0.3)
  $scroll-hover: rgba(200, 200, 255, 0.45)

  // webkit
  &::-webkit-scrollbar
    width: 24px

  &::-webkit-scrollbar-track
    background-color: $scroll-track
    background-clip: padding-box
    border: 8px solid transparent
    border-radius: 100px

  &::-webkit-scrollbar-thumb
    background-color: $scroll-thumb
    background-clip: padding-box
    border: 8px solid transparent
    border-radius: 100px

    &:hover
      background-color: $scroll-hover

  // firefox
  scrollbar-width: thin
  scrollbar-color: $scroll-thumb $scroll-track
</style>
