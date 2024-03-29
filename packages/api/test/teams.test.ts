import { createEvents, createUsers, http, refreshPrivilege, TestUser } from "./setup"
import { Role, Status } from "@frilan/models"

// shared states
let admin: TestUser
let user1: TestUser
let user2: TestUser
let user3: TestUser
let user4: TestUser
let unregistered: TestUser
let event1: number
let event2: number
let hiddenTournament: number
let readyTournament: number
let startedTournament: number
let adminTeam: number
let organizerTeam: number
let playerTeam: number
let emptyTeam: number
let startedTeam: number

beforeAll(async () => {
    [admin, user1, user2, user3, user4, unregistered] = await createUsers(6)
    ;[event1, event2] = await createEvents(2, admin.config)

    // create tournaments
    const tournament = {
        name: "t",
        shortName: "t",
        date: 5,
        duration: 1,
        teamSizeMin: 1,
        teamSizeMax: 1,
        teamCountMin: 2,
        teamCountMax: 3,
    }

    let res = await http.post(`/events/${ event1 }/tournaments`, tournament, admin.config)
    hiddenTournament = res.data.id
    res = await http.post(`/events/${ event2 }/tournaments`, { ...tournament, status: Status.Ready }, admin.config)
    readyTournament = res.data.id
    tournament.shortName = "t2" // prevent unique violation
    res = await http.post(`/events/${ event1 }/tournaments`, { ...tournament, status: Status.Ready }, admin.config)
    startedTournament = res.data.id

    // register users to events
    for (const user of [admin, user1, user2])
        await http.put(`/events/${ event1 }/registrations/${ user.id }`, {}, admin.config)
    for (const user of [user3, user4])
        await http.put(`/events/${ event2 }/registrations/${ user.id }`, {}, admin.config)
    await http.put(`/events/${ event2 }/registrations/${ user1.id }`, { role: Role.Organizer }, admin.config)
    await refreshPrivilege(admin)
    await refreshPrivilege(user1)
    await refreshPrivilege(user2)
})

