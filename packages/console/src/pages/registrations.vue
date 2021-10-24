<script setup lang="ts">
import { toRefs } from "vue"
import { useStore } from "../store/store"
import { Registration, Role, User } from "@frilan/models"
import UserLink from "../components/common/user-link.vue"
import http from "../utils/http"
import DatetimePicker from "../components/common/datetime-picker.vue"

const store = useStore()

let { user, event } = $(toRefs(store.state))

let registrations = $ref(await http.getMany(`/events/${ event.id }/registrations?load=user`, Registration))

async function register() {
  const username = prompt("Enter username:")
  if (!username || !username.length) return

  const users = await http.getMany("/users?load=registrations&username=" + username, User)
  if (!users.length)
    throw "User not found"

  const targetUser = users[0]
  const registration = await http.put(`/events/${ event.id }/registrations/${ targetUser.id }`, {}, Registration)
  registrations.push({ ...registration, user: targetUser })
}

async function update(registration: Registration) {
  await http.put(`/events/${ event.id }/registrations/${ registration.user.id }`, registration)
}

async function unregister(registration: Registration) {
  if (confirm(`Are you sure you want to unregister ${ registration.user.displayName }?`)) {
    await http.delete(`/events/${ event.id }/registrations/${ registration.user.id }`)
    registrations.splice(registrations.indexOf(registration), 1)
  }
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