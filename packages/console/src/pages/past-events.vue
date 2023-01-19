<script setup lang="ts">
import { toRefs } from "vue"
import { Event, Role } from "@frilan/models"
import { useStore } from "@/store/store"
import { routeInEvent } from "@/utils/route-in-event"
import Checkbox from "@/components/common/checkbox.vue"
import OrganizerTag from "@/components/tags/organizer-tag.vue"
import PlayerTag from "@/components/tags/player-tag.vue"
import http from "@/utils/http"
import { AccountGroup, Calendar, Pencil } from "mdue"

const store = useStore()
let { user, mainEvent } = $(toRefs(store.state))

let events = await http.getMany("/events?load=registrations", Event)
events = events.filter(event => event.shortName !== mainEvent)
events.sort((a, b) => b.start.getTime() - a.start.getTime())

let onlyShowAttended = $ref(true)
let onlyAttended = $computed(() => events.filter(({ id }) => user.registrations.some(r => r.eventId === id)))

// if not attended any past event, or if attended all of them, simply show all events
let showAll = $computed(() => !onlyAttended.length || onlyAttended.length === events.length)
let filteredEvents = $computed(() => showAll || !onlyShowAttended ? events : onlyAttended)

function homeInEvent(event: Event) {
  return routeInEvent("home", event.shortName)
}

function formatDateRange(a: Date, b: Date) {

  function getMonth(date: Date) {
    return date.toLocaleString("default", { month: "long" })
  }

  if (a.getMonth() === b.getMonth())
    return `${ a.getDate() } – ${ b.getDate() } ${ getMonth(a) } ${ a.getFullYear() }`
  else
    return `${ a.getDate() } ${ getMonth(a) } – ${ b.getDate() } ${ getMonth(b) } ${ a.getFullYear() }`
}
</script>

<template lang="pug">
h1 Past events
template(v-if="events.length")
  p.info Click any event to browse previous tournaments and results

  header
    checkbox(v-if="!showAll" v-model="onlyShowAttended") Only show events I attended

  router-link.event(v-if="filteredEvents.length" v-for="event in filteredEvents" :to="homeInEvent(event)")
    .row
      h2 {{ event.name }}
      router-link.button(
        v-if="user.admin"
        :to="{ name: 'edit-event', params: { name: event.shortName } }"
        title="Edit event"
      )
        pencil
        span Edit
      organizer-tag(v-if="user.registrations.find(r => r.eventId === event.id)?.role === Role.Organizer")
      player-tag(v-else-if="user.registrations.some(r => r.eventId === event.id)")

      p(v-if="user.registrations.find(r => r.eventId === event.id)?.role === Role.Organizer")
    .row
      .date
        calendar
        span {{ formatDateRange(event.start, event.end) }}
      .attendees(title="Registered participants")
        account-group
        span {{ event.registrations.length }}

  p(v-else) You did not attend any previous event.

p(v-else) There are no events yet.
</template>

<style scoped lang="sass">
@import "@/assets/styles/main.sass"

h1, header, p
  text-align: center

.info
  color: $light-glass
  font-size: 0.9em

.event
  margin: 40px
  padding: 20px
  min-width: 400px
  min-height: 110px
  display: flex
  flex-direction: column
  justify-content: space-between
  background-color: rgba(0, 0, 0, 0.15)
  border-radius: 10px
  color: white
  transition: transform 0.15s

  &:hover
    background-color: rgba(0, 0, 0, 0.3)
    transform: scale(1.02)
    text-decoration: none
    color: white

  h2
    flex-grow: 1
    margin-top: 0

  p:last-child
    margin-bottom: 0

  .row
    display: flex
    justify-content: space-between
    align-items: start

    &:last-child
      align-items: end

  .button
    border-radius: 50px
    font-size: 0.8em
    padding: 6px 8px
    margin: 0 12px
    transition: opacity 0.1s linear

  &:not(:hover) .button
    opacity: 0

.date, .attendees
  @extend .icon-text

  svg
    color: $medium-glass

.date
  font-size: 1.1em

.attendees
  font-size: 1.2em
  background-color: rgba(0, 0, 0, 0.15)
  padding: 10px
  border-radius: 5px

  span
    margin-left: 6px
</style>
