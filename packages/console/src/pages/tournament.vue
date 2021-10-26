<script setup lang="ts">
import { computed, toRefs } from "vue"
import { useRoute } from "vue-router"
import { useStore } from "../store/store"
import http from "../utils/http"
import { Registration, Status, Team, Tournament, User } from "@frilan/models"
import Markdown from "../components/common/markdown.vue"
import UserLink from "../components/common/user-link.vue"
import EventLink from "../components/common/event-link.vue"
import { NotFoundError } from "../utils/not-found-error"

const route = useRoute()
const store = useStore()

let { user, event } = $(toRefs(store.state))
const { isOrganizer } = store.getters

const { name } = route.params
const relations = ["teams", "teams.members", "teams.members.user"].join(",")
const url = `/events/${ event.id }/tournaments?shortName=${ name }&load=${ relations }`
const tournaments = await http.getMany(url, Tournament)
if (!tournaments.length)
  throw new NotFoundError()

let tournament = $ref(tournaments[0])

document.title = `${ tournament.name } - ${ document.title }`

if (tournament.status === Status.Finished)
  tournament.teams.sort(({ rank: a }, { rank: b }) => a - b)

// references the registration object of the current user
let myself = $(computed(() => user.registrations.find(r => r.eventId === event.id)))
// true if the current user can register to this tournament
let canRegister = $(computed(() => !!myself))

// references the team of the current user
let myTeam = $(computed(() => tournament.teams.find(t => t.members.some(m => m.userId === user.id))))
// true if the current user is registered to this tournament
let isRegistered = $(computed(() => !!myTeam))

let fullTeams = $(computed(() => tournament.teams.filter(team =>
  team.members.length >= tournament.teamSizeMin
  && team.members.length <= tournament.teamSizeMax)))

let tournamentStarted = $(computed(() =>
  tournament.status === Status.Started || tournament.status === Status.Finished))

let incompleteTeams = $(computed(() =>
  tournamentStarted ? [] : tournament.teams.filter(team => !fullTeams.includes(team))))

// don't show incomplete teams once the tournament has started
let teamsGroups = $(computed(() =>
  tournamentStarted || !incompleteTeams.length ? [fullTeams] : [incompleteTeams, fullTeams]))

const isTeamFull = (team: Team) => team.members.length >= tournament.teamSizeMax
let isTournamentFull = $(computed(() => tournament.teamCount >= tournament.teamCountMax))

/**
 * Registers the current user to the tournament by creating a new team.
 */
async function register() {
  const name = tournament.teamSizeMax > 1 ? prompt("Enter team name:") : user.displayName
  if (!name || !name.length) return

  const team = await http.post(`/tournaments/${ tournament.id }/teams`, { name }, Team)
  if (team.members.length)
    team.members[0].user = user
  tournament.teams.push(team)
  tournament.teamCount = fullTeams.length
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
  let team: Team
  if (tournament.teamSizeMax <= 1) {
    const member = await promptMember()
    if (!member) return
    team = await http.post(`/tournaments/${ tournament.id }/teams`,
      { name: member.user.displayName, members: [member] }, Team)
  } else {
    const name = prompt("Enter team name:")
    if (!name || !name.length) return
    team = await http.post(`/tournaments/${ tournament.id }/teams`, { name, members: [] }, Team)
  }

  tournament.teams.push(team)
  tournament.teamCount = fullTeams.length
}

/**
 * Adds an arbitrary user to an existing team.
 * @param team The target team
 * @param member The user to add to the team
 */
async function addMember(team: Team, member: Registration) {
  await http.put(`/teams/${ team.id }/members/${ member.userId }`, {})
  // if this is the current user, we don't need to fetch their profile
  if (member.userId === user.id)
    team.members.push({ ...member, user })
  else {
    const targetUser = await http.getOne(`/users/${ member.userId }`, User)
    team.members.push({ ...member, user: targetUser })
  }
  tournament.teamCount = fullTeams.length
}

/**
 * Removes an arbitrary user from their team.
 * @param team The target team
 * @param member The user to remove from the team
 */