describe("create teams", () => {

    test("create team as admin", async () => {
        let res = await http.post(`/tournaments/${ hiddenTournament }/teams`,
            { name: "admin", result: 999, rank: 2 }, admin.config)
        expect(res.status).toBe(201)
        expect(res.data.name).toBe("admin")
        expect(res.data.members.length).toBe(1)
        expect(res.data.members[0].userId).toBe(admin.id)
        expect(res.data.tournamentId).toBe(hiddenTournament)
        // make sure result and rank are set to default values
        expect(res.data.result).toBe(0)
        expect(res.data.rank).toBe(0)
        adminTeam = res.data.id

        res = await http.get(`/tournaments/${ hiddenTournament }`, admin.config)
        expect(res.status).toBe(200)
        expect(res.data.teamCount).toBe(1)
    })

    test("create team as organizer", async () => {
        let res = await http.post(`/tournaments/${ readyTournament }/teams`, { name: "organizer" }, user1.config)
        expect(res.status).toBe(201)
        expect(res.data.tournamentId).toBe(readyTournament)
        expect(res.data.members[0].userId).toBe(user1.id)
        organizerTeam = res.data.id

        res = await http.get(`/tournaments/${ readyTournament }`, user1.config)
        expect(res.status).toBe(200)
        expect(res.data.teamCount).toBe(1)
    })

    test("create team as player", async () => {
        let res = await http.post(`/tournaments/${ hiddenTournament }/teams`, { name: "player" }, user1.config)
        expect(res.status).toBe(201)
        expect(res.data.members[0].userId).toBe(user1.id)
        playerTeam = res.data.id

        res = await http.get(`/tournaments/${ hiddenTournament }`, admin.config)
        expect(res.status).toBe(200)
        expect(res.data.teamCount).toBe(2)
    })

    test("create empty team as unregistered admin", async () => {
        let res = await http.post(`/tournaments/${ readyTournament }/teams`,
            { name: "empty", members: [] }, admin.config)
        expect(res.status).toBe(201)
        expect(res.data.members.length).toBe(0)
        emptyTeam = res.data.id

        res = await http.get(`/tournaments/${ readyTournament }`, admin.config)
        expect(res.status).toBe(200)
        expect(res.data.teamCount).toBe(1)
    })

    test("create team with members as organizer", async () => {
        let res = await http.post(`/tournaments/${ readyTournament }/teams`,
            { name: "empty", members: [{ userId: user4.id, score: 30, role: Role.Organizer }] }, user1.config)
        expect(res.status).toBe(201)
        expect(res.data.members.length).toBe(1)

        res = await http.get(`/tournaments/${ readyTournament }?load=teams,teams.members`, admin.config)
        expect(res.status).toBe(200)
        expect(res.data.teamCount).toBe(2)
        expect(res.data.teams[2].members[0].userId).toBe(user4.id)
        // make sure we didn't update the associated registration
        expect(res.data.teams[2].members[0].score).toBe(0)
        expect(res.data.teams[2].members[0].role).toBe(Role.Player)
    })

    test("prevent creating team with empty name", async () => {
        const res = await http.post(`/tournaments/${ hiddenTournament }/teams`, { name: "" }, admin.config)
        expect(res.status).toBe(400)
    })

    test("prevent adding team to already started tournament", async () => {
        // add teams before starting
        await http.post(`/tournaments/${ startedTournament }/teams`, { name: "random" }, admin.config)
        let res = await http.post(`/tournaments/${ startedTournament }/teams`, { name: "started" }, user1.config)
        expect(res.status).toBe(201)
        startedTeam = res.data.id

        // start tournament
        await http.patch(`/tournaments/${ startedTournament }`, { status: Status.Started }, admin.config)

        res = await http.post(`/tournaments/${ startedTournament }/teams`, { name: "garbage" }, admin.config)
        expect(res.status).toBe(400)
    })

    test("prevent adding team to a tournament that is full", async () => {
        const res = await http.post(`/tournaments/${ hiddenTournament }/teams`, { name: "garbage" }, admin.config)
        expect(res.status).toBe(400)
    })

    test("create creating another team in same tournament", async () => {
        const res = await http.post(`/tournaments/${ hiddenTournament }/teams`, { name: "garbage" }, user1.config)
        expect(res.status).toBe(400)
    })

    test("prevent creating team with members as player", async () => {
        const res = await http.post(`/tournaments/${ readyTournament }/teams`,
            { name: "garbage", members: [{ userId: user4.id }] }, user3.config)
        expect(res.status).toBe(403)
    })

    test("prevent creating team with invalid members", async () => {
        let res = await http.post(`/tournaments/${ readyTournament }/teams`,
            { name: "empty", members: "garbage" }, user1.config)
        expect(res.status).toBe(400)

        res = await http.post(`/tournaments/${ readyTournament }/teams`,
            { name: "empty", members: [123] }, user1.config)
        expect(res.status).toBe(400)

        res = await http.post(`/tournaments/${ readyTournament }/teams`,
            { name: "empty", members: [{ userId: 3 }, true] }, user1.config)
        expect(res.status).toBe(400)

        res = await http.post(`/tournaments/${ readyTournament }/teams`,
            { name: "empty", members: [{ userId: "3" }] }, user1.config)
        expect(res.status).toBe(400)
    })

    test("prevent creating team as unregistered", async () => {
        const res = await http.post(`/tournaments/${ hiddenTournament }/teams`,
            { name: "garbage" }, unregistered.config)
        expect(res.status).toBe(403)
    })

    test("prevent creating team when not logged in", async () => {
        const res = await http.post(`/tournaments/${ hiddenTournament }/teams`, { name: "garbage" })
        expect(res.status).toBe(401)
    })

    test("prevent creating team in non-existing tournament", async () => {
        const res = await http.post("/tournaments/999/teams", { name: "garbage" }, admin.config)
        expect(res.status).toBe(404)
    })

})

