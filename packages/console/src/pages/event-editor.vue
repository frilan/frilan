<script setup lang="ts">
import { watchEffect } from "vue"
import { useRoute, useRouter } from "vue-router"
import { useStore } from "../store/store"
import { Event } from "@frilan/models"
import http from "../utils/http"
import { computedDate, formatDate } from "../utils/date-helpers"
import { routeInEvent } from "../utils/route-in-event"

const route = useRoute()
const router = useRouter()
const store = useStore()

const { name } = route.params

// if true, we are editing an existing event
const editing = !!name

const nextYear = (new Date().getFullYear() + 1)
let event = $ref({
  id: NaN,
  name: "FriLAN " + nextYear,
  shortName: nextYear.toString(),
  start: new Date(new Date(nextYear.toString())),
  end: new Date(new Date(nextYear + "-01-03")),
})

if (editing) {
  const events = await http.getMany(`/events?shortName=${ name }`, Event)
  if (!events.length)
    throw "Event not found: " + name
  event = events[0]

  watchEffect(() => document.title = `Edit ${ event.name } - Console`)
} else
  watchEffect(() => event.shortName = [...event.name.matchAll(/\d+/g)]
    .map(([c]) => c).join("").toLowerCase())

let localStart = $(computedDate(event, "start"))
let localEnd = $(computedDate(event, "end"))

async function save() {
  if (editing)
    await http.patch("/events/" + event.id, event)
  else {
    await http.post("events", event, Event)
    await store.dispatch("loadEvents")
  }

  if (event.shortName === store.state.mainEvent)
    router.push({ name: "home" })
  else
    router.push(routeInEvent("home", event.shortName))
}

</script>

<template lang="pug">
h1(v-if="editing") Edit {{ event.name }}
h1(v-else) New event

form(@submit.prevent="save")
  .field
    label(for="name") Name
    input(id="name" minlength=1 autofocus v-model="event.name")
  .field
    label(for="short-name") Short name
    input(id="short-name" pattern="^[a-z0-9-]+$" autofocus v-model="event.shortName")
  .field
    label(for="start") Start date
    input(id="start" type="datetime-local" v-model="localStart")
  .field
    label(for="end") End date
    input(id="end" type="datetime-local" v-model="localEnd" :min="formatDate(event.start)")
  button(type="submit") {{ editing ? "Save" : "Create" }}
</template>

<style scoped lang="sass">

</style>
