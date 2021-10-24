<script setup lang="ts">
import { useRoute, useRouter } from "vue-router"
import { useStore } from "../store/store"
import { Status, Tournament } from "@frilan/models"
import http from "../utils/http"
import { computed, watchEffect } from "vue"
import { routeInEvent } from "../utils/route-in-event"
import DatetimePicker from "../components/common/datetime-picker.vue"

const route = useRoute()
const router = useRouter()
const store = useStore()

const { name } = route.params
const { event, mainEvent } = store.state

// if true, we are editing an existing tournament
const editing = !!name

let tournament = $ref({
  id: NaN,
  name: "",
  shortName: "",
  date: event.start,
  duration: 120,
  rules: "",
  teamSizeMin: 1,
  teamSizeMax: 1,
  teamCountMin: 2,
  teamCountMax: 32,
  status: Status.Hidden,
})

if (editing) {
  const tournaments = await http.getMany(`/events/${ event.id }/tournaments?shortName=${ name }`, Tournament)
  if (!tournaments.length)
    throw "Tournament not found: " + name
  tournament = tournaments[0]

  watchEffect(() => document.title = `Edit ${ tournament.name } - Console`)

} else
  watchEffect(() => tournament.shortName = [...tournament.name.matchAll(/^\w|(?<= )\w|[A-Z\d]/g)]
    .map(([c]) => c).join("").toLowerCase())

let hidden = $(computed({
  get: () => tournament.status === Status.Hidden,
  set: val => tournament.status = val ? Status.Hidden : Status.Ready,
}))

let started = $(computed(() =>
  tournament.status === Status.Started
  || tournament.status === Status.Finished))

async function save() {
  if (editing)
    await http.patch("/tournaments/" + tournament.id, tournament)
  else
    await http.post(`/events/${ event.id }/tournaments`, tournament, Tournament)

  if (event.shortName === mainEvent)
    router.push({ name: "tournament", params: { name: tournament.shortName } })
  else
    router.push(routeInEvent("tournament", event.shortName, { name: tournament.shortName }))
}

</script>

<template lang="pug">
h1(v-if="editing") Edit {{ tournament.name }}
h1(v-else) New tournament

form(@submit.prevent="save")
  .field
    label(for="name") Name
    input(id="name" minlength=1 autofocus v-model="tournament.name")
  .field
    label(for="short-name") Short name
    input(id="short-name" pattern="^[a-z0-9-]+$" v-model="tournament.shortName")
  .field
    label(for="date") Date
    datetime-picker(id="date" v-model="tournament.date"
      :min="event.start"
      :max="event.end")
  .field
    label(for="duration") Duration
    input(id="duration" type="number" min=1 v-model="tournament.duration")
    span minutes
  template(v-if="!started")
    .field
      label(for="size") Team size
      input(id="size" type="number" v-model="tournament.teamSizeMax")
    .field
      label(for="size-min") Minimum size
      input(id="size-min" type="number" v-model="tournament.teamSizeMin")
    .field
      label(for="count") Team count
      input(id="count" type="number" v-model="tournament.teamCountMax")
    .field
      label(for="count-min") Minimum count
      input(id="count-min" type="number" min=2 v-model="tournament.teamCountMin")
  .field
    label(for="rules") Rules
    textarea(id="rules" rows=6 v-model="tournament.rules")
  .field(v-if="!started")
    label(for="hidden") Hidden
    input(id="hidden" type="checkbox" v-model="hidden")

  button(type="submit") {{ editing ? "Save" : "Create" }}
</template>

<style scoped lang="sass">

</style>
