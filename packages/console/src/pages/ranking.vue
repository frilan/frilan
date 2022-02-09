<script setup lang="ts">
import { toRefs, watchEffect } from "vue"
import { useStore } from "../store/store"
import UserLink from "../components/common/user-link.vue"
import { realTimeRegistrations } from "../utils/real-time"
import { Role } from "@frilan/models"
import Rank from "../components/common/rank.vue"
import Checkbox from "../components/common/checkbox.vue"

const store = useStore()
let { event } = $(toRefs(store.state))

let registrations = $(await realTimeRegistrations(event.id))
watchEffect(() => registrations.sort((a, b) => b.score - a.score))

let includeOrganizers = $ref(false)

let filtered = $computed(() => registrations
  .filter(({ score, role }) => score > 0 && (includeOrganizers || role === Role.Player)))

function getRank(index: number): number {
  // handle tied scores
  if (index > 0 && filtered[index].score === filtered[index - 1].score)
    return getRank(index - 1)
  else
    return index + 1
}
</script>

<template lang="pug">
.container
  template(v-if="filtered.length")
    checkbox(v-model="includeOrganizers") Include organizers

    table
      tr(v-for="(registration, index) in filtered" :class="{ ['rank-' + getRank(index)]: true }")
        td.rank
          rank(:rank="getRank(index)")
        td.player
          user-link(:registration="registration")
        td.score {{ registration.score }} pts

  p(v-else) No player has scored any point yet.
</template>

<style scoped lang="sass">
.container
  min-width: 800px
  display: flex
  flex-direction: column
  align-items: center
  padding-bottom: 50px

.button
  margin: 16px

.rank-1
  font-size: 2em
  height: 60px

  .player
    padding-left: 8px

.rank-2
  font-size: 1.66em
  height: 50px

  .player
    padding-left: 12px

.rank-3
  font-size: 1.33em
  height: 40px

  .player
    padding-left: 15px

.rank, .score
  text-align: center

.rank
  margin: auto

.player
  min-width: 240px
  padding: 8px 8px 8px 18px
</style>
