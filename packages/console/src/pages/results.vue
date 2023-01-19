<script setup lang="ts">
import { toRefs } from "vue"
import { useRoute } from "vue-router"
import { Registration, Role, Status, Team, Tournament, User } from "@frilan/models"
import axios from "axios"
import { useStore } from "@/store/store"
import http from "@/utils/http"
import TournamentLink from "@/components/common/tournament-link.vue"
import ProfilePicture from "@/components/common/profile-picture.vue"
import OrganizerTag from "@/components/tags/organizer-tag.vue"
import { NotFoundError } from "@/utils/not-found-error"
import { Subscriber } from "@/utils/subscriber"
import { Account, AlertCircleCheck, CheckCircle } from "mdue"

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
  .onUpdate(updatedRegistration => {
    if (registration) Object.assign(registration, updatedRegistration)
  })
  .onDelete(() => registration = null)

// eslint-disable-next-line @typescript-eslint/naming-convention
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
header
  .user
    h1
      profile-picture.pp(:user="user" :size="1.6")
      span {{ user.displayName }}
    organizer-tag(v-if="registration?.role === Role.Organizer")
  router-link.button(:to="{ name: 'user', params: { name } }")
    account
    span View profile

template(v-if="registration")
  .score Score
    span.value(:class="{ zero: !registration.score }") {{ registration.score }}
  table(v-if="finishedTeams.length")
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

  .spacer(v-else)

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
        td.registered.icon-text(v-if="isTeamRegistered(team)")
          check-circle
          span Registered
        td.incomplete.icon-text(v-else)
          alert-circle-check
          span {{ team.members.length }} / {{ team.tournament.teamSizeMin }}

p.not-registered(v-else) This user isn't registered for the event.
</template>

<style scoped lang="sass">
@import "@/assets/styles/main.sass"

header
  display: flex
  justify-content: space-between
  align-items: center
  margin: 10px 80px
  min-width: 400px

  .user
    display: flex
    align-items: center

    h1
      margin-right: 20px

  .button
    margin-left: 20px

h1
  display: flex
  align-items: center

.pp
  margin-right: 12px

.score
  font-size: 1.8em
  text-align: center

  .value
    font-weight: bold
    display: inline-block
    padding: 8px
    margin: 12px
    min-width: 50px
    border-radius: 5px
    color: mediumspringgreen
    background: rgba(0, 0, 0, 0.2)

    &.zero
      color: darkgrey

table
  min-width: 600px
  text-align: center
  border-collapse: collapse
  margin: 30px 80px
  outline: 2px solid rgba(0, 0, 0, 0.15)
  border-radius: 5px
  overflow: hidden

tr
  background-size: cover
  background-position: center

th
  color: $light-glass
  background: rgba(0, 0, 0, 0.15)

td
  background: rgba(0, 0, 0, 0.05)

th, td
  padding: 12px
  justify-content: center

  &.registered
    color: mediumspringgreen

  &.incomplete
    justify-content: center
    color: orange

h2
  @extend .skewed
  text-align: center
  border-top: 1px solid $dark-glass
  padding-top: 30px
  margin: 0 60px

.not-registered
  text-align: center
  margin: 30px

.spacer
  margin-top: 30px
</style>
