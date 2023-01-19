<script setup lang="ts">
import { Event } from "@frilan/models"
import http from "@/utils/http"
import { routeInEvent } from "@/utils/route-in-event"
import { useStore } from "@/store/store"
import { AccountMultipleCheck, CalendarPlus, Delete, Pencil } from "mdue"

const store = useStore()

let events = $ref(await http.getMany("/events", Event))
events.sort((a, b) => b.start.getTime() - a.start.getTime())

async function deleteEvent(event: Event) {
  if (confirm(`Do you really want to delete ${ event.name } and all its tournaments?\nThis action is irreversible.`)) {
    await http.delete("/events/" + event.id)

    events = events.filter(({ id }) => id !== event.id)
    await store.dispatch("reloadEvents")
  }
}
</script>

<template lang="pug">
header
  h1 Events
  router-link.button(:to="{ name: 'new-event' }")
    calendar-plus
    span New event

table(v-if="events.length")
  tr(v-for="event in events")
    td {{ event.name }}
    td
      router-link.button(:to="{ name: 'edit-event', params: { name: event.shortName } }")
        pencil
        span Edit
    td
      router-link.button(:to="routeInEvent('registrations', event.shortName)")
        account-multiple-check
        span Registrations
    td
      button.button(@click="deleteEvent(event)")
        delete
        span Delete

p(v-else) There are no events.
</template>

<style scoped lang="sass">
header
  display: flex
  justify-content: space-between
  align-items: center
  margin: 0 50px
  min-width: 500px

table
  margin: 40px auto
  border-collapse: collapse

tr:not(:last-child)
  border-bottom: 1px solid rgba(255, 255, 255, 0.1)

td
  padding: 10px 3px

  &:first-child
    padding-right: 20px

  .button
    font-size: 0.9em
    padding: 8px 10px
    border-radius: 50px

p
  text-align: center
  margin: 40px
</style>