describe("read teams", () => {

    test("read all teams as admin", async () => {
        let res = await http.get(`/tournaments/${ hiddenTournament }/teams`, admin.config)
        expect(res.status).toBe(200)
        expect(res.data.length).toBe(2)
        expect(res.data[0].name).toBe("admin")
        expect(res.data[1].name).toBe("player")

        res = await http.get(`/tournaments/${ readyTournament }/teams`, admin.config)
        expect(res.status).toBe(200)
        expect(res.data.length).toBe(3)
        expect(res.data[0].name).toBe("organizer")
        expect(res.data[1].name).toBe("empty")
    })

    test("read all teams as registered", async () => {
        const res = await http.get(`/tournaments/${ readyTournament }/teams`, user1.config)
        expect(res.status).toBe(200)
    })

    test("read all teams as unregistered", async () => {
        const res = await http.get(`/tournaments/${ hiddenTournament }/teams`, unregistered.config)
        expect(res.status).toBe(200)
    })

    test("prevent reading all teams when not logged in", async () => {
        const res = await http.get(`/tournaments/${ hiddenTournament }/teams`)
        expect(res.status).toBe(401)
    })

    test("read single team as admin", async () => {
        const res = await http.get("/teams/" + adminTeam, admin.config)
        expect(res.status).toBe(200)
        expect(res.data.name).toBe("admin")
    })

    test("read single team as registered", async () => {
        const res = await http.get("/teams/" + organizerTeam, user1.config)
        expect(res.status).toBe(200)
        expect(res.data.name).toBe("organizer")
    })

    test("read single team as unregistered", async () => {
        const res = await http.get("/teams/" + adminTeam, unregistered.config)
        expect(res.status).toBe(200)
        expect(res.data.name).toBe("admin")
    })

    test("prevent reading single team when not logged in", async () => {
        const res = await http.get("/teams/" + adminTeam)
        expect(res.status).toBe(401)
    })

    test("prevent reading non-existing team", async () => {
        const res = await http.get("/teams/999", admin.config)
        expect(res.status).toBe(404)
    })
})

describe("update teams", () => {

    test("update team as admin", async () => {
        const res = await http.patch("/teams/" + playerTeam, { name: "team1" }, admin.config)
        expect(res.status).toBe(200)
        expect(res.data.name).toBe("team1")
    })

    test("update team as organizer", async () => {
        const res = await http.patch("/teams/" + emptyTeam, { name: "team2" }, user1.config)
        expect(res.status).toBe(200)
        expect(res.data.name).toBe("team2")
    })

    test("update team as member", async () => {
        const res = await http.patch("/teams/" + playerTeam, { name: "team3" }, user1.config)
        expect(res.status).toBe(200)
        expect(res.data.name).toBe("team3")
    })

    test("prevent updating result", async () => {
        const res = await http.patch("/teams/" + playerTeam, { result: 999 }, user1.config)
        expect(res.status).toBe(200)
        expect(res.data.result).toBe(0)
    })

    test("prevent updating team if already started", async () => {
        const res = await http.patch("/teams/" + startedTeam, { name: "garbage" }, admin.config)
        expect(res.status).toBe(400)
    })

    test("prevent updating team as non-member", async () => {
        const res = await http.patch("/teams/" + adminTeam, { name: "garbage" }, user1.config)
        expect(res.status).toBe(403)
    })

    test("prevent updating team as unregistered", async () => {
        const res = await http.patch("/teams/" + playerTeam, { name: "garbage" }, unregistered.config)
        expect(res.status).toBe(403)
    })

    test("prevent updating team when not logged in", async () => {
        const res = await http.patch("/teams/" + playerTeam, { name: "garbage" })
        expect(res.status).toBe(401)
    })

    test("prevent updating non-existing team", async () => {
        const res = await http.patch("/teams/999", { name: "garbage" }, admin.config)
        expect(res.status).toBe(404)
    })

})