async function removeMember(team: Team, member: Registration) {
  await http.delete(`/teams/${ team.id }/members/${ member.userId }`)
  team.members = team.members.filter(({ userId }) => userId !== member.userId)
  // also remove team if empty
  if (!team.members.length)
    tournament.teams.splice(tournament.teams.indexOf(team), 1)

  tournament.teamCount = fullTeams.length
}

/**
 * Renames a team.
 * @param team The target team
 */
async function renameTeam(team: Team) {
  const name = prompt("Enter team name:", team.name)
  if (name && name.length && name !== team.name) {
    await http.patch(`/teams/${ team.id }`, { name })
    team.name = name
  }
}

/**
 * Delete a team with all its members.
 * @param team The target team
 */
async function deleteTeam(team: Team) {
  await http.delete(`/teams/${ team.id }`)
  tournament.teams.splice(tournament.teams.indexOf(team), 1)
  tournament.teamCount = fullTeams.length
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
    throw "This user is not registered to this event"

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
 * Locks registrations and start tournament.
 */
async function startTournament() {
  if (confirm("This will lock teams and registrations permanently. Are you sure you want to start the tournament?")) {
    await http.patch("/tournaments/" + tournament.id, { status: Status.Started })
    tournament.status = Status.Started
  }
}
</script>

<template lang="pug">
h1 {{ tournament.name }}
event-link(v-if="isOrganizer" to="edit-tournament" :params="{ name }") Edit

p.info {{ tournament.teamCount }}!{" "}
  template(v-if="!tournamentStarted") / {{ tournament.teamCountMax }}
  | !{" "}registered {{ tournament.teamSizeMax > 1 ? "teams" : "players" }}

template(v-if="!tournamentStarted")
  template(v-if="canRegister")
    button(v-if="isRegistered" @click="unregister") Unregister
    button(v-if="!isRegistered && !isTournamentFull" @click="register") Register

  template(v-if="isOrganizer")
    button(v-if="!isTournamentFull" @click="createTeam")
      | {{ tournament.teamSizeMax > 1 ? "Create team" : "Register player" }}
    button(v-if="tournament.teamCount >= tournament.teamCountMin" @click="startTournament") Start
    button(v-else disabled title="Not enough participants") Start

event-link(v-else-if="isOrganizer" to="tournament-results" :params="{ name }")
  | Enter results

markdown.rules(:src="tournament.rules")

template(v-for="(teams, index) in teamsGroups")
  h2(v-if="tournament.status === Status.Finished") Results
  h2(v-else-if="teamsGroups.length > 1 && index === 0") Incomplete teams
  h2(v-else-if="tournament.teamSizeMax > 1") {{ tournamentStarted ? "Teams" : "Registered teams" }}
  h2(v-else) {{ tournamentStarted ? "Players" : "Registered players" }}
  table.teams(v-if="teams.length")
    tr(v-for="team in teams")
      td.rank(v-if="tournament.status === Status.Finished") {{ team.rank }}
      td.team

        template(v-if="tournament.teamSizeMax > 1 || !team.members.length")
          span.name {{ team.name }}
          template(v-if="!tournamentStarted")
            button(v-if="canRegister && !isRegistered && !isTeamFull(team)" @click="addMember(team, myself)") Join
            button(v-if="team === myTeam || isOrganizer" @click="renameTeam(team)") Rename
            button(v-if="team === myTeam" @click="removeMember(team, myself)") Leave
            button(v-if="isOrganizer && !isTeamFull(team)" @click="addMemberPrompt(team)") Add member
            button(v-if="isOrganizer" @click="deleteTeam(team)") Delete
          ul.members(v-if="team.members.length")
            li.member(v-for="member in team.members")
              user-link(:user="member.user")
              button(v-if="isOrganizer && !tournamentStarted" @click="removeMember(team, member)") Remove
          p(v-else) There are no members in this team

        template(v-else)
          user-link(:user="team.members[0].user")
          button(v-if="isOrganizer && !tournamentStarted" @click="deleteTeam(team)") Remove

      td.result(v-if="tournament.status === Status.Finished") {{ team.result }} pts

  p(v-else) Nobody has registered to this tournament yet.
</template>

<style scoped lang="sass">
.teams td
  vertical-align: text-top

.team
  .name
    font-weight: bold

  .members
    padding-left: 15px
</style>
