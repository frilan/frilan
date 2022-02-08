<script setup lang="ts">
import { toRefs } from "vue"
import { useStore } from "../store/store"
import { Event, Role } from "@frilan/models"
import { routeInEvent } from "../utils/route-in-event"
import Checkbox from "../components/common/checkbox.vue"
import http from "../utils/http"

const store = useStore()
let { user, mainEvent } = $(toRefs(store.state))

// initially true if registered for at least one event
let onlyRegistered = $ref(!!user.registrations.length)

let events = await http.getMany("/events?load=registrations", Event)
events.sort((a, b) => b.start.getTime() - a.start.getTime())

let filteredEvents = $computed(() => onlyRegistered
  ? events.filter(({ id }) => user.registrations.some(r => r.eventId === id))
  : events)

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

template(v-if="events.length")
  checkbox(v-model="onlyRegistered") Only show events I'm registered for

  .event(v-if="filteredEvents.length" v-for="event in filteredEvents")
    h2
      router-link(v-if="isMainEvent(event)" :to="{ name: 'home' }") {{ event.name }}
      router-link(v-else :to="homeInEvent(event)") {{ event.name }}
    router-link(v-if="user.admin" :to="{ name: 'edit-event', params: { name: event.shortName } }") Edit
    p From {{ event.start.toLocaleString() }} to {{ event.end.toLocaleString() }}
    p {{ event.registrations.length }} attendants
    p(v-if="user.registrations.find(r => r.eventId === event.id)?.role === Role.Organizer")
      | You are an organizer of this event

  p(v-else) You are not registered for an event yet.

p(v-else) There are no events yet.
</template>

<style scoped lang="sass">

</style>
