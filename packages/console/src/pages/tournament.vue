<script setup lang="ts">
import { toRefs, watchEffect } from "vue"
import { useRoute, useRouter } from "vue-router"
import { Registration, Status, Team, Tournament, User } from "@frilan/models"
import { useStore } from "@/store/store"
import http from "@/utils/http"
import Markdown from "@/components/common/markdown.vue"
import UserLink from "@/components/common/user-link.vue"
import EventLink from "@/components/common/event-link.vue"
import { NotFoundError } from "@/utils/not-found-error"
import { Subscriber } from "@/utils/subscriber"
import Rank from "@/components/common/rank.vue"
import TournamentBackground from "@/components/common/tournament-background.vue"
import {
  Account, AccountGroup, AccountMultiplePlus, AccountPlus, AccountRemove, Delete, ExitRun, Eye, FlagCheckered,
  HumanGreeting, LeadPencil, LocationEnter, LocationExit, Pencil, Play,
} from "mdue"

const route = useRoute()
const router = useRouter()
const store = useStore()

let { user, event } = $(toRefs(store.state))
let isOrganizer = $computed(() => store.getters.isOrganizer)

const { name } = route.params
const relations = ["teams", "teams.members", "teams.members.user"].join(",")
const url = `/events/${ event.id }/tournaments?shortName=${ name }&load=${ relations }`
const tournaments = await http.getMany(url, Tournament)
if (!tournaments.length)
  throw new NotFoundError()

let tournament = $ref(tournaments[0])

watchEffect(() => document.title = `${ tournament.name } - Console`)

// true if this is a solo tournament
let solo = $computed(() => tournament.teamSizeMax <= 1)

// true if the tournament has either started or is already finished
let tournamentStarted = $computed(() =>
  tournament.status === Status.Started || tournament.status === Status.Finished)

// references the registration object of the current user
let myself = $computed(() => user.registrations.find(r => r.eventId === event.id))
// true if the current user can register for this tournament
let canRegister = $computed(() => !!myself && !tournamentStarted)

// references the team of the current user
let myTeam = $computed(() => tournament.teams.find(t => t.members.some(m => m.userId === user.id)))
// true if the current user is registered for this tournament
let isRegistered = $computed(() => !!myTeam)

let fullTeams = $computed(() => tournament.teams.filter(team =>
  team.members.length >= tournament.teamSizeMin
  && team.members.length <= tournament.teamSizeMax))

let incompleteTeams = $computed(() =>
  tournamentStarted ? [] : tournament.teams.filter(team => !fullTeams.includes(team)))

// don't show incomplete teams once the tournament has started
let teamsGroups = $computed(() =>
  tournamentStarted || !incompleteTeams.length ? [fullTeams] : [incompleteTeams, fullTeams])

const isTeamFull = (team: Team) => team.members.length >= tournament.teamSizeMax
let isTournamentFull = $computed(() => tournament.teamCount >= tournament.teamCountMax)
let enoughParticipants = $computed(() => tournament.teamCount >= tournament.teamCountMin)

// keep teams sorted
watchEffect(() => {
  // sort by rank when finished
  if (tournament.status === Status.Finished)
    tournament.teams.sort(({ rank: a }, { rank: b }) => a - b)

  else {
    if (!solo)
      // show teams with the fewest members first
      tournament.teams.sort(({ members: a }, { members: b }) => a.length - b.length)

    // move the current user at the top
    if (isRegistered) {
      tournament.teams.sort(team => team === myTeam ? -1 : 1)
      if (!solo)
        myTeam?.members.sort(member => member.userId === user.id ? -1 : 1)
    }
  }
})

/**
 * Registers the current user to the tournament by creating a new team.
 */
async function register() {
  const name = solo ? user.displayName : prompt("Enter team name:")
  if (name && name.length)
    await http.post(`/tournaments/${ tournament.id }/teams`, { name }, Team)
}

/**
 * Removes the current user from their team.
 */
async function unregister() {
  await removeMember(myTeam, myself)
}

/**
 * Creates an empty team, or register an arbitrary user.
 */
