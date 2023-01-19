<script setup lang="ts">
import type { Team } from "@frilan/models"
import { watchEffect } from "vue"
// noinspection ES6UnusedImports
import draggable from "vuedraggable"
import Rank from "./common/rank.vue"
import { ChevronDownBox, EqualBox } from "mdue"
import ProfilePicture from "./common/profile-picture.vue"

const props = defineProps<{
  modelValue: Team[]
  singlePlayer: boolean
}>()

const emit = defineEmits<{ (e: "update:modelValue", teams: Team[]): void }>()

let teams = $computed({
  get: () => props.modelValue,
  set: value => emit("update:modelValue", value),
})

let tiedTeams: boolean[] = $ref(teams.slice(1).map((team, index) => team.rank === teams[index].rank))

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
      rank(v-if="!tiedTeams[rank - 2]" :rank="rank")

  .ties
    span
      input.hidden(type="checkbox")
    label(
      v-for="(tied, i) in tiedTeams" :class="{ tied }"
      :title="(tied ? 'Untie from' : 'Tie with') + ' team above'"
    )
      input(type="checkbox" v-model="tiedTeams[i]")
      equal-box.tied(v-if="tied")
      chevron-down-box.lower(v-else)

  draggable.teams(v-model="teams" item-key="id" animation=250)
    template(#item="{ element: team, index }")
      .team(:class="{ tied: tiedTeams[index - 1] }")
        profile-picture.pp(v-if="singlePlayer" :user="team.members[0].user")
        span {{ singlePlayer ? team.members[0].user.displayName : team.name }}
</template>

<style scoped lang="sass">
@import "@/assets/styles/main.sass"

.ranking
  display: flex
  justify-content: center

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

input[type=checkbox]
  cursor: pointer

  &.hidden
    visibility: hidden

label
  cursor: pointer

  input
    display: none

  .tied, .lower
    font-size: 1.3em
    opacity: 75%

  .tied
    color: mediumspringgreen

  &:hover
    .tied, .lower
      transform: scale(1.1)
      opacity: 100%

  &:active
    .tied, .lower
      transform: scale(0.95)

.team
  cursor: grab

  .pp
    margin-right: 10px

  &:hover:not(:active)
    background-color: rgba(255, 255, 255, 0.05)

  &[draggable=true]
    color: mediumspringgreen
    cursor: grabbing
    background-color: rgba(255, 255, 255, 0.2)
</style>
