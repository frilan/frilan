<script setup lang="ts">
import { onErrorCaptured, toRefs } from "vue"
import { useStore } from "./store/store"
import ErrorHandler from "./components/error-handler.vue"
import { useRouter } from "vue-router"
import axios from "axios"

const store = useStore()
const router = useRouter()

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
  h1 Console
  template(v-if="logged")
    p Logged in as {{ user.displayName }}
    button(@click="logout") Log out
main
  error-handler
  router-view
</template>

<style lang="sass">
#app
  font-family: Avenir, Helvetica, Arial, sans-serif
  -webkit-font-smoothing: antialiased
  -moz-osx-font-smoothing: grayscale
</style>
