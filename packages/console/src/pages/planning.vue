<script setup lang="ts">
import { useStore } from "../store/store"
import http from "../utils/http"
import { Tournament } from "@frilan/models"

const store = useStore()
const event = store.state.event

const tournaments = await http.getMany(`/events/${ event }/tournaments?load=teams`, Tournament)
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
h1 Tournaments planning

.tournament(v-for="tournament in tournaments")
  h2
    router-link(:to="{ name: 'tournament', params: { id: tournament.id } }") {{ tournament.name }}
  p.date {{ weekday(tournament.date) }}, {{ time(tournament.date) }} — {{ time(endDate(tournament)) }}
  p.players {{ tournament.teams?.length }} / {{ tournament.teamCountMax }}!{" "}
    | registered {{ tournament.teamSizeMax > 1 ? "teams" : "players" }}
  p.status Status: {{ tournament.status }}
</template>

<style scoped lang="sass">

</style>
