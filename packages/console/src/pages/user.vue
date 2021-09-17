<script setup lang="ts">
import { useRoute } from "vue-router"
import { useStore } from "../store/store"
import http from "../utils/http"
import { Registration, Status, Team, User } from "@frilan/models"
import TournamentLink from "../components/tournament-link.vue"
import { computed } from "vue"
import axios from "axios"

const route = useRoute()
const store = useStore()

const { name } = route.params

const user = (await http.getMany(`/users?username=${ name }`, User))[0]
if (!user)
  throw "User not found"

const { event } = store.state
const relations = ["teams", "teams.members", "teams.tournament"].join(",")
let registered = $ref(true)
let registration = $ref(new Registration())

try {
  registration
    = await http.getOne(`/events/${ event }/registrations/${ user.id }?load=${ relations }`, Registration)
} catch (err) {
  if (axios.isAxiosError(err) && err.response?.status === 404)
    registered = false
  else
    throw err
}

// hide incomplete teams if the tournament is finished
let visibleTeams = $(computed(() => registered
  ? registration.teams?.filter(team => team.tournament?.status !== Status.Finished || team.rank > 0)
  : []))

let finishedTeams = $(computed(() => visibleTeams
  .filter(team => team.tournament?.status === Status.Finished)
  .sort((a, b) => b.result - a.result)))

let registeredTeams = $(computed(() => visibleTeams.filter(team => !finishedTeams.includes(team))))

function isTeamRegistered(team: Team) {
  return team.members && team.tournament
    && team.members.length >= team.tournament.teamSizeMin
    && team.members.length <= team.tournament.teamSizeMax
}

</script>

<template lang="pug">
h1 {{ user.displayName }}

template(v-if="registered")
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
      td {{ team.tournament?.teamSizeMax > 1 ? team.name : "" }}
      td {{ team.rank }} / {{ team.tournament?.teamCount }}
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
        td {{ team.tournament?.teamSizeMax > 1 ? team.name : "" }}
        td(v-if="isTeamRegistered(team)") Registered
        td(v-else) &#9888; {{ team.members?.length }} / {{ team.tournament?.teamSizeMin }}
          span.max(v-if="team.tournament?.teamSizeMax > team.tournament?.teamSizeMin")
            | !{" "}({{ team.tournament?.teamSizeMax }})

p(v-else) This user isn't registered to the event.
</template>

<style scoped lang="sass">
table
  text-align: center
</style>
