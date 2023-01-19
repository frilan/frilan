<script setup lang="ts">
import { useRouter } from "vue-router"
import { useStore } from "@/store/store"
import http from "@/utils/http"
import { User } from "@frilan/models"
import { Login } from "mdue"

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
h1 New account
form(@submit.prevent="join")
  fieldset
    label Username
      input(autocomplete="username" v-model="username" minlength=2 maxlength=30 required)
    label Password
      input(type="password" autocomplete="new-password" v-model="password" minlength=6 required)
  .buttons-right
    button.button(type="submit")
      login
      span Join

footer
  router-link(:to="{ name: 'login' }") Log in to an existing account
</template>

<style lang="sass" scoped>
@import "@/assets/styles/form.sass"

h1
  text-align: center
  margin-top: 30px

form
  padding: 30px

footer
  margin-bottom: 30px
  text-align: center
</style>
