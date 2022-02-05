<script setup lang="ts">
import { toRefs } from "vue"
import { useRoute } from "vue-router"
import { useStore } from "../store/store"
import { Registration, Status, Team, Tournament, User } from "@frilan/models"
import http from "../utils/http"
import axios from "axios"
import TournamentLink from "../components/common/tournament-link.vue"
import { NotFoundError } from "../utils/not-found-error"
import { Subscriber } from "../utils/subscriber"

const route = useRoute()
const store = useStore()

const { name } = route.params
let { event } = $(toRefs(store.state))

const user = (await http.getMany(`/users?username=${ name }`, User))[0]
if (!user)
  throw new NotFoundError()

document.title = `${ user.displayName } results - Console`

const relations = ["teams", "teams.members", "teams.tournament"].join(",")
let registration = $ref<Registration | null>(null)

try {
  registration
    = await http.getOne(`/events/${ event.id }/registrations/${ user.id }?load=${ relations }`, Registration)
} catch (err) {
  if (!axios.isAxiosError(err) || err.response?.status !== 404)
    throw err
}

// hide incomplete teams if the tournament is finished
let visibleTeams = $computed(() => registration
  ? registration.teams.filter(team => team.tournament.status !== Status.Finished || team.rank > 0)
  : [])

let finishedTeams = $computed(() => visibleTeams
  .filter(team => team.tournament.status === Status.Finished)
  .sort((a, b) => b.result - a.result))

let registeredTeams = $computed(() => visibleTeams
  .filter(team => !finishedTeams.includes(team) && team.tournament.status !== Status.Hidden)
  .sort((a, b) => new Date(a.tournament.date).getTime() - new Date(b.tournament.date).getTime()))

function isTeamRegistered(team: Team) {
  return team.members.length >= team.tournament.teamSizeMin
    && team.members.length <= team.tournament.teamSizeMax
}

// handle live updates
new Subscriber(Registration, { eventId: event.id, userId: user.id })
  .onCreate(newRegistration => registration = { ...newRegistration, teams: [] })
  .onUpdate(updatedRegistration => Object.assign(registration, updatedRegistration))
  .onDelete(() => registration = null)

new Subscriber(Team, { "members.userId": user.id, "members.eventId": event.id })
  .onCreate(async newTeam => registration?.teams.push({
    ...newTeam,
    tournament: await http.getOne(`/tournaments/${ newTeam.tournamentId }`, Tournament),
  }))
  .onUpdate(async updatedTeam => {
    if (!registration) return
    const index = registration.teams.findIndex(team => team.id === updatedTeam.id)
    if (index >= 0)
      // if already in the team
      if (updatedTeam.members.some(m => m.userId === user.id)) Object.assign(registration.teams[index], updatedTeam)
      // if not in the team anymore
      else registration.teams.splice(index, 1)
    // if joined a team
    else registration.teams.push({
      ...updatedTeam,
      tournament: await http.getOne(`/tournaments/${ updatedTeam.tournamentId }`, Tournament),
    })
  })
  .onDelete(({ id }) => {
    if (registration) {
      const index = registration.teams.findIndex(team => team.id === id)
      if (index >= 0) registration.teams.splice(index, 1)
    }
  })

new Subscriber(Tournament, { eventId: event.id })
  .onUpdate(tournament => {
    if (!registration) return
    const index = registration.teams.findIndex(t => t.tournamentId === tournament.id)
    if (index >= 0)
      registration.teams[index].tournament = tournament
  })
  .onDelete(({ id }) => {
    if (!registration) return
    const index = registration.teams.findIndex(t => t.tournamentId === id)
    if (index >= 0)
      registration.teams.splice(index, 1)
  })
</script>

<template lang="pug">
h1 {{ user.displayName }}
router-link(:to="{ name: 'user', params: { name } }") View profile

template(v-if="registration")
  h2 Score: {{ registration.score }}
  table
    tr
      th Tournament
      th Team
      th Rank
      th Points
    tr(v-for="team in finishedTeams")
      td
        tournament-link(:tournament="team.tournament")
      td {{ team.tournament.teamSizeMax > 1 ? team.name : "" }}
      td {{ team.rank }} / {{ team.tournament.teamCount }}
      td {{ team.result }} pts

  template(v-if="registeredTeams.length")
    h2 Upcoming tournaments
    table
      tr
        th Tournament
        th Team
        th Status
      tr(v-for="team in registeredTeams")
        td
          tournament-link(:tournament="team.tournament")
        td {{ team.tournament.teamSizeMax > 1 ? team.name : "" }}
        td(v-if="isTeamRegistered(team)") Registered
        td(v-else) &#9888; {{ team.members.length }} / {{ team.tournament.teamSizeMin }}
          span.max(v-if="team.tournament.teamSizeMax > team.tournament.teamSizeMin")
            | !{" "}({{ team.tournament.teamSizeMax }})

p(v-else) This user isn't registered for the event.
</template>

<style scoped lang="sass">
table
  text-align: center
</style>
