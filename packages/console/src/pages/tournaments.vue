<script setup lang="ts">
import { useStore } from "../store/store"
import http from "../utils/http"
import { Registration, Status, Team, Tournament } from "@frilan/models"
import EventLink from "../components/common/event-link.vue"
import { computed, toRefs } from "vue"
// noinspection ES6UnusedImports
import {
  Account, AccountGroup, AlertCircleCheck, CalendarPlus, CheckCircle, ClockOutline, EyeOff, FlagCheckered, Play,
} from "mdue"

const store = useStore()
let { event, user } = $(toRefs(store.state))
let isOrganizer = $(computed(() => store.getters.isOrganizer))
let isRegistered = $(computed(() => store.getters.isRegistered))

const tournaments = await http.getMany(`/events/${ event.id }/tournaments`, Tournament)
tournaments.sort((a, b) => a.date.getTime() - b.date.getTime())

// get all teams of current user, if registered to event
let registration: Registration | null = null
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
let tournamentsWithTeams: (Tournament & { myTeam?: Team })[] = $(computed(() => tournaments.map(tournament => ({
  ...tournament,
  myTeam: registration?.teams.find(team => team.tournamentId === tournament.id),
}))))

</script>

<template lang="pug">
event-link.new(v-if="isOrganizer" to="new-tournament")
  calendar-plus
  span New tournament

.tournaments(v-if="tournaments.length")
  template(v-for="(tournament, index) in tournamentsWithTeams")
    .day(v-if="isNewDay(index)") {{ weekday(tournament.date) }}
    event-link.tournament(
      to="tournament" :params="{ name: tournament.shortName }"
      :class="{ [tournament.status]: true, hasBg: tournament.background }"
    )
      .bg(v-if="tournament.background" :style="{ backgroundImage: `url(${tournament.background})` }")
      .running(v-if="tournament.status === Status.Started")
      header
        h2 {{ tournament.name }}
        time
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
.new
  z-index: 10
  position: absolute
  right: 40px
  top: 18px
  color: inherit
  background-color: #25252d
  padding: 10px
  border-radius: 5px

  &:hover
    text-decoration: none
    background-color: #32323f
    color: #ff5878

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
  font-size: 1.4em
  font-weight: bold
  transform: skew(-8.5deg)
  text-shadow: 0.4px 0
  color: lightblue
  margin: 15px
  padding-left: 6px
  grid-column: 1 / -1

  &:not(:first-child)
    padding-top: 24px
    border-top: 1px solid rgba(255, 255, 255, 0.15)

.tournament
  background: linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.15))
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
    background-size: cover
    background-position: center
    position: absolute
    left: 0
    top: 0
    width: 100%
    height: 100%
    opacity: 25%
    z-index: -2
    transition: all 0.15s

  .running
    background-image: url("../assets/images/stripe.svg")
    background-size: 20px
    transform: rotate(45deg)
    position: absolute
    left: -50%
    top: -50%
    width: 200%
    height: 200%
    z-index: -1
    opacity: 10%

    animation-name: scroll
    animation-duration: 1s
    animation-iteration-count: infinite
    animation-timing-function: linear
    @keyframes scroll
      from
        background-position: 0
      to
        background-position: 20px

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
    background: linear-gradient(rgba(0, 128, 0, 0.4), rgba(0, 128, 128, 0.2))

    .status
      color: palegreen

  &.finished
    filter: grayscale(100%)
    opacity: 80%

  &:hover
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

.team-count, .status, time, .new
  display: flex
  align-items: center

  svg
    font-size: 1.2em
    margin-right: 4px

.empty
  margin: 100px
  text-align: center
</style>
