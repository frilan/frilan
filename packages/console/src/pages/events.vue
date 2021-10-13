<script setup lang="ts">
import { computed } from "vue"
import { useStore } from "../store/store"
import { Event, Role } from "@frilan/models"
import { routeInEvent } from "../utils/route-in-event"
import http from "../utils/http"

const store = useStore()
const { user, mainEvent } = store.state

// true if registered to at least one event
let registered = $(computed(() => !!user.registrations.length))

let events: Event[]
if (registered || user.admin) {
  // if not admin, only fetch events the user is registered to
  const filter = user.admin ? "" : "&id=" + user.registrations.map(r => r.eventId)

  events = await http.getMany("/events?load=registrations" + filter, Event)
  events.sort((a, b) => b.start.getTime() - a.start.getTime())
}

function isMainEvent(event: Event) {
  return event.shortName === mainEvent
}

function homeInEvent(event: Event) {
  return routeInEvent("home", event.shortName)
}

</script>

<template lang="pug">
h1 Events
router-link(v-if="user.admin" :to="{ name: 'new-event' }") New event

.event(v-if="registered || user.admin" v-for="event in events")
  h2
    router-link(v-if="isMainEvent(event)" :to="{ name: 'home' }") {{ event.name }}
    router-link(v-else :to="homeInEvent(event)") {{ event.name }}
  router-link(v-if="user.admin" :to="{ name: 'edit-event', params: { name: event.shortName } }") Edit
  p From {{ event.start.toLocaleString() }} to {{ event.end.toLocaleString() }}
  p {{ event.registrations.length }} attendants
  p(v-if="user.registrations.find(r => r.eventId === event.id)?.role === Role.Organizer")
    | You are an organizer of this event

p(v-else) You are not registered to an event yet.
</template>

<style scoped lang="sass">

</style>
