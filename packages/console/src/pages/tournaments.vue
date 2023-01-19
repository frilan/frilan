<script setup lang="ts">
import { toRefs, watchEffect } from "vue"
import { Registration, Status, Team, Tournament } from "@frilan/models"
import { useStore } from "@/store/store"
import http from "@/utils/http"
import EventLink from "@/components/common/event-link.vue"
import TournamentBackground from "@/components/common/tournament-background.vue"
import { Subscriber } from "@/utils/subscriber"
import {
  Account, AccountGroup, AlertCircleCheck, CalendarPlus, CheckCircle, ClockOutline, EyeOff, FlagCheckered, Play,
} from "mdue"

const store = useStore()
let { event, user } = $(toRefs(store.state))
let isOrganizer = $computed(() => store.getters.isOrganizer)
let isRegistered = $computed(() => store.getters.isRegistered)

let tournaments = $ref(await http.getMany(`/events/${ event.id }/tournaments`, Tournament))
watchEffect(() => tournaments.sort((a, b) => a.date.getTime() - b.date.getTime()))

// get all teams of current user, if registered for this event
let registration: Registration | null = $ref(null)
if (isRegistered)
  registration
    = await http.getOne(`/events/${ event.id }/registrations/${ user.id }?load=teams,teams.members`, Registration)

function weekday(date: Date) {
  // new day starts at 6:00
  return new Date(date.getTime() - 6 * 3600000).toLocaleString("en-GB", { weekday: "long" })
}

function getTime(date: Date) {
  return date.toLocaleString("en-GB", { hour: "numeric", minute: "2-digit" })
}

function endDate(tournament: Tournament) {
  return new Date(tournament.date.getTime() + tournament.duration * 60000)
}

function isNewDay(index: number) {
  return index === 0 || weekday(tournaments[index].date) !== weekday(tournaments[index - 1].date)
}

// add a 'myTeam' property to tournaments, with the team of the current user, if any
let tournamentsWithTeams: (Tournament & { myTeam?: Team })[] = $computed(() => tournaments.map(tournament => ({
  ...tournament,
  myTeam: registration?.teams.find(team => team.tournamentId === tournament.id),
})))

// handle live updates
new Subscriber(Tournament, { eventId: event.id })
  .onCreate(newTournament => tournaments.push(newTournament))
  .onUpdate(async updatedTournament => {
    const index = tournaments.findIndex(tournament => tournament.id === updatedTournament.id)
    // if tournament was displayed
    if (index >= 0)
      // if tournament becomes hidden
      if (updatedTournament.status === Status.Hidden && !isOrganizer) tournaments.splice(index, 1)
      else tournaments[index] = updatedTournament
    // if tournament was hidden
    else tournaments.push(updatedTournament)
  })
  .onDelete(({ id }) => {
    const index = tournaments.findIndex(tournament => tournament.id === id)
    if (index >= 0) tournaments.splice(index, 1)
  })

// if registered for the event, handle updates to the teams of the user
if (registration) {
  const myTeams = registration.teams
  // eslint-disable-next-line @typescript-eslint/naming-convention
  new Subscriber(Team, { "members.userId": user.id, "members.eventId": event.id })
    .onCreate(newTeam => myTeams.push(newTeam))
    .onUpdate(updatedTeam => {
      const index = myTeams.findIndex(team => team.id === updatedTeam.id)
      if (index >= 0)
        // if already in the team
        if (updatedTeam.members.some(m => m.userId === user.id)) myTeams[index] = updatedTeam
        // if not in the team anymore
        else myTeams.splice(index, 1)
      // if joined a team
      else myTeams.push(updatedTeam)
    })
    .onDelete(({ id }) => {
      const index = myTeams.findIndex(team => team.id === id)
      myTeams.splice(index, 1)
    })
}
</script>

<template lang="pug">
event-link.new.button(v-if="isOrganizer" to="new-tournament")
  calendar-plus
  span New tournament

