<script setup lang="ts">
import { useRouter } from "vue-router"
import { useStore } from "../store/store"
import http from "../utils/http"
import { User } from "@frilan/models"

const router = useRouter()
const store = useStore()

let username = $ref("")
let password = $ref("")

async function join() {
  const user = new User()
  Object.assign(user, { username, password, displayName: username })
  await http.post("/users", user)
  await store.dispatch("login", user)
  router.push({ name: "home" })
}
</script>

<template lang="pug">
h1 Create a new account
form(@submit.prevent="join")
  .field
    label(for="username") Username
    input(id="username" autocomplete="username" v-model="username")
  .field
    label(for="password") Password
    input(id="password" type="password" autocomplete="new-password" v-model="password")
  button(type="submit") Join

router-link(:to="{ name: 'login' }") Log in to an existing account
</template>

<style lang="sass" scoped>

</style>
