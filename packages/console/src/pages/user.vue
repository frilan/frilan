<script setup lang="ts">
import { useStore } from "../store/store"
import http from "../utils/http"
import { toRefs } from "vue"
import type { RouteLocationRaw } from "vue-router"
import { useRoute } from "vue-router"
import { Event, Registration, Role, User } from "@frilan/models"
import { routeInEvent } from "../utils/route-in-event"
import { NotFoundError } from "../utils/not-found-error"

const route = useRoute()
const store = useStore()

const { name } = route.params
let { user: currentUser, mainEvent } = $(toRefs(store.state))

const user = (await http.getMany(`/users?username=${ name }&load=registrations`, User))[0]
if (!user)
  throw new NotFoundError()

const filter = "&id=" + user.registrations.map(r => r.eventId)
const events = await http.getMany("/events?load=registrations" + filter, Event)
events.sort((a, b) => b.start.getTime() - a.start.getTime())

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
</script>

<template lang="pug">
h1 {{ user.displayName }}

router-link(
  v-if="currentUser.admin || user.id === currentUser.id"
  :to="{ name: 'edit-user', params: { name } }")
  | Edit profile

p(v-if="user.admin") Administrator

template(v-if="entries.length")
  h2 All events
  .event(v-for="{ event, registration, rank } in entries")
    h3 {{ event.name }}
    p(v-if="registration.role === Role.Organizer") Organizer
    p Score: {{ registration.score }} pts
    p Rank: {{ rank }} / {{ event.registrations.filter(r => r.score).length }}
    router-link(:to="resultLink(event)") View results

p(v-else) This user isn't registered to any event
</template>

<style scoped lang="sass">

</style>
