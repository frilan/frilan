<script setup lang="ts">
import { computed, toRefs } from "vue"
import { useStore } from "../store/store"
import { useRoute, useRouter } from "vue-router"
import EventLink from "./event-link.vue"

const store = useStore()
const router = useRouter()
const route = useRoute()

let { user, logged, event, latestEvent } = $(toRefs(store.state))

let openMenu = $ref(false)
let isHome = $(computed(() => route.name === "home" || null))
let pastEvent = $(computed(() => event.id !== latestEvent))

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
    event-link(to="planning" :active="isHome") Planning
    event-link(to="ranking") Ranking
    button.link.menu-button(@click="openMenu = !openMenu") {{ user.displayName }}
    .menu(:class="{ open: openMenu }" @click="openMenu = false")
      .menu-items
        event-link(to="user" :params="{ name: user.username }") Profile
        button.link(@click="logout") Log out
</template>

<style scoped lang="sass">
$bg: #25252d
$border: #626269
$border-size: 2px
$link: white
$link-active: #ff5878

header
  display: flex
  align-items: center
  justify-content: space-between
  background-color: $bg
  border-bottom: $border-size solid $border
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
  color: $link
  text-decoration: none

  &:hover
    text-decoration: none
    color: $link-active

nav a, nav button.link
  text-align: center
  font-size: 1.1em
  $pad: 25px
  padding: $pad

  &.router-link-active, &[active]
    color: $link-active
    $border-active: calc(#{$border-size} + 4px)
    padding-bottom: calc(#{$pad} - #{$border-active} + #{$border-size})
    border-bottom: $border-active solid $link-active

  &.menu-button
    &:hover, &:focus
      color: $link-active

      &::after
        border-top-color: $link-active

    &::after
      position: absolute
      top: 32px
      right: 26px
      content: ""
      width: 0
      height: 0
      border-left: 5px solid transparent
      border-right: 5px solid transparent
      border-top: 5px solid $link

.menu
  &.open
    z-index: 50
    content: ""
    position: fixed
    top: 0
    bottom: 0
    left: 0
    right: 0

  &:not(.open)
    display: none

  .menu-items
    width: 120px
    z-index: 100
    position: absolute
    right: 20px
    top: 60px
    display: flex
    flex-direction: column
    background-color: $bg
    border: 2px solid $border
    border-radius: 10px

    &::before, &::after
      position: absolute
      content: ""
      width: 0
      height: 0

    &::before
      right: 28px
      top: -11px
      border-left: 10px solid transparent
      border-right: 10px solid transparent
      border-bottom: 10px solid $border

    &::after
      right: 30px
      top: -8px
      border-left: 8px solid transparent
      border-right: 8px solid transparent
      border-bottom: 8px solid $bg

    a, button.link
      text-align: start
      padding: 15px

      &:not(:last-child)
        padding-bottom: 0

.archive
  $link-active: #2bd767
  $bg: #2a3d29
  background-color: $bg

  a, button.link
    &:hover
      color: $link-active

  nav a, nav button.link
    &.router-link-active, &[active]
      color: $link-active
      border-color: $link-active

    &.menu-button
      &:hover, &:focus
        color: $link-active

        &::after
          border-top-color: $link-active

  .menu-items
    background-color: $bg

    &::after
      border-bottom-color: $bg
</style>
