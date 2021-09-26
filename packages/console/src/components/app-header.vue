<script setup lang="ts">
import { computed, toRefs } from "vue"
import { useStore } from "../store/store"
import { useRouter } from "vue-router"
import EventLink from "./event-link.vue"

const store = useStore()
const router = useRouter()

let { user, logged, event, latestEvent } = $(toRefs(store.state))

let pastEvent = computed(() => event.id !== latestEvent)

function logout() {
  store.dispatch("logout")
  router.push({ name: "login" })
}
</script>

<template lang="pug">
header(:class="{ archive: pastEvent }")
  div
    router-link.title(:to="{ name: 'home' }") console
    span.event(v-if="pastEvent") {{ event.name }}
  nav(v-if="logged")
    event-link(to="planning") Planning
    event-link(to="ranking") Ranking
    event-link(to="user" :params="{ name: user.username }") Profile
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

.event
  font-style: italic
  color: rgba(255, 255, 255, 0.5)
  margin-left: 12px

a, button.link
  font-size: 1.1em
  color: white
  text-decoration: none
  padding: 25px

  &:hover
    text-decoration: none
    color: #ff5878

.archive
  background-color: #2a3d29

  a, button.link
    &:hover
      color: #2bd767
</style>
