<script setup lang="ts">
import { Team } from "@frilan/models"
import { watchEffect } from "vue"
// noinspection ES6UnusedImports
import draggable from "vuedraggable"

const props = defineProps<{ modelValue: Team[] }>()
let { modelValue: teams } = $(props)

let tiedTeams: boolean[] = $ref(teams.slice(1).map((team, index) => team.rank === teams[index].rank))

const emit = defineEmits<{ (e: "update:modelValue", teams: Team[]): void }>()
watchEffect(() => {
  // update ranks
  teams.forEach((team, index) => {
    if (index === 0) team.rank = 1
    else team.rank = tiedTeams[index - 1] ? teams[index - 1].rank : index + 1
  })
  emit("update:modelValue", teams)
})
</script>

<template lang="pug">
.ranking
  .ranks
    .rank(v-for="rank in teams.length" :class="{ tied: tiedTeams[rank - 2] }")
      template(v-if="!tiedTeams[rank - 2]") {{ rank }}

  .ties
    span
      input.hidden(type="checkbox")
    span(v-for="(tied, i) in tiedTeams" :class="{ tied }")
      input(type="checkbox" v-model="tiedTeams[i]" title="Tied with team above")

  draggable.teams(v-model="teams" item-key="id" animation=250)
    template(#item="{ element: team, index }")
      span.team(:class="{ tied: tiedTeams[index - 1] }") {{ team.name }}
</template>

<style scoped lang="sass">
.ranking
  display: flex

.ranks, .teams, .ties
  display: flex
  flex-direction: column

  & > *
    display: flex
    padding: 10px
    height: 24px
    align-items: center

    &:not(:first-child)
      border-top: 1px rgba(255, 255, 255, 0.2) solid

    &.tied
      border-top: 1px transparent solid

.rank
  font-weight: bold
  font-size: 1.1em

input[type=checkbox]
  cursor: pointer

  &.hidden
    visibility: hidden

.team
  cursor: grab

  &:hover:not(:active)
    background-color: rgba(255, 255, 255, 0.1)

  &[draggable=true]
    color: orange
    cursor: grabbing
    background-color: rgba(255, 255, 255, 0.2)
</style>