async function createTeam() {
  if (solo) {
    const member = await promptMember()
    if (member)
      await http.post(`/tournaments/${ tournament.id }/teams`,
        { name: member.user.displayName, members: [member] }, Team)
  } else {
    const name = prompt("Enter team name:")
    if (name && name.length)
      await http.post(`/tournaments/${ tournament.id }/teams`, { name, members: [] }, Team)
  }
}

/**
 * Adds an arbitrary user to an existing team.
 * @param team The target team
 * @param member The user to add to the team
 */
async function addMember(team?: Team, member?: Registration) {
  if (!team || !member) return

  // if not already a member
  if (team.members.every(m => m.userId !== member.userId))
    await http.put(`/teams/${ team.id }/members/${ member.userId }`, {})
}

/**
 * Removes an arbitrary user from their team.
 * @param team The target team
 * @param member The user to remove from the team
 */
async function removeMember(team?: Team, member?: Registration) {
  if (!team || !member) return
  if (member === myself || confirm("Do you really want to remove " + member.user.displayName + "?"))
    await http.delete(`/teams/${ team.id }/members/${ member.userId }`)
}

/**
 * Renames a team.
 * @param team The target team
 */
async function renameTeam(team: Team) {
  const name = prompt("Enter team name:", team.name)
  if (name && name.length && name !== team.name)
    await http.patch(`/teams/${ team.id }`, { name })
}

/**
 * Delete a team with all its members.
 * @param team The target team
 */
async function deleteTeam(team: Team) {
  const name = solo && team.members.length ? team.members[0].user.displayName : team.name
  if (confirm("Do you really want to remove " + name + "?"))
    await http.delete(`/teams/${ team.id }`)
}

/**
 * Prompts for a username and returns the associated registration.
 */
async function promptMember(): Promise<Registration | null> {
  const username = prompt("Enter member username:")
  if (!username || !username.length) return null

  const users = await http.getMany("/users?load=registrations&username=" + username, User)
  if (!users.length)
    throw "User not found"

  const targetUser = users[0]
  const registration = targetUser.registrations.find(r => r.eventId === event.id)
  if (!registration)
    throw "This user is not registered for this event"

  return { ...registration, user: targetUser }
}

/**
 * Prompts for a user to be added to a team.
 * @param team The target team
 */
async function addMemberPrompt(team: Team) {
  const member = await promptMember()
  if (member)
    await addMember(team, member)
}

/**
 * Returns true if the current user can join a team.
 * @param team The target team
 */
function canJoin(team: Team) {
  return canRegister && !isRegistered && !isTeamFull(team)
}

/**
 * Makes the current tournament visible to players.
 */
async function makeVisible() {
  await http.patch("/tournaments/" + tournament.id, { status: Status.Ready })
}

/**
 * Locks registrations and start tournament.
 */
async function startTournament() {
  if (confirm("This will lock teams and registrations permanently. Are you sure you want to start the tournament?")) {
    await http.patch("/tournaments/" + tournament.id, { status: Status.Started })
  }
}

// handle live updates
new Subscriber(Tournament, { id: tournament.id })
  .onUpdate(updatedTournament => Object.assign(tournament, updatedTournament))
  .onDelete(() => router.go(0))

new Subscriber(Team, { tournamentId: tournament.id })
  .onCreate(async ({ id }) =>
    tournament.teams.push(await http.getOne(`/teams/${ id }?load=members,members.user`, Team)))
  .onUpdate(async ({ id }) => {
    const index = tournament.teams.findIndex(team => team.id === id)
    if (index >= 0) tournament.teams[index] = await http.getOne(`/teams/${ id }?load=members,members.user`, Team)
  })
  .onDelete(async ({ id }) => {
    const index = tournament.teams.findIndex(team => team.id === id)
    if (index >= 0) tournament.teams.splice(index, 1)
  })
</script>

