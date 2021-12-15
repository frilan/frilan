<script setup lang="ts">
import http from "../utils/http"
import { useRoute, useRouter } from "vue-router"
import { useStore } from "../store/store"
import { toRefs, watch } from "vue"
import { Distribution, Tournament } from "@frilan/models"
import RankingEditor from "../components/ranking-editor.vue"
import ScoresEditor from "../components/scores-editor.vue"
import { routeInEvent } from "../utils/route-in-event"
import { NotFoundError } from "../utils/not-found-error"

const router = useRouter()
const route = useRoute()
const store = useStore()

let { event, mainEvent } = $(toRefs(store.state))

const { name } = route.params
const relations = ["teams"].join(",")
const url = `/events/${ event.id }/tournaments?shortName=${ name }&load=${ relations }`
const tournaments = await http.getMany(url, Tournament)
if (!tournaments.length)
  throw new NotFoundError()

let tournament = $ref(tournaments[0])
document.title = `Results for ${ tournament.name } - ${ document.title }`

function sortTeams() {
  tournament.teams.sort((a, b) => a.rank - b.rank)
}

// if there is already a ranking, sort teams
if (tournament.teams[0].rank > 0)
  sortTeams()
else
  tournament.teams.forEach((team, index) => team.rank = index + 1)

let editorType = $ref("ranking")
watch($$(editorType), () => sortTeams())

let points = $ref(tournament.pointsPerPlayer)
let distribution = $ref(tournament.pointsDistribution)

async function save() {
  sortTeams()

  // generate ranks by grouping tied teams together
  const ranks = [[tournament.teams[0].id]]
  tournament.teams.slice(1).forEach((team, index) => {
    if (team.rank === tournament.teams[index].rank)
      ranks[ranks.length - 1].push(team.id)
    else
      ranks.push([team.id])
  })

  await http.put(`/tournaments/${ tournament.id }/results`, { ranks, points, distribution })

  if (event.shortName === mainEvent)
    router.push({ name: "tournament", params: { name: tournament.shortName } })
  else
    router.push(routeInEvent("tournament", event.shortName, { name: tournament.shortName }))
}
</script>

<template lang="pug">
h1 Results for {{ tournament.name }}

.editor-picker
  .ranking
    input(id="ranking" type="radio" name="type" value="ranking" v-model="editorType")
    label(for="ranking") Ranking
  .scores
    input(id="scores" type="radio" name="type" value="scores" v-model="editorType")
    label(for="scores") Scores

ranking-editor(v-if="editorType === 'ranking'" v-model="tournament.teams")
scores-editor(v-else v-model="tournament.teams")

form(@submit.prevent="save")
  .field
    label(for="points") Points per player
    input(id="points" type="number" v-model="points")

  .field
    label(for="distribution") Distribution algorithm
    select(id="distribution" v-model="distribution")
      option(:value="Distribution.Exponential") Exponential

  button(type="submit") Save
  button(@click.prevent="router.back") Cancel
</template>

<style scoped lang="sass">
.editor-picker
  margin-bottom: 10px
  display: flex

  & > *
    padding: 10px

    & > *
      margin: 0
      cursor: pointer

      &:hover
        color: lightblue

    & label
      padding-left: 6px
</style>
