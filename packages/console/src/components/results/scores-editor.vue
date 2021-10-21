<script setup lang="ts">
import { Team } from "@frilan/models"
import { watchEffect } from "vue"

const props = defineProps<{ modelValue: Team[] }>()
let { modelValue: teams } = $(props)

let ascOrder = $ref(teams[0].result < teams[teams.length - 1].result)

const emit = defineEmits<{ (e: "update:modelValue", teams: Team[]): void }>()
watchEffect(() => {
  // update ranks
  if (teams.some(team => team.result > 0))
    teams.forEach(team => team.rank = ascOrder ? team.result : -team.result)
  emit("update:modelValue", teams)
})
</script>

<template lang="pug">
.order-picker
  input(id="order" type="checkbox" v-model="ascOrder")
  label(for="order") Lower is better

.team(v-for="team in teams")
  .name {{ team.name }}
  input(type="number" v-model="team.result")
</template>

<style scoped lang="sass">
.order-picker
  padding: 12px

  & > *
    margin: 0
    cursor: pointer

    &:hover
      color: lightblue

  & label
    padding-left: 6px

.team
  display: grid
  grid-template-columns: auto 100px
  padding: 12px
  max-width: 400px

  & .name
    margin-right: 20px
</style>