<template lang="pug">
.container(:class="{ [tournament.status]: true }")
  header.tournament-header
    tournament-background(:tournament="tournament")
    .running(v-if="tournament.status === Status.Started")
    .tournament-title
      h1 {{ tournament.name }}
      p.status(v-if="tournament.status === Status.Started") The tournament has started
      p.status(v-if="tournament.status === Status.Finished") The tournament is over

    .admin(v-if="isOrganizer")
      span Administration
      .actions
        event-link.button(to="edit-tournament" :params="{ name }")
          pencil
          span Edit
        template(v-if="!tournamentStarted")
          button.button(v-if="!isTournamentFull" @click="createTeam")
            template(v-if="solo")
              account-plus
              span Add player
            template(v-else)
              account-multiple-plus
              span New team
          button.button(v-if="tournament.status === Status.Hidden" @click="makeVisible")
            eye
            span Make visible
          button.button.green(v-else-if="enoughParticipants" @click="startTournament")
            play
            span Start
          button.button.green(v-else disabled title="Not enough participants")
            play
            span Start
        event-link.button(v-else to="tournament-results" :params="{ name }")
          template(v-if="tournament.status === Status.Started")
            flag-checkered
            span Finish
          template(v-else)
            lead-pencil
            span Results

    .teamCount(:title="'Registered ' + (solo ? 'players' : 'teams')")
      account(v-if="solo")
      account-group(v-else)
      .count
        span.current(:class='{ low: !enoughParticipants }') {{ tournament.teamCount }}
        span.max(v-if="!tournamentStarted") !{" "}/ {{ tournament.teamCountMax }}

    template(v-if="canRegister")
      button.button.unregister(v-if="isRegistered" @click="unregister")
        exit-run
        span Unregister
      button.button.register(v-if="!isRegistered && !isTournamentFull" @click="register")
        human-greeting
        span Register

  .content
    markdown.rules(:src="tournament.rules")

    .teamsGroup(v-for="(teams, index) in teamsGroups")
      h2(v-if="tournament.status === Status.Finished") Results
      h2(v-else-if="teamsGroups.length > 1 && index === 0") Incomplete teams
      h2(v-else-if="solo") {{ tournamentStarted ? "Players" : "Registered players" }}
      h2(v-else) {{ tournamentStarted ? "Teams" : "Registered teams" }}
      .teams(v-if="teams.length" :class="{ solo }")
        .team(
          v-for="team in teams"
          :class="{ myTeam: team === myTeam }"
        )
          rank.rank(v-if="tournament.status === Status.Finished" :rank="team.rank")

          .info
            template(v-if="!solo || !team.members.length")
              header
                .name {{ team.name }}
                .actions(v-if="!tournamentStarted")
                  button(v-if="team === myTeam" @click="removeMember(team, myself)" title="Leave team")
                    location-exit
                  button(v-if="team === myTeam || isOrganizer" @click="renameTeam(team)" title="Rename team")
                    pencil
                  button(v-if="isOrganizer && !isTeamFull(team)" @click="addMemberPrompt(team)" title="Add member")
                    account-plus
                  button.icon.red(v-if="isOrganizer" @click="deleteTeam(team)" title="Delete team")
                    delete
              ul.members(v-if="team.members.length")
                li.member(v-for="member in team.members")
                  user-link.user(:registration="member" :class='{ myself: member.userId === user.id }')
                  .actions
                    button.icon.red(
                      v-if="isOrganizer && !tournamentStarted"
                      @click="removeMember(team, member)"
                      title="Remove from team"
                    )
                      account-remove
              p.noMembers(v-else) There are no members in this team
              footer(v-if="canJoin(team)")
                .membersCount
                  account
                  span {{ team.members.length }} / {{ tournament.teamSizeMax }}
                button.button(@click="addMember(team, myself)")
                  location-enter
                  span Join

            .member(v-else)
              user-link.user(:registration="team.members[0]" :class='{ myself: team.members[0].userId === user.id }')
              .actions
                button.icon.red(v-if="isOrganizer && !tournamentStarted" @click="deleteTeam(team)" title="Unregister")
                  account-remove

          .result(v-if="tournament.status === Status.Finished") {{ team.result }} pts

      p.noTeams(v-else) Nobody has registered for this tournament yet.
</template>

<style scoped lang="sass">
@import "@/assets/styles/main.sass"
@import "@/assets/styles/tournament.sass"

.container
  display: flex
  flex-direction: column
  margin-bottom: 20px
  min-width: 800px

