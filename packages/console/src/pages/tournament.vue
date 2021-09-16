<script setup lang="ts">
import Markdown from "../components/markdown.vue"
import { useRoute } from "vue-router"
import http from "../utils/http"
import { Status, Tournament } from "@frilan/models"
import { computed } from "vue"

const route = useRoute()

const { id } = route.params
const relations = ["teams", "teams.members", "teams.members.user"].join(",")
const tournament = await http.getOne(`/tournaments/${ id }?load=${ relations }`, Tournament)

if (tournament.status === Status.Finished)
  tournament.teams?.sort(({ rank: a }, { rank: b }) => a - b)

let fullTeams = $(computed(() => tournament.teams
  ?.filter(t => t.members
    && t.members.length >= tournament.teamSizeMin
    && t.members.length <= tournament.teamSizeMax)))

let tournamentStarted = $(computed(() =>
  tournament.status === Status.Started || tournament.status === Status.Finished))

let incompleteTeams = $(computed(() =>
  tournamentStarted ? [] : tournament.teams?.filter(t => !fullTeams.includes(t))))

// don't show incomplete teams once the tournament has started
let teamsGroups = $(computed(() =>
  tournamentStarted || !incompleteTeams.length ? [fullTeams] : [incompleteTeams, fullTeams]))
</script>

<template lang="pug">
h1 {{ tournament.name }}

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
            li.member(v-for="member in team.members") {{ member.user?.displayName }}
        template(v-else) {{ team.members?.[0].user?.displayName }}
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
