<script setup lang="ts">
import { useStore } from "../store/store"
import http from "../utils/http"
import { Tournament } from "@frilan/models"
import TournamentLink from "../components/common/tournament-link.vue"
import EventLink from "../components/common/event-link.vue"
import { computed, toRefs } from "vue"

const store = useStore()
let { event } = $(toRefs(store.state))
let isOrganizer = $(computed(() => store.getters.isOrganizer))

const tournaments = await http.getMany(`/events/${ event.id }/tournaments?load=teams`, Tournament)
tournaments.sort((a, b) => a.date.getTime() - b.date.getTime())

function weekday(date: Date) {
  return date.toLocaleString("en-GB", { weekday: "long" })
}

function time(date: Date) {
  return date.toLocaleString("en-GB", { hour: "numeric", minute: "2-digit" })
}

function endDate(tournament: Tournament) {
  return new Date(tournament.date.getTime() + tournament.duration * 60000)
}
</script>

<template lang="pug">
h1 Tournaments
event-link(v-if="isOrganizer" to="new-tournament") New tournament

template(v-if="tournaments.length")
  .tournament(v-for="tournament in tournaments")
    h2
      tournament-link(:tournament="tournament")
    p.date {{ weekday(tournament.date) }}, {{ time(tournament.date) }} — {{ time(endDate(tournament)) }}
    p.players {{ tournament.teamCount }} / {{ tournament.teamCountMax }}!{" "}
      | registered {{ tournament.teamSizeMax > 1 ? "teams" : "players" }}
    p.status Status: {{ tournament.status }}

p(v-else) There are no tournaments in this event yet.
</template>

<style scoped lang="sass">

</style>
