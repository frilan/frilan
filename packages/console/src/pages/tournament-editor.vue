<script setup lang="ts">
import { useRoute, useRouter } from "vue-router"
import { useStore } from "../store/store"
import { Status, Tournament } from "@frilan/models"
import http from "../utils/http"
import { computed, watchEffect } from "vue"

const route = useRoute()
const router = useRouter()
const store = useStore()

const { id } = route.params
const { event } = store.state

// if true, we are editing an existing tournament
const editing = !!id

let tournament = $ref(editing
  ? await http.getOne("/tournaments/" + id, Tournament)
  : {
    name: "",
    date: event.start,
    duration: 120,
    rules: "",
    teamSizeMin: 1,
    teamSizeMax: 1,
    teamCountMin: 2,
    teamCountMax: 32,
    status: Status.Hidden,
  })

if (editing)
  watchEffect(() => document.title = `Edit ${ tournament.name } - Console`)

function formatDate(date: Date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, -1)
}

let localDate = $(computed({
  get: () => formatDate(tournament.date),
  set: val => tournament.date = new Date(val),
}))

let hidden = $(computed({
  get: () => tournament.status === Status.Hidden,
  set: val => tournament.status = val ? Status.Hidden : Status.Ready,
}))

let started = $(computed(() =>
  tournament.status === Status.Started
  || tournament.status === Status.Finished))

async function save() {
  if (editing)
    await http.patch("/tournaments/" + id, tournament)
  else
    await http.post("/tournaments", tournament)
  router.push({ name: "tournament", params: { id } })
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
    label(for="date") Date
    input(id="date" type="datetime-local" v-model="localDate"
      :min="formatDate(event.start)"
      :max="formatDate(event.end)")
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
