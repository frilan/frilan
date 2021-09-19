<script setup lang="ts">
import { computed } from "vue"
import { useStore } from "../store/store"
import http from "../utils/http"
import { Registration } from "@frilan/models"
import UserLink from "../components/user-link.vue"

const store = useStore()

const { event } = store.state
const registrations = await http.getMany(`/events/${ event }/registrations?load=user`, Registration)
registrations.sort((a, b) => b.score - a.score)

let filtered = $(computed(() => registrations.filter(({ score }) => score > 0)))

function getRank(index: number): number {
  // handle tied scores
  if (index > 0 && filtered[index].score === filtered[index - 1].score)
    return getRank(index - 1)
  else
    return index + 1
}
</script>

<template lang="pug">
h1 Ranking

table
  tr(v-for="(registration, index) in filtered")
    td {{ getRank(index) }}
    td
      user-link(:user="registration.user")
    td {{ registration.score }} pts
</template>

<style scoped lang="sass">

</style>
