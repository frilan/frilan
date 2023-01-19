<script setup lang="ts">
import { onErrorCaptured, toRefs, watchEffect } from "vue"
import { useRoute, useRouter } from "vue-router"
import axios from "axios"
import { PageStatus, useStore } from "@/store/store"
import { isNotFoundError } from "@/utils/not-found-error"
import ErrorHandler from "@/components/error-handler.vue"
import MainHeader from "@/components/main-header.vue"
import NotFound from "@/pages/not-found.vue"

const store = useStore()
const router = useRouter()
const route = useRoute()

let { logged, status } = $(toRefs(store.state))
let inPastEvent = $computed(() => store.getters.inPastEvent)

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

// apply global filter when browsing past events
watchEffect(() => {
  if (inPastEvent)
    document.body.classList.add("past-event")
  else
    document.body.classList.remove("past-event")
})
</script>

<template lang="pug">
main-header(v-if="logged")
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
@import "@/assets/styles/main.sass"

#app
  height: 100vh
  display: flex
  flex-flow: column

main
  position: relative
  margin: 0 auto
  background-color: $main-bg
  box-shadow: 0 0 50px rgba(0, 0, 0, 0.25)
  overflow-y: auto
  @extend .scrollable
</style>
