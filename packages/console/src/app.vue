<script setup lang="ts">
import { onErrorCaptured, toRefs } from "vue"
import { useStore } from "./store/store"
import { useRoute, useRouter } from "vue-router"
import axios from "axios"
import ErrorHandler from "./components/error-handler.vue"
import UserLink from "./components/user-link.vue"

const store = useStore()
const router = useRouter()
const route = useRoute()

let { user, logged } = $(toRefs(store.state))

// catch unhandled errors
onErrorCaptured(err => {
  // if authentication failed, log user out
  if (axios.isAxiosError(err) && err.response?.status === 401) {
    logout()
    return false
  }
  store.commit("setError", err)
  return true
})

function logout() {
  store.dispatch("logout")
  router.push({ name: "login" })
}
</script>

<template lang="pug">
header
  .title Console
  template(v-if="logged")
    p Logged in as!{" "}
      user-link(:user="user")
    button(@click="logout") Log out
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

.title
  font-size: 2em

@media (prefers-color-scheme: dark)
  html
    background: #2f3136
    color: white
  a
    color: cornflowerblue
</style>
