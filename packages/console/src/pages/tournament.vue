<script setup lang="ts">
import { computed, toRefs } from "vue"
import { useRoute } from "vue-router"
import { useStore } from "../store/store"
import http from "../utils/http"
import { Status, Tournament } from "@frilan/models"
import Markdown from "../components/markdown.vue"
import UserLink from "../components/user-link.vue"
import EventLink from "../components/event-link.vue"

const route = useRoute()
const store = useStore()

let { user, event } = $(toRefs(store.state))
const { isOrganizer } = store.getters

const { name } = route.params
const relations = ["teams", "teams.members", "teams.members.user"].join(",")
const url = `/events/${ event.id }/tournaments?shortName=${ name }&load=${ relations }`
const tournaments = await http.getMany(url, Tournament)
if (!tournaments.length)
  throw "Tournament not found"

const tournament = tournaments[0]

document.title = `${ tournament.name } - ${ document.title }`

if (tournament.status === Status.Finished)
  tournament.teams.sort(({ rank: a }, { rank: b }) => a - b)

let fullTeams = $(computed(() => tournament.teams.filter(team =>
  team.members.length >= tournament.teamSizeMin
  && team.members.length <= tournament.teamSizeMax)))

let tournamentStarted = $(computed(() =>
  tournament.status === Status.Started || tournament.status === Status.Finished))

let incompleteTeams = $(computed(() =>
  tournamentStarted ? [] : tournament.teams.filter(team => !fullTeams.includes(team))))

// don't show incomplete teams once the tournament has started
let teamsGroups = $(computed(() =>
  tournamentStarted || !incompleteTeams.length ? [fullTeams] : [incompleteTeams, fullTeams]))
</script>

<template lang="pug">
h1 {{ tournament.name }}
event-link(v-if="isOrganizer" to="edit-tournament" :params="{ name }") Edit

p.info {{ fullTeams.length }}!{" "}
  template(v-if="!tournamentStarted") / {{ tournament.teamCountMax }}
  | !{" "}registered {{ tournament.teamSizeMax > 1 ? "teams" : "players" }}

markdown.rules(:src="tournament.rules")

template(v-for="(teams, index) in teamsGroups")
  h2(v-if="tournament.status === Status.Finished") Results
  h2(v-else-if="teamsGroups.length > 1 && index === 0") Incomplete teams
  h2(v-else-if="tournament.teamSizeMax > 1") Registered teams
  h2(v-else) Registered players
  table.teams
    tr(v-for="team in teams")
      td.rank(v-if="tournament.status === Status.Finished") {{ team.rank }}
      td.team
        template(v-if="tournament.teamSizeMax > 1")
          span.name {{ team.name }}
          ul.members
            li.member(v-for="member in team.members")
              user-link(:user="member.user")
        user-link(v-else :user="team.members[0].user")
      td.result(v-if="tournament.status === Status.Finished") {{ team.result }} pts
</template>

<style scoped lang="sass">
.teams td
  vertical-align: text-top

.team
  .name
    font-weight: bold

  .members
    padding-left: 15px
</style>
