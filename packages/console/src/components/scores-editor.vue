<script setup lang="ts">
import { Team } from "@frilan/models"
import { watchEffect } from "vue"
import Checkbox from "./common/checkbox.vue"

const props = defineProps<{ modelValue: Team[] }>()
const emit = defineEmits<{ (e: "update:modelValue", teams: Team[]): void }>()

let teams = $computed({
  get: () => props.modelValue,
  set: value => emit("update:modelValue", value),
})

let ascOrder = $ref(teams[0].result < teams[teams.length - 1].result)

watchEffect(() => {
  // update ranks
  if (teams.some(team => team.result > 0))
    teams.forEach(team => team.rank = ascOrder ? team.result : -team.result)
  emit("update:modelValue", teams)
})
</script>

<template lang="pug">
.order-picker
  checkbox(v-model="ascOrder") Lower is better

.teams
  .team(v-for="team in teams")
    .name {{ team.name }}
    input(type="number" v-model="team.result")
</template>

<style scoped lang="sass">
@import "../assets/styles/form"

.order-picker
  text-align: center
  margin-bottom: 20px

.teams
  width: fit-content
  margin: auto

.team
  display: grid
  grid-template-columns: auto 90px
  padding: 4px
  align-items: baseline

  & .name
    margin-right: 40px

  input
    margin: 0
    padding: 8px
</style>
