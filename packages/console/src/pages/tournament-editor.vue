<script setup lang="ts">
import { useRoute, useRouter } from "vue-router"
import { useStore } from "../store/store"
import { Status, Tournament } from "@frilan/models"
import http from "../utils/http"
import { toRefs, watchEffect } from "vue"
import { routeInEvent } from "../utils/route-in-event"
import DatetimePicker from "../components/common/datetime-picker.vue"
import { NotFoundError } from "../utils/not-found-error"
import Checkbox from "../components/common/checkbox.vue"
import { Close, ContentSave } from "mdue"

const route = useRoute()
const router = useRouter()
const store = useStore()

const { name } = route.params
let { event, mainEvent } = $(toRefs(store.state))

// if true, we are editing an existing tournament
const editing = !!name

let tournament = $ref(new Tournament)

if (editing) {
  const tournaments = await http.getMany(`/events/${ event.id }/tournaments?shortName=${ name }`, Tournament)
  if (!tournaments.length)
    throw new NotFoundError()
  tournament = tournaments[0]

  watchEffect(() => document.title = `Edit ${ tournament.name } - Console`)

} else {
  // default values
  Object.assign(tournament, {
    name: "",
    shortName: "",
    date: event.start,
    duration: 120,
    teamSizeMin: 1,
    teamSizeMax: 5,
    teamCountMin: 2,
    teamCountMax: 32,
    status: new Date().getTime() > event.start.getTime() ? Status.Hidden : Status.Ready,
  })

  watchEffect(() => tournament.shortName = [...tournament.name.matchAll(/^\w|(?<= )\w|[A-Z\d]/g)]
    .map(([c]) => c).join("").toLowerCase())
}

watchEffect(() => tournament.shortName = tournament.shortName.toLowerCase())

let hidden = $computed({
  get: () => tournament.status === Status.Hidden,
  set: val => tournament.status = val ? Status.Hidden : Status.Ready,
})

let started = $computed(() =>
  tournament.status === Status.Started
  || tournament.status === Status.Finished)

let endDate = $computed(() => new Date(tournament.date.getTime() + tournament.duration * 60000))
let endTime = $computed(() => endDate.getHours() + ":" + endDate.getMinutes().toString().padStart(2, "0"))

let singlePlayer = $ref(tournament.teamSizeMax === 1)
let variableTeamSize = $ref(editing && tournament.teamSizeMax !== tournament.teamSizeMin)

async function save() {
  if (singlePlayer)
    tournament.teamSizeMin = tournament.teamSizeMax = 1
  if (!variableTeamSize)
    tournament.teamSizeMin = tournament.teamSizeMax

  // delete background if empty URL
  if (!tournament.background?.length)
    tournament.background = undefined

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
h1(v-if="editing") {{ tournament.name }}
h1(v-else) New tournament

form(@submit.prevent="save")
  fieldset
    label Tournament name
      input(minlength=1 autofocus v-model="tournament.name" required)
    label Abbreviation
      input(pattern="^[a-z0-9-]+$" v-model="tournament.shortName" required)
      .info(:class="{ hidden: !tournament.shortName.length }")
        | Tournament URL: #[code /tournaments/{{ tournament.shortName }}]

  fieldset
    label Date and time
      datetime-picker(v-model="tournament.date" :min="event.start" :max="event.end" required)
    label Duration
      .with-suffix
        input(type="number" min=1 v-model="tournament.duration" required)
        span minutes
      .info(:class="{ hidden: !tournament.duration }")
        | Tournament ends at {{ endTime }}

  fieldset(v-if="!started")
    .buttons-left.wide
      label Game type
      checkbox(v-model="singlePlayer") Single player
    label Maximum amount of {{ singlePlayer ? "players" : "teams" }}
      input(type="number" :min="tournament.teamCountMin" v-model="tournament.teamCountMax" required)
    label Minimum amount of {{ singlePlayer ? "players" : "teams" }}
      input(type="number" min=2 :max="tournament.teamCountMax" v-model="tournament.teamCountMin" required)
    template(v-if="!singlePlayer")
      label {{ variableTeamSize ? "Maximum members" : "Members" }} per team
        input(type="number" :min="variableTeamSize ? tournament.teamSizeMin : undefined"
          v-model="tournament.teamSizeMax" required)
      .variable-size(v-if="!variableTeamSize")
        checkbox(v-model="variableTeamSize") Variable team size
      label(v-else) Minimum members per team
        input(type="number" min=1 :max="tournament.teamSizeMax" v-model="tournament.teamSizeMin" required)

  fieldset
    label.wide Rules
      textarea.small(rows=10 v-model="tournament.rules")
    label.wide Background picture
      input.small(v-model="tournament.background" placeholder="Picture URL")
    .buttons-left.wide(v-if="!started")
      label Visibility
      checkbox(v-model="hidden") Hidden

  .buttons-right
    button.button(@click.prevent="router.back")
      close
      span Cancel
    button.button(type="submit")
      content-save
      span {{ editing ? "Save" : "Create" }}
</template>

<style scoped lang="sass">
@import "../assets/styles/main"
@import "../assets/styles/form"

h1
  text-align: center

form
  min-width: 700px
  padding: 20px

.with-suffix
  display: flex
  align-items: center

  input
    flex-grow: 1

  span
    padding: 8px

.info
  font-size: 0.9em
  color: rgba(255, 255, 255, 0.6)
  padding: 8px
  transition: opacity 0.1s linear

  code
    color: cornflowerblue
    background: rgba(0, 0, 0, 0.4)
    padding: 2px
    border-radius: 5px

.hidden
  opacity: 0

.variable-size
  @extend .buttons-left
  margin-top: 14px
</style>