describe("add team members", () => {

    test("add member as admin", async () => {
        let res = await http.put(`/teams/${ emptyTeam }/members/${ user3.id }`, {}, admin.config)
        expect(res.status).toBe(204)

        res = await http.get(`/tournaments/${ readyTournament }`, admin.config)
        expect(res.data.teamCount).toBe(3)
    })

    test("add member as organizer", async () => {
        await http.delete(`/teams/${ emptyTeam }`, admin.config)
        let res = await http.post(`/tournaments/${ readyTournament }/teams`,
            { name: "test", members: [] }, admin.config)
        emptyTeam = res.data.id

        res = await http.put(`/teams/${ emptyTeam }/members/${ user3.id }`, {}, user1.config)
        expect(res.status).toBe(204)

        res = await http.get(`/tournaments/${ readyTournament }`, user1.config)
        expect(res.data.teamCount).toBe(3)
    })

    test("prevent joining team when already full", async () => {
        const res = await http.put(`/teams/${ adminTeam }/members/${ user1.id }`, {}, user1.config)
        expect(res.status).toBe(400)
    })

    test("join team as player", async () => {
        // update team size
        await http.patch("tournaments/" + hiddenTournament, { teamSizeMin: 2, teamSizeMax: 2 }, admin.config)
        let res = await http.get(`/tournaments/${ hiddenTournament }`, admin.config)
        expect(res.data.teamCount).toBe(0)

        res = await http.put(`/teams/${ adminTeam }/members/${ user2.id }`, {}, user2.config)
        expect(res.status).toBe(204)

        res = await http.get(`/tournaments/${ hiddenTournament }`, admin.config)
        expect(res.data.teamCount).toBe(1)
    })

    test("prevent joining another team in the same tournament", async () => {
        let res = await http.put(`/teams/${ adminTeam }/members/${ user1.id }`, {}, user1.config)
        expect(res.status).toBe(400)

        res = await http.get(`/tournaments/${ hiddenTournament }`, admin.config)
        expect(res.data.teamCount).toBe(1)
    })

    test("prevent adding members when tournament has already started", async () => {
        const res = await http.put(`/teams/${ startedTeam }/members/${ admin.id }`, {}, admin.config)
        expect(res.status).toBe(400)
    })

    test("prevent adding unregistered members", async () => {
        const res = await http.put(`/teams/${ adminTeam }/members/${ unregistered.id }`, {}, admin.config)
        expect(res.status).toBe(400)
    })

    test("prevent adding other members as player", async () => {
        const res = await http.put(`/teams/${ adminTeam }/members/${ admin.id }`, {}, user1.config)
        expect(res.status).toBe(403)
    })

    test("prevent joining team as unregistered", async () => {
        const res = await http.put(`/teams/${ adminTeam }/members/${ unregistered.id }`, {}, unregistered.config)
        expect(res.status).toBe(400)
    })

    test("prevent adding member when not logged in", async () => {
        const res = await http.put(`/teams/${ adminTeam }/members/${ user1.id }`, {})
        expect(res.status).toBe(401)
    })

})

describe("read team members", () => {

    test("read members as admin", async () => {
        const res = await http.get(`/teams/${ emptyTeam }/members`, admin.config)
        expect(res.status).toBe(200)
        expect(res.data.length).toBe(1)
        expect(res.data[0].userId).toBe(user3.id)
    })

    test("read members as registered", async () => {
        const res = await http.get(`/teams/${ adminTeam }/members`, user1.config)
        expect(res.status).toBe(200)
        expect(res.data.length).toBe(2)
        expect(res.data[0].userId).toBe(admin.id)
    })

    test("read members as unregistered", async () => {
        const res = await http.get(`/teams/${ playerTeam }/members`, unregistered.config)
        expect(res.status).toBe(200)
        expect(res.data.length).toBe(1)
        expect(res.data[0].userId).toBe(user1.id)
    })

    test("prevent reading members when not logged in", async () => {
        const res = await http.get(`/teams/${ playerTeam }/members`)
        expect(res.status).toBe(401)
    })

    test("prevent reading members of non-existing team", async () => {
        const res = await http.get("/teams/$999/members", admin.config)
        expect(res.status).toBe(404)
    })

})