.tournaments(v-if="tournaments.length")
  template(v-for="(tournament, index) in tournamentsWithTeams")
    .day(v-if="isNewDay(index)") {{ weekday(tournament.date) }}
    event-link.tournament(
      to="tournament" :params="{ name: tournament.shortName }"
      :class="{ [tournament.status]: true, hasBg: tournament.background }"
    )
      tournament-background(:tournament="tournament")
      .running(v-if="tournament.status === Status.Started")
      header
        h2 {{ tournament.name }}
        time.icon-text
          clock-outline
          span {{ getTime(tournament.date) }} — {{ getTime(endDate(tournament)) }}
      .info
        .team-count(:title="'Registered ' + (tournament.teamSizeMax > 1 ? 'teams' : 'players')")
          account-group(v-if="tournament.teamSizeMax > 1")
          account(v-else)
          span {{ tournament.teamCount }}
            template(v-if="tournament.status === Status.Ready") !{" "}/ {{ tournament.teamCountMax }}
        .status(v-if="tournament.status === Status.Hidden")
          eye-off
          span.text Hidden
        template(v-if="tournament.status === Status.Ready && tournament.myTeam")
          .status.incomplete(
            v-if="tournament.myTeam.members.length < tournament.teamSizeMin"
            title="Your team is incomplete"
          )
            .icon
              alert-circle-check
              span {{ tournament.myTeam.members.length }} / {{ tournament.teamSizeMin }}
            span.text Incomplete
          .status(v-else)
            check-circle
            span.text Registered
        .status(v-if="tournament.status === Status.Started")
          play
          span.text Started
        .status(v-if="tournament.status === Status.Finished")
          flag-checkered
          span.text Finished

p.empty(v-else) There are no tournaments in this event yet.
</template>

<style scoped lang="sass">
@import "@/assets/styles/main.sass"
@import "@/assets/styles/tournament.sass"

.new
  z-index: 10
  position: absolute
  right: 40px
  top: 18px

.tournaments
  width: fit-content
  padding: 10px 30px 30px
  display: grid
  grid-template-columns: repeat(6, 1fr)

  @media (max-width: 1700px)
    grid-template-columns: repeat(5, 1fr)
  @media (max-width: 1400px)
    grid-template-columns: repeat(4, 1fr)
  @media (max-width: 1100px)
    grid-template-columns: repeat(3, 1fr)
  @media (max-width: 800px)
    grid-template-columns: repeat(2, 1fr)
  @media (max-width: 500px)
    grid-template-columns: repeat(1, 1fr)

.day
  @extend .skewed
  margin: 15px
  padding-left: 6px
  grid-column: 1 / -1

  &:not(:first-child)
    padding-top: 24px
    border-top: 1px solid rgba(255, 255, 255, 0.15)

.tournament
  background: linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.15))
  min-width: 200px
  border-radius: 5px
  margin: 10px
  padding: 10px
  height: 140px
  color: inherit
  display: flex
  flex-direction: column
  justify-content: space-between
  position: relative
  z-index: 1
  transition: all 0.15s
  overflow: hidden

  .bg
    opacity: 25%
    transition: all 0.15s

  h2
    margin-top: 0
    margin-bottom: 10px

  time
    color: lightblue

  .info
    display: flex
    justify-content: space-between
    align-items: baseline

  .status
    transform: translate(72%, 0)
    transition: transform 0.2s

    svg
      font-size: 1.8em
      margin-right: 8px

    .text
      transition: opacity 0.3s
      opacity: 0

  &.hidden
    opacity: 45%

  &.ready
    .status
      color: mediumspringgreen

    .incomplete
      transform: translate(55%, 0)
      color: orange

      .icon
        display: flex
        align-items: center
        margin-right: 8px

        span
          font-size: 0.9em

  &.started
    background: $running-bg

    .status
      color: $started

  &.finished
    filter: grayscale(100%)
    opacity: 80%

  &:hover
    color: white
    transform: scale(1.02)
    text-decoration: none
    filter: none

    &.hasBg
      text-shadow: black 0 0 12px, black 0 0 14px

    .bg
      opacity: 50%

    .status
      transform: translate(0, 0)

      .text
        opacity: 100%

.team-count, .status
  @extend .icon-text

.empty
  margin: 100px
  text-align: center
</style>
