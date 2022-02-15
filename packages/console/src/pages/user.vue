<script setup lang="ts">
import { useStore } from "../store/store"
import http from "../utils/http"
import { toRefs, watchEffect } from "vue"
import type { RouteLocationRaw } from "vue-router"
import { useRoute } from "vue-router"
import { Event, Registration, Role, User } from "@frilan/models"
import { routeInEvent } from "../utils/route-in-event"
import { NotFoundError } from "../utils/not-found-error"
import { Subscriber } from "../utils/subscriber"
import ProfilePicture from "../components/common/profile-picture.vue"
import ConsoleIcon from "../assets/images/console.svg?component"
import { AccountEdit, Medal } from "mdue"
import AdminTag from "../components/tags/admin-tag.vue"
import OrganizerTag from "../components/tags/organizer-tag.vue"

const route = useRoute()
const store = useStore()

const { name } = route.params
let { user: currentUser, mainEvent } = $(toRefs(store.state))

let user = $ref((await http.getMany(`/users?username=${ name }&load=registrations`, User))[0])
if (!user)
  throw new NotFoundError()

watchEffect(() => document.title = `${ user.displayName } - Console`)

let events: Event[] = []
if (user.registrations.length) {
  const filter = "&id=" + user.registrations.map(r => r.eventId)
  events = await http.getMany("/events?load=registrations" + filter, Event)
  events.sort((a, b) => b.start.getTime() - a.start.getTime())
}

interface EventEntry {
  event: Event
  registration: Registration
  rank: number
}

const entries: EventEntry[] = []
for (const event of events) {
  event.registrations.sort((a, b) => b.score - a.score)
  const rank = event.registrations.findIndex(r => r.userId === user.id) + 1
  const registration = event.registrations[rank - 1]
  entries.push({ event, registration, rank })
}

/**
 * Returns the route location of the results page from the given event.
 * @param event The event
 */
function resultLink(event: Event): RouteLocationRaw {
  if (event.shortName === mainEvent)
    return { name: "results", params: { name } }
  else
    return routeInEvent("results", event.shortName, { name })
}

/**
 * Generates the style for a specific event card.
 * @param event The event
 */
function eventStyle(event: Event) {
  const colorA = `hsla(${ event.id * 127 }, 30%, 30%, 0.8)`
  const colorB = `hsla(${ event.id * 127 + 60 }, 40%, 15%, 0.8)`
  return {
    background: `linear-gradient(130deg, ${ colorA } 0%, ${ colorB } 100%)`,
    outline: `2px solid ${ colorB }`,
  }
}

// handle live updates
new Subscriber(User, { id: user.id })
  .onUpdate(updatedUser => Object.assign(user, updatedUser))
</script>

<template lang="pug">
header
  .profile
    profile-picture.pp(:user="user" :size="9" square)
    .info
      admin-tag(v-if="user.admin")
      .username(v-if="user.username !== user.displayName" title="Username") {{ user.username }}
      h1 {{ user.displayName }}

  .edit(v-if="currentUser.admin || user.id === currentUser.id")
    router-link.button(:to="{ name: 'edit-user', params: { name } }")
      account-edit
      span Edit profile

template(v-if="entries.length")
  h2 Attended events
  .event(v-for="{ event, registration, rank } in entries" :style="eventStyle(event)")
    div
      h3
        console-icon
        span {{ event.name }}
      table
        tr
          td Score
          td.value {{ registration.score }} pts
        tr(v-if="registration.score")
          td Rank
          td.value {{ rank }} / {{ event.registrations.filter(r => r.score).length }}
    div
      organizer-tag(v-if="registration.role === Role.Organizer")
      div(v-else)
      router-link.button(:to="resultLink(event)")
        medal
        span View results

p.no-attended(v-else) This user did not attend any event.
</template>

<style scoped lang="sass">
@import "../assets/styles/main"

header
  min-width: 550px
  margin: 40px
  display: flex
  justify-content: space-between
  align-items: start

.profile
  display: flex
  align-items: end

.info
  display: flex
  flex-direction: column
  align-items: start
  margin-left: 15px

  h1
    font-size: 3em
    margin: 0

  .username
    margin-bottom: 8px
    font-size: 1.3em
    color: rgba(255, 255, 255, 0.6)

  .admin-tag
    margin-bottom: 14px

h2
  @extend .skewed
  text-align: center
  border-top: 1px solid $dark-glass
  padding-top: 30px
  margin: 0 30px

.event
  margin: 30px
  padding: 20px
  min-height: 100px
  border-radius: 10px
  display: flex
  justify-content: space-between

  & > div
    display: flex
    flex-direction: column
    justify-content: space-between

    &:last-child
      align-items: end

  h3
    margin: 0
    display: flex
    align-items: center

    svg
      height: 22px
      margin-right: 12px

    span
      @extend .skewed
      color: white

  table
    max-width: 120px
    border-collapse: collapse
    color: rgba(255, 255, 255, 0.7)

  td
    padding-top: 20px

    &.value
      font-weight: bold
      color: white
      margin-left: 10px
      text-align: center

  .button
    background-color: rgba(255, 255, 255, 0.1)

    &:hover
      background-color: rgba(255, 255, 255, 0.15)

.no-attended
  margin: 40px
  color: rgba(255, 255, 255, 0.7)
</style>
