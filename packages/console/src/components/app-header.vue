<script setup lang="ts">
import { toRefs } from "vue"
import { useStore } from "../store/store"
import { useRouter } from "vue-router"

const store = useStore()
const router = useRouter()

let { user, logged } = $(toRefs(store.state))

function logout() {
  store.dispatch("logout")
  router.push({ name: "login" })
}
</script>

<template lang="pug">
header
  router-link.title(:to="{ name: 'home' }") console
  nav(v-if="logged")
    router-link(:to="{ name: 'planning' }") Planning
    router-link(:to="{ name: 'ranking' }") Ranking
    router-link(:to="{ name: 'user', params: { name: user.username } }") Profile
    button.link(@click="logout") Log out
</template>

<style scoped lang="sass">
header
  display: flex
  align-items: center
  justify-content: space-between
  background-color: #25252d
  border-bottom: 2px solid rgba(255, 255, 255, 0.2)
  padding: 0 20px

.title
  font-style: italic
  font-weight: bold
  font-size: 2em
  padding: 16px 8px

a, button.link
  font-size: 1.1em
  color: white
  text-decoration: none
  padding: 25px

  &:hover
    text-decoration: none
    color: #ff5878
</style>
