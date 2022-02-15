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
import { Close, ContentSave, SortAscending, SortNumericAscending } from "mdue"

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
document.title = `Results for ${ tournament.name } - Console`

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
header
  .title
    h1 {{ tournament.name }}
    .subtitle Results

  .editor-picker
    label.button(:class="{ checked: editorType === 'ranking' }")
      input(type="radio" name="type" value="ranking" v-model="editorType")
      sort-ascending
      span Ranking
    label.button(:class="{ checked: editorType === 'scores' }")
      input(type="radio" name="type" value="scores" v-model="editorType")
      sort-numeric-ascending
      span Scores

ranking-editor(v-if="editorType === 'ranking'" v-model="tournament.teams")
scores-editor(v-else v-model="tournament.teams")

form(@submit.prevent="save")
  fieldset
    label Points per player
      input(type="number" v-model="points")

    label Distribution algorithm
      select(v-model="distribution")
        option(:value="Distribution.Exponential") Exponential

  .buttons-right
    button.button(type="button" @click.prevent="router.back")
      close
      span Cancel
    button.button(type="submit")
      content-save
      span Save
</template>

<style scoped lang="sass">
@import "../assets/styles/main"
@import "../assets/styles/form"

h1
  font-size: 1.8em
  margin-bottom: 10px
  margin-top: 0

.subtitle
  @extend .skewed

header
  display: flex
  align-items: center
  justify-content: space-between
  min-width: 500px
  margin: 30px 50px

  label
    display: inline-flex
    flex-direction: row
    align-items: center
    margin: 0

    input
      display: none

    &.checked svg
      color: mediumspringgreen

    &:not(.checked)
      opacity: 60%

    &:first-of-type
      border-bottom-right-radius: 0
      border-top-right-radius: 0
      margin-right: 1px

      &.button:not([disabled]):active
        transform: translate(2px, 0) scale(0.96)

    &:last-of-type
      border-bottom-left-radius: 0
      border-top-left-radius: 0
      margin-left: 0
      border-right: none

      &.button:not([disabled]):active
        transform: translate(-2px, 0) scale(0.96)

.editor-picker
  margin-left: 20px

form
  padding: 30px
</style>
