<script setup lang="ts">
import { useRouter } from "vue-router"
import { useStore } from "../store/store"

const router = useRouter()
const store = useStore()

let username = $ref("")

async function login() {
  await store.dispatch("login", username)
  router.push({ name: "home" })
}
</script>

<template lang="pug">
h2 Log in to your account
form(@submit.prevent="login")
  .field
    label(for="username") Username
    input(id="username" v-model="username")
  button(type="submit") Log in

router-link(:to="{ name: 'join' }") Create a new account
</template>

<style lang="sass" scoped>

</style>
