<script setup lang="ts">
import { useRouter } from "vue-router"
import { useStore } from "../store/store"

const router = useRouter()
const store = useStore()

let username = $ref("")
let password = $ref("")

async function login() {
  await store.dispatch("login", { username, password })

  // redirect to active event if registered to it
  if (store.state.user.registrations.length) {
    const eventName = store.state.event.shortName
    if (store.state.mainEvent === eventName)
      router.push({ name: "home" })
    else
      router.push({ name: "event-home", params: { eventName } })
  } else
    router.push({ name: "events" })
}
</script>

<template lang="pug">
h1 Log in to your account
form(@submit.prevent="login")
  .field
    label(for="username") Username
    input(id="username" autocomplete="username" v-model="username")
  .field
    label(for="password") Password
    input(id="password" type="password" autocomplete="current-password" v-model="password")
  button(type="submit") Log in

router-link(:to="{ name: 'join' }") Create a new account
</template>

<style lang="sass" scoped>

</style>