describe("remove team members", () => {

    test("remove member as admin", async () => {
        let res = await http.delete(`/teams/${ emptyTeam }/members/${ user3.id }`, admin.config)
        expect(res.status).toBe(204)

        res = await http.get(`/tournaments/${ readyTournament }`, user1.config)
        expect(res.data.teamCount).toBe(2)
    })

    test("prevent reading team after removing last member", async () => {
        const res = await http.get(`/teams/${ emptyTeam }`, admin.config)
        expect(res.status).toBe(404)
    })

    test("remove member as organizer", async () => {
        // create new team
        let res = await http.post(`/tournaments/${ readyTournament }/teams`,
            { name: "test", members: [{ userId: user3.id }] }, admin.config)
        const teamId = res.data.id

        res = await http.delete(`/teams/${ teamId }/members/${ user3.id }`, user1.config)
        expect(res.status).toBe(204)

        res = await http.get(`/tournaments/${ readyTournament }`, user1.config)
        expect(res.data.teamCount).toBe(2)
    })

    test("leave team as member", async () => {
        let res = await http.delete(`/teams/${ adminTeam }/members/${ user2.id }`, user2.config)
        expect(res.status).toBe(204)

        res = await http.get(`/tournaments/${ hiddenTournament }`, admin.config)
        expect(res.data.teamCount).toBe(0)
    })

    test("prevent removing members when tournament has already started", async () => {
        const res = await http.delete(`/teams/${ startedTeam }/members/${ admin.id }`, admin.config)
        expect(res.status).toBe(400)
    })

    test("prevent removing other members as player", async () => {
        const res = await http.delete(`/teams/${ adminTeam }/members/${ admin.id }`, user1.config)
        expect(res.status).toBe(403)
    })

    test("prevent removing member when not logged in", async () => {
        const res = await http.delete(`/teams/${ playerTeam }/members/${ user1.id }`)
        expect(res.status).toBe(401)
    })

    test("prevent reading non-existing member", async () => {
        const res = await http.get(`/teams/${ adminTeam }/members`, admin.config)
        expect(res.status).toBe(200)
        expect(res.data.length).toBe(1)
        expect(res.data[0].username).not.toBe(user2.username)
    })

    test("leave team as admin", async () => {
        // change team size to update team count
        await http.patch(`/tournaments/${ hiddenTournament }`, { teamSizeMin: 1 }, admin.config)
        let res = await http.get(`/tournaments/${ hiddenTournament }`, admin.config)
        expect(res.data.teamCount).toBe(2)

        res = await http.delete(`/teams/${ adminTeam }/members/${ admin.id }`, admin.config)
        expect(res.status).toBe(204)

        res = await http.get(`/tournaments/${ hiddenTournament }`, admin.config)
        expect(res.data.teamCount).toBe(1)
    })

})

describe("delete teams", () => {

    test("prevent deleting team as non-member", async () => {
        // recreate team
        let res = await http.post(`/tournaments/${ hiddenTournament }/teams`, { name: "admin" }, admin.config)
        expect(res.status).toBe(201)
        adminTeam = res.data.id

        res = await http.delete("/teams/" + adminTeam, user1.config)
        expect(res.status).toBe(403)
    })

    test("prevent deleting team as unregistered", async () => {
        const res = await http.delete("/teams/" + playerTeam, unregistered.config)
        expect(res.status).toBe(403)
    })

    test("prevent deleting team when not logged in", async () => {
        const res = await http.delete("/teams/" + playerTeam)
        expect(res.status).toBe(401)
    })

    test("prevent deleting team as member", async () => {
        const res = await http.delete("/teams/" + playerTeam, user1.config)
        expect(res.status).toBe(403)
    })

    test("delete team as admin", async () => {
        const res = await http.delete("/teams/" + organizerTeam, admin.config)
        expect(res.status).toBe(204)
    })

    test("delete team as organizer", async () => {
        // create new team
        let res = await http.post(`/tournaments/${ readyTournament }/teams`,
            { name: "test", members: [] }, admin.config)
        const teamId = res.data.id

        res = await http.delete("/teams/" + teamId, user1.config)
        expect(res.status).toBe(204)
    })

    test("prevent deleting team when tournament has already started", async () => {
        const res = await http.delete("/teams/" + startedTeam, admin.config)
        expect(res.status).toBe(400)
    })

    test("prevent reading deleted team", async () => {
        const res = await http.get("/teams/" + organizerTeam, admin.config)
        expect(res.status).toBe(404)
    })

})
