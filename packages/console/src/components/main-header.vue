<script setup lang="ts">
import { computed, toRefs } from "vue"
import { useStore } from "../store/store"
import { useRoute, useRouter } from "vue-router"
import EventLink from "./common/event-link.vue"
import Logo from "./common/logo.vue"
// noinspection ES6UnusedImports
import { Account, AccountMultipleCheck, Calendar, History, Medal, PodiumGold } from "mdue"

const store = useStore()
const router = useRouter()
const route = useRoute()

let { user, event, mainEvent, init } = $(toRefs(store.state))
let isOrganizer = $(computed(() => store.getters.isOrganizer))

let openMenu = $ref(false)
let isHome = $(computed(() => route.name === "home" || route.name === "event-home" || null))

// true if active event is not the current one
let pastEvent = $(computed(() => !init && event.shortName !== mainEvent))

function logout() {
  store.dispatch("logout")
  router.push({ name: "login" })
}
</script>

<template lang="pug">
header(:class="{ archive: pastEvent }")
  .title
    router-link.logo(:to="{ name: 'home' }")
      logo
    .event(v-if="pastEvent")
      history
      span {{ event.name }}
  nav
    template(v-if="init")
      button.link(@click="logout") Log out
    template(v-else)
      event-link.main-link(to="tournaments" :active="isHome")
        calendar
        span Tournaments
      event-link.main-link(to="ranking")
        podium-gold
        span Ranking
      event-link.main-link(to="results" :params="{ name: user.username }")
        medal
        span Results
      event-link.main-link(v-if="isOrganizer" to="registrations")
        account-multiple-check
        span Registrations
      button.link.menu-button(@click="openMenu = !openMenu")
        account
        span {{ user.displayName }}
      .menu(:class="{ open: openMenu }" @click="openMenu = false")
        .menu-items
          router-link(:to="{ name: 'user', params: { name: user.username } }") Profile
          router-link(:to="{ name: 'events' }") All events
          button.link(@click="logout") Log out
</template>

<style scoped lang="sass">
@import "../assets/styles/main"

$bg: #25252d
$border: $main-bg
$border-size: 2px
$link: white
$link-active: $accent
$pad: 15px

header
  display: flex
  align-items: center
  justify-content: space-between
  background-color: $bg
  border-bottom: $border-size solid $border

.title
  display: flex
  cursor: default
  padding-left: 12px

.logo
  padding: 0 8px

.event
  display: flex
  align-items: center
  font-size: 1.2em
  color: #bbffdd
  margin-left: 16px
  margin-top: 8px

  span
    transform: skew(-8.5deg)

  svg
    font-size: 1.2em
    margin-right: 6px

nav
  padding-right: 30px

a, button.link
  color: $link
  text-decoration: none

  &:hover
    text-decoration: none
    color: $link-active

nav a, nav button.link
  text-align: center
  font-size: 1.1em
  padding: $pad

  &.menu-button
    &:hover, &:focus
      color: $link-active

      &::after
        border-top-color: $link-active

    &::after
      position: absolute
      top: 25px
      right: 26px
      content: ""
      width: 0
      height: 0
      border-left: 5px solid transparent
      border-right: 5px solid transparent
      border-top: 5px solid $link

.main-link, .menu-button
  display: inline-flex
  align-items: center

  svg
    margin-right: 8px

.main-link.router-link-active, .main-link[active]
  cursor: default
  background-color: rgba(255, 88, 120, 0.1)
  color: $link-active
  $border-active: calc(#{$border-size} + 2px)
  padding-bottom: calc(#{$pad} - #{$border-active})
  border-bottom: $border-active solid $link-active

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
    right: 0
    top: 50px
    display: flex
    flex-direction: column
    background-color: $bg
    border: 2px solid $border
    border-right: none
    border-bottom-left-radius: 10px

    &::before, &::after
      position: absolute
      content: ""
      width: 0
      height: 0

    &::before
      right: 42px
      top: -11px
      border-left: 10px solid transparent
      border-right: 10px solid transparent
      border-bottom: 10px solid $border

    &::after
      right: 44px
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
  $bg: #263625
  background-color: $bg

  a, button.link
    &:hover
      color: $link-active

  nav a, nav button.link
    &.menu-button
      &:hover, &:focus
        color: $link-active

        &::after
          border-top-color: $link-active

  .main-link.router-link-active, .main-link[active]
    background-color: rgba(43, 215, 103, 0.1)
    color: $link-active
    border-color: $link-active

  .menu-items
    background-color: $bg

    &::after
      border-bottom-color: $bg
</style>
