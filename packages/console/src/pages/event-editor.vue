<script setup lang="ts">
import { watchEffect } from "vue"
import { useRoute, useRouter } from "vue-router"
import { useStore } from "../store/store"
import { Event } from "@frilan/models"
import http from "../utils/http"
import { routeInEvent } from "../utils/route-in-event"
import DatetimePicker from "../components/common/datetime-picker.vue"
import { NotFoundError } from "../utils/not-found-error"
import { Close, ContentSave } from "mdue"

const route = useRoute()
const router = useRouter()
const store = useStore()

const { name } = route.params

// if true, we are editing an existing event
const editing = !!name

const currentYear = new Date().getFullYear()
let event = $ref({
  id: NaN,
  name: "FriLAN " + currentYear,
  shortName: currentYear.toString(),
  start: new Date(new Date(currentYear.toString())),
  end: new Date(new Date(currentYear + "-01-03")),
})

if (editing) {
  const events = await http.getMany(`/events?shortName=${ name }`, Event)
  if (!events.length)
    throw new NotFoundError()
  event = events[0]

  watchEffect(() => document.title = `Edit ${ event.name } - Console`)
} else
  watchEffect(() => event.shortName = [...event.name.matchAll(/\d+/g)]
    .map(([c]) => c).join("").toLowerCase())

async function save() {
  if (editing) {
    await http.patch("/events/" + event.id, event)
    router.push({ name: "manage-events" })
  } else {
    await http.post("/events", event, Event)
    await store.dispatch("reloadEvents")
    if (event.shortName === store.state.mainEvent)
      router.push({ name: "home" })
    else
      router.push(routeInEvent("home", event.shortName))
  }
}
</script>

<template lang="pug">
h1(v-if="editing") {{ event.name || "&nbsp;" }}
h1(v-else-if="store.state.init") Initial event
h1(v-else) New event

form(@submit.prevent="save")
  fieldset
    label Name
      input(minlength=1 autofocus v-model="event.name" required)
    label Abbreviation
      input(pattern="^[a-z0-9-]+$" v-model="event.shortName" required)
      .info(:class="{ hidden: !event.shortName.length }")
        | Event URL: #[code /events/{{ event.shortName }}]
    label Start
      datetime-picker(v-model="event.start" required)
    label End
      datetime-picker(v-model="event.end" :min="event.start" required)
  .buttons-right
    button.button(v-if="!store.state.init" type="button" @click.prevent="router.back")
      close
      span Cancel
    button.button(type="submit")
      content-save
      span {{ editing ? "Save" : "Create" }}
</template>

<style scoped lang="sass">
@import "../assets/styles/form"

h1
  text-align: center

form
  min-width: 600px
  padding: 30px
</style>
