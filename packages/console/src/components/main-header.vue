<script setup lang="ts">
import { toRefs } from "vue"
import { useStore } from "../store/store"
import { useRoute, useRouter } from "vue-router"
import EventLink from "./common/event-link.vue"
import Logo from "./common/logo.vue"
import ProfilePicture from "./common/profile-picture.vue"
import {
  Account, AccountMultipleCheck, Calendar, CalendarMultiple, CalendarPlus, ClockOut, CloseCircle, History,
  Logout as LogoutIcon, Medal, PodiumGold,
} from "mdue"

const store = useStore()
const router = useRouter()
const route = useRoute()

let { user, event, init } = $(toRefs(store.state))
let isOrganizer = $computed(() => store.getters.isOrganizer)
let inPastEvent = $computed(() => store.getters.inPastEvent)
let isRegistered = $computed(() => store.getters.isRegistered)

let openMenu = $ref(false)
let isHome = $computed(() => route.name === "home" || route.name === "event-home" || null)

function logout() {
  store.dispatch("logout")
  router.push({ name: "login" })
}
</script>

<template lang="pug">
header
  .title
    event-link.logo(to="home")
      logo
    .event(v-if="inPastEvent" title="Currently browsing a past event")
      history
      span {{ event.name }}
      router-link.close(:to="{ name: 'home' }" title="Back to main event")
        close-circle
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
      event-link.main-link(v-if="isRegistered" to="results" :params="{ name: user.username }")
        medal
        span Results
      button.link.menu-button(@click="openMenu = !openMenu")
        profile-picture.pp(:user="user" :size="1.75")
      .menu(:class="{ open: openMenu }" @click="openMenu = false")
        .menu-items
          .username(@click.stop) {{ user.displayName }}
          router-link.icon-text(:to="{ name: 'user', params: { name: user.username } }")
            account
            span Profile
          router-link.icon-text(:to="{ name: 'events' }")
            history
            span Past events
          router-link.icon-text(v-if="inPastEvent" :to="{ name: 'home' }")
            clock-out
            span Back to main event
          .separator
          .admin(v-if="isOrganizer")
            event-link.icon-text(to="registrations")
              account-multiple-check
              span Registrations
            event-link.icon-text(to="new-tournament")
              calendar-plus
              span New Tournament
            router-link.icon-text(v-if="user.admin" :to="{ name: 'new-event' }")
              calendar-multiple
              span New event
            .separator
          button.link.icon-text(@click="logout")
            logout-icon
            span Log out
</template>

<style scoped lang="sass">
@import "../assets/styles/main"

$bg: #25252d
$bg-light: #39394f
$border: $main-bg
$border-light: #616180
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
  z-index: 100

.title
  display: flex
  cursor: default
  align-items: center
  padding-left: 12px

.logo
  padding: 0 8px

.event
  font-size: 1.3em
  font-weight: bold
  display: flex
  align-items: center
  color: rgba(220, 230, 255, 0.8)
  margin-left: 10px
  background-color: rgba(255, 255, 255, 0.1)
  padding: 3px
  border-radius: 5px

  span
    transform: skew(-8.5deg)

  > svg
    font-size: 1.2em
    margin: 0 6px

  .close
    font-size: 0.9em
    display: inline-flex
    padding: 6px

nav
  display: flex
  align-items: center

a, button.link
  color: $link
  text-decoration: none

  &:hover
    text-decoration: none
    color: $link-active

nav a, nav button.link
  text-align: center
  padding: $pad

  &.menu-button
    padding: 11px 40px 11px 15px

    .pp
      outline: 2px solid rgba(220, 230, 255, 0.2)

    &:hover, &:focus
      color: $link-active

      .pp
        outline: 2px solid $link-active

      &::after
        border-top-color: $link-active

    &::after
      position: absolute
      top: 25px
      right: 20px
      content: ""
      width: 0
      height: 0
      border-left: 5px solid transparent
      border-right: 5px solid transparent
      border-top: 5px solid $link

.main-link, .menu-button
  display: inline-flex
  align-items: center
  font-size: 1.1em

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
  transition: opacity 0.1s, transform 0.2s
  transform-origin: top right
  z-index: 50
  content: ""
  position: fixed
  top: 0
  bottom: 0
  left: 0
  right: 0

  &:not(.open)
    opacity: 0
    transform: scale(0.8)
    pointer-events: none

  .menu-items
    min-width: 160px
    z-index: 100
    position: absolute
    right: 24px
    top: 48px
    background-color: $bg
    border: 2px solid $border-light
    border-radius: 10px
    box-shadow: 0 0 50px rgba(0, 0, 0, 0.3)

    &::before, &::after
      position: absolute
      content: ""
      width: 0
      height: 0

    &::before
      right: 17px
      top: -11px
      border-left: 10px solid transparent
      border-right: 10px solid transparent
      border-bottom: 10px solid $border-light

    &::after
      right: 19px
      top: -8px
      border-left: 8px solid transparent
      border-right: 8px solid transparent
      border-bottom: 8px solid $bg-light

    a, button.link
      text-align: start
      padding: 10px 20px 10px 15px

      svg
        margin-right: 12px

      &:not(:hover) svg
        color: rgba(220, 230, 255, 0.75)

      &:first-of-type
        padding-top: 15px

      &:last-of-type
        padding-bottom: 15px

.admin
  background-color: rgba(255, 0, 100, 0.15)

.username
  color: rgba(220, 230, 255, 0.75)
  background-color: $bg-light
  font-size: 1.1em
  text-align: center
  font-weight: bold
  padding: 10px 0
  border-top-left-radius: 8px
  border-top-right-radius: 8px

.separator
  border-bottom: 2px solid $border
</style>
