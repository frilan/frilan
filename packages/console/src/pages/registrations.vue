<script setup lang="ts">
import { toRefs, watchEffect } from "vue"
import { useStore } from "../store/store"
import { Registration, Role, User } from "@frilan/models"
import UserLink from "../components/common/user-link.vue"
import http from "../utils/http"
import DatetimePicker from "../components/common/datetime-picker.vue"
import { realTimeRegistrations } from "../utils/real-time"
import { AccountPlus, AccountRemove } from "mdue"

const store = useStore()
let { user, event } = $(toRefs(store.state))

let registrations = $(await realTimeRegistrations(event.id))
watchEffect(() => registrations.sort((a, b) => a.user.displayName.localeCompare(b.user.displayName)))

let filter = $ref("")
let normalizedFilter = $computed(() => normalize(filter))

let filtered = $computed(() => !filter ? registrations
  : registrations.filter(r =>
    normalize(r.user.displayName).includes(normalizedFilter)
    || normalize(r.user.username).includes(normalizedFilter)))

async function register() {
  const username = prompt("Enter username:")
  if (!username || !username.length) return

  const users = await http.getMany("/users?load=registrations&username=" + username, User)
  if (!users.length)
    throw "User not found"

  const targetUser = users[0]
  const registration = await http.put(`/events/${ event.id }/registrations/${ targetUser.id }`, {}, Registration)

  // if registering current user, update global state
  if (targetUser.id === user.id)
    user.registrations.push(registration)
}

async function update(registration: Registration) {
  await http.put(`/events/${ event.id }/registrations/${ registration.user.id }`, registration)
}

async function unregister(registration: Registration) {
  if (confirm(`Are you sure you want to unregister ${ registration.user.displayName }?`))
    await http.delete(`/events/${ event.id }/registrations/${ registration.user.id }`)

  // if unregistering current user, update global state
  if (registration.userId === user.id) {
    const index = user.registrations.findIndex(r => r.eventId === registration.eventId)
    user.registrations.splice(index, 1)
  }
}

/**
 * Returns the input string in lower case and without accents.
 * @param str The input string
 */
function normalize(str: string) {
  return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
}
</script>

<template lang="pug">
header
  h1 {{ registrations.length }} participants
  input.filter(v-if="registrations.length" autofocus v-model="filter" placeholder="Search...")
  button.button(@click="register")
    account-plus
    span New registration

table(v-if="filtered.length")
  tr
    th User
    th Role
    th Arrival
    th Departure
    th Actions
  tr(v-for="registration in filtered")
    td
      user-link(:registration="registration")
    td
      select.small(
        v-model="registration.role" @change="update(registration)"
        :disabled="!user.admin" :title="user.admin ? undefined : 'Only administrators can change roles'"
      )
        option(:value="Role.Player") Player
        option(:value="Role.Organizer") Organizer
    td
      datetime-picker.small(v-model="registration.arrival" @change="update(registration)"
        :min="event.start" :max="event.end")
    td
      datetime-picker.small(v-model="registration.departure" @change="update(registration)"
        :min="event.start" :max="event.end")
    td
      button.button(@click="unregister(registration)")
        account-remove
        span Unregister

p.no-match(v-else-if="filter && registrations.length") No matching user found.
p.no-match(v-else) No user is registered for this event yet.
</template>

<style scoped lang="sass">
@import "../assets/styles/main"
@import "../assets/styles/form"

header
  display: flex
  align-items: center
  justify-content: space-between
  margin: 10px 50px
  min-width: 700px

h1
  @extend .skewed

.filter
  margin-top: 0
  margin-right: 10px

table
  margin: 30px

  input, select
    padding: 8px 6px
    margin: 2px

th
  padding-bottom: 8px
  color: rgba(220, 230, 255, 0.8)

td
  vertical-align: center

.no-match
  text-align: center
  margin: 50px
</style>
