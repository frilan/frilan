<script setup lang="ts">
import { computed, toRefs, watchEffect } from "vue"
import { useRoute } from "vue-router"
import { User } from "@frilan/models"
import { useStore } from "../store/store"
import http from "../utils/http"
import { NotFoundError } from "../utils/not-found-error"
import router from "../router"

const route = useRoute()
const store = useStore()

const { name } = route.params
let { user: currentUser } = $(toRefs(store.state))

const users = await http.getMany(`/users?username=${ name }`, User)
if (!users.length)
  throw new NotFoundError()

let user = $ref(users[0])
user.password = ""

let isCurrentUser = $(computed(() => currentUser.id === user.id))

watchEffect(() => document.title = `Edit ${ user.displayName } - Console`)

async function save() {
  const body: Partial<User> = { ...user }
  if (!currentUser.admin)
    delete body.admin
  if (!user.password.length)
    delete body.password
  if (!user.profilePicture?.length)
    body.profilePicture = undefined

  const updatedUser = await http.patch("/users/" + user.id, body, User)
  if (isCurrentUser)
    store.commit("setUser", { ...currentUser, ...updatedUser })

  router.push({ name: "user", params: { name: updatedUser.username } })
}
</script>

<template lang="pug">
h1 Edit {{ user.displayName }}

form(@submit.prevent="save")
  .field
    label(for="username") Username
    input(id="username" minlength=2 autofocus v-model="user.username")
  .field
    label(for="password") New password
    input(id="password" minlength=6 autofocus v-model="user.password")
  .field
    label(for="display-name") Display name
    input(id="display-name" minlength=2 v-model="user.displayName")
  .field
    label(for="start") Profile picture URL
    input(id="start" v-model="user.profilePicture")
  .field(v-if="currentUser.admin")
    label(for="admin") Administrator
    input(id="admin" type="checkbox" v-model="user.admin")
  button(type="submit") Save
</template>

<style scoped lang="sass">

</style>
