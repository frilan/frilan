<script setup lang="ts">
import { toRefs, watchEffect } from "vue"
import { useStore } from "../store/store"
import { Registration, Role, User } from "@frilan/models"
import UserLink from "../components/common/user-link.vue"
import http from "../utils/http"
import DatetimePicker from "../components/common/datetime-picker.vue"
import { realTimeRegistrations } from "../utils/real-time"

const store = useStore()
let { user, event } = $(toRefs(store.state))

let registrations = $(await realTimeRegistrations(event.id))
watchEffect(() => registrations.sort((a, b) => a.user.displayName.localeCompare(b.user.displayName)))

async function register() {
  const username = prompt("Enter username:")
  if (!username || !username.length) return

  const users = await http.getMany("/users?load=registrations&username=" + username, User)
  if (!users.length)
    throw "User not found"
}

async function update(registration: Registration) {
  await http.put(`/events/${ event.id }/registrations/${ registration.user.id }`, registration)
}

async function unregister(registration: Registration) {
  if (confirm(`Are you sure you want to unregister ${ registration.user.displayName }?`))
    await http.delete(`/events/${ event.id }/registrations/${ registration.user.id }`)
}
</script>

<template lang="pug">
h1 Registrations

button(@click="register") New registration

table
  tr
    th User
    th Role
    th Arrival
    th Departure
    th Actions
  tr(v-for="registration in registrations")
    td
      user-link(:user="registration.user")
    td
      select(v-model="registration.role" :disabled="!user.admin" @change="update(registration)")
        option(:value="Role.Player") Player
        option(:value="Role.Organizer") Organizer
    td
      datetime-picker(v-model="registration.arrival" @change="update(registration)"
        :min="event.start" :max="event.end")
    td
      datetime-picker(v-model="registration.departure" @change="update(registration)"
        :min="event.start" :max="event.end")
    td
      button(@click="unregister(registration)") Unregister
</template>

<style scoped lang="sass">
select option[value="organizer"]
  color: red
</style>