.tournament-header
  flex-shrink: 0
  display: flex
  padding: 16px 20px
  align-items: center
  position: relative
  z-index: 1
  overflow: hidden
  box-shadow: 0 15px 20px rgba(0, 0, 0, 0.15)

  .tournament-title
    flex: 1
    text-shadow: 0 0 10px rgba(0, 0, 0, 0.5)

    h1
      font-weight: normal
      margin: 0

    .status
      color: #bbd
      margin: 8px 0 0

  .teamCount, .register, .unregister
    display: flex
    flex-direction: column
    align-items: center
    padding: 10px
    border-radius: 5px
    margin-left: 16px

    svg
      margin-bottom: 8px
      font-size: 2em

  .teamCount
    background-color: rgba(0, 0, 0, 0.3)
    width: 80px
    font-weight: bold

    .low
      color: #ee6391

  .register, .unregister
    width: 100px

  .unregister
    @extend .red

  .admin
    background-color: rgba(0, 0, 0, 0.3)
    border-radius: 5px
    align-self: stretch
    display: flex
    flex-direction: column
    justify-content: space-between
    align-items: center
    padding: 8px
    margin-left: 20px

    span
      font-size: 0.8em

    .button:not(:last-child)
      margin-right: 8px

.started
  .tournament-header
    background: $running-bg

  .tournament-title .status
    color: $started

.content
  display: flex

.rules
  max-width: 700px
  padding: 15px
  margin: 0 15px
  flex: 1

.teamsGroup
  $width: 230px
  flex: 0 0 $width
  max-width: $width
  padding-right: 20px

  h2
    @extend .skewed
    text-align: center

  &:not(:last-child) .team
    background-color: rgba(0, 40, 60, 0.2)

    &.myTeam
      background-color: rgba(0, 40, 60, 0.3)

.finished .teamsGroup
  $width: 300px
  flex: 0 0 $width
  max-width: $width

.team
  display: flex
  align-items: baseline
  background-color: rgba(0, 0, 0, 0.2)
  padding: 10px
  margin: 15px 0
  border-radius: 5px

  .rank
    margin: 2px 10px 2px 0
    flex-shrink: 0

  .result
    margin-left: 6px
    white-space: nowrap
    flex-grow: 1
    text-align: right
    font-size: 0.9em

  .info
    width: 100%
    overflow: hidden

    header
      display: flex
      justify-content: space-between
      align-items: center
      height: 26px
      padding: 1px

  .name
    font-weight: bold
    overflow: hidden
    white-space: nowrap
    text-overflow: ellipsis

  .actions
    white-space: nowrap

    button
      @extend .icon
      opacity: 0
      transition: opacity 0.1s linear

      &:not(:last-child)
        margin-right: 5px

  &:hover .actions button
    opacity: inherit

  .members
    padding-left: 6px
    margin: 6px 0

  .member
    display: flex
    justify-content: space-between
    align-items: center
    height: 30px

    .user
      max-width: 100%
      overflow: hidden

      a
        overflow: hidden
        white-space: nowrap
        text-overflow: ellipsis

    .user:not(.myself) svg
      opacity: 50%

  footer
    display: flex
    justify-content: space-between
    align-items: baseline

  .membersCount
    @extend .icon-text
    color: rgba(255, 255, 255, 0.8)
    padding-left: 15px

  .noMembers
    font-size: 0.8em
    font-style: italic

.teams.solo
  background-color: rgba(0, 0, 0, 0.2)
  border-radius: 5px
  padding: 10px

  .team
    background-color: initial
    align-items: center
    margin: 0
    padding: 0

:not(.solo) > .myTeam
  outline: 2px solid rgba(200, 220, 255, 0.5)
  background-color: rgba(0, 0, 0, 0.3)

.finished .team .info
  width: unset

.rank-1 .rank, .rank-2 .rank, .rank-3 .rank
  font-size: 1.1em
  border-radius: 100%

.rank-1 .rank
  background-color: #ffe989
  color: #bd7b32

.rank-2 .rank
  background-color: #b4c1c7
  color: #425777

.rank-3 .rank
  background-color: #b48b7e
  color: #721b0d

.noTeams
  font-size: 0.9em
  color: $light-glass
</style>
