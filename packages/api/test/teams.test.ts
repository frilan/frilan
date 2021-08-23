import { createEvents, createUsers, http, refreshPrivilege, TestUser } from "./setup"
import { Role } from "@frilan/models"

// shared states
let admin: TestUser
let regular: TestUser
let unregistered: TestUser
let event1: number
let event2: number
let tournament1: number
let tournament2: number
let adminTeam: number
let organizerTeam: number
let playerTeam: number
let emptyTeam: number

beforeAll(async () => {
    [admin, regular, unregistered] = await createUsers(3)
    ;[event1, event2] = await createEvents(2, admin.config)

    // create tournaments
    const tournament =
        { name: "t", date: 0, duration: 1, team_size_min: 1, team_size_max: 1, team_count_min: 1, team_count_max: 8 }

    let res = await http.post(`/events/${ event1 }/tournaments`, tournament, admin.config)
    tournament1 = res.data.id
    res = await http.post(`/events/${ event2 }/tournaments`, tournament, admin.config)
    tournament2 = res.data.id

    // register users to events
    await http.put(`/events/${ event1 }/registrations/${ admin.id }`, {}, admin.config)
    await http.put(`/events/${ event1 }/registrations/${ regular.id }`, {}, admin.config)
    await http.put(`/events/${ event2 }/registrations/${ regular.id }`, { role: Role.Organizer }, admin.config)
    await refreshPrivilege(admin)
    await refreshPrivilege(regular)
})

describe("create teams", () => {

    test("create team as admin", async () => {
        const res = await http.post(`/tournaments/${ tournament1 }/teams`, { name: "admin", result: 999 }, admin.config)
        expect(res.status).toBe(201)
        expect(res.data.name).toBe("admin")
        expect(res.data.members.length).toBe(1)
        expect(res.data.members[0].username).toBe(admin.username)
        expect(res.data.tournamentId).toBe(tournament1)
        // make sure result is set to default value
        expect(res.data.result).toBe(0)
        adminTeam = res.data.id
    })

    test("create team as organizer", async () => {
        const res = await http.post(`/tournaments/${ tournament2 }/teams`, { name: "organizer" }, regular.config)
        expect(res.status).toBe(201)
        expect(res.data.tournamentId).toBe(tournament2)
        expect(res.data.members[0].username).toBe(regular.username)
        organizerTeam = res.data.id
    })

    test("create team as player", async () => {
        const res = await http.post(`/tournaments/${ tournament1 }/teams`, { name: "player" }, regular.config)
        expect(res.status).toBe(201)
        expect(res.data.members[0].username).toBe(regular.username)
        playerTeam = res.data.id
    })

    test("create empty team as unregistered admin", async () => {
        const res = await http.post(`/tournaments/${ tournament2 }/teams`, { name: "empty" }, admin.config)
        expect(res.status).toBe(201)
        expect(res.data.members.length).toBe(0)
        emptyTeam = res.data.id
    })

    test("prevent creating team as unregistered", async () => {
        const res = await http.post(`/tournaments/${ tournament1 }/teams`, { name: "garbage" }, unregistered.config)
        expect(res.status).toBe(403)
    })

    test("prevent creating team when not logged in", async () => {
        const res = await http.post(`/tournaments/${ tournament1 }/teams`, { name: "garbage" })
        expect(res.status).toBe(401)
    })

    test("prevent creating team in non-existing tournament", async () => {
        const res = await http.post("/tournaments/999/teams", { name: "garbage" }, admin.config)
        expect(res.status).toBe(404)
    })

})

describe("read teams", () => {

    test("read all teams as admin", async () => {
        let res = await http.get(`/tournaments/${ tournament1 }/teams`, admin.config)
        expect(res.status).toBe(200)
        expect(res.data.length).toBe(2)
        expect(res.data[0].name).toBe("admin")
        expect(res.data[1].name).toBe("player")

        res = await http.get(`/tournaments/${ tournament2 }/teams`, admin.config)
        expect(res.status).toBe(200)
        expect(res.data.length).toBe(2)
        expect(res.data[0].name).toBe("organizer")
        expect(res.data[1].name).toBe("empty")
    })

    test("read all teams as registered", async () => {
        const res = await http.get(`/tournaments/${ tournament2 }/teams`, regular.config)
        expect(res.status).toBe(200)
    })

    test("read all teams as unregistered", async () => {
        const res = await http.get(`/tournaments/${ tournament1 }/teams`, unregistered.config)
        expect(res.status).toBe(200)
    })

    test("prevent reading all teams when not logged in", async () => {
        const res = await http.get(`/tournaments/${ tournament1 }/teams`)
        expect(res.status).toBe(401)
    })

    test("read single team as admin", async () => {
        const res = await http.get("/teams/" + adminTeam, admin.config)
        expect(res.status).toBe(200)
        expect(res.data.name).toBe("admin")
    })

    test("read single team as registered", async () => {
        const res = await http.get("/teams/" + organizerTeam, regular.config)
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
        const res = await http.patch("/teams/" + emptyTeam, { name: "team2" }, regular.config)
        expect(res.status).toBe(200)
        expect(res.data.name).toBe("team2")
    })

    test("update team as member", async () => {
        const res = await http.patch("/teams/" + playerTeam, { name: "team3" }, regular.config)
        expect(res.status).toBe(200)
        expect(res.data.name).toBe("team3")
    })

    test("prevent updating team as non-member", async () => {
        const res = await http.patch("/teams/" + adminTeam, { name: "garbage" }, regular.config)
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
        const res = await http.put(`/teams/${ emptyTeam }/members/${ regular.id }`, {}, admin.config)
        expect(res.status).toBe(204)
    })

    test("add member as organizer", async () => {
        const res = await http.put(`/teams/${ emptyTeam }/members/${ regular.id }`, {}, regular.config)
        expect(res.status).toBe(204)
    })

    test("join team as player", async () => {
        const res = await http.put(`/teams/${ adminTeam }/members/${ regular.id }`, {}, regular.config)
        expect(res.status).toBe(204)
    })

    test("prevent adding unregistered members", async () => {
        const res = await http.put(`/teams/${ adminTeam }/members/${ unregistered.id }`, {}, admin.config)
        expect(res.status).toBe(403)
    })

    test("prevent adding other members as player", async () => {
        const res = await http.put(`/teams/${ adminTeam }/members/${ admin.id }`, {}, regular.config)
        expect(res.status).toBe(403)
    })

    test("prevent joining team as unregistered", async () => {
        const res = await http.put(`/teams/${ adminTeam }/members/${ unregistered.id }`, {}, unregistered.config)
        expect(res.status).toBe(403)
    })

    test("prevent adding member when not logged in", async () => {
        const res = await http.put(`/teams/${ adminTeam }/members/${ regular.id }`, {})
        expect(res.status).toBe(401)
    })

    test("prevent adding non-existing member", async () => {
        const res = await http.put(`/teams/${ adminTeam }/members/999`, {}, admin.config)
        expect(res.status).toBe(404)
    })

})

describe("read team members", () => {

    test("read members as admin", async () => {
        const res = await http.get(`/teams/${ emptyTeam }/members`, admin.config)
        expect(res.status).toBe(200)
        expect(res.data.length).toBe(1)
        expect(res.data[0].username).toBe(regular.username)
    })

    test("read members as registered", async () => {
        const res = await http.get(`/teams/${ adminTeam }/members`, regular.config)
        expect(res.status).toBe(200)
        expect(res.data.length).toBe(2)
        expect(res.data[0].username).toBe(admin.username)
    })

    test("read members as unregistered", async () => {
        const res = await http.get(`/teams/${ playerTeam }/members`, unregistered.config)
        expect(res.status).toBe(200)
        expect(res.data.length).toBe(1)
        expect(res.data[0].username).toBe(regular.username)
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
        const res = await http.delete(`/teams/${ emptyTeam }/members/${ regular.id }`, admin.config)
        expect(res.status).toBe(204)
    })

    test("delete empty team after removing member", async () => {
        const res = await http.get(`/teams/${ emptyTeam }`, admin.config)
        expect(res.status).toBe(404)
    })

    test("remove member as organizer", async () => {
        // create new team
        let res = await http.post(`/tournaments/${ tournament2 }/teams`, { name: "test" }, admin.config)
        const teamId = res.data.id

        res = await http.delete(`/teams/${ teamId }/members/${ regular.id }`, regular.config)
        expect(res.status).toBe(204)
    })

    test("leaving team as member", async () => {
        const res = await http.delete(`/teams/${ adminTeam }/members/${ regular.id }`, regular.config)
        expect(res.status).toBe(204)
    })

    test("prevent removing other members as player", async () => {
        const res = await http.delete(`/teams/${ adminTeam }/members/${ admin.id }`, regular.config)
        expect(res.status).toBe(403)
    })

    test("prevent removing member when not logged in", async () => {
        const res = await http.delete(`/teams/${ playerTeam }/members/${ regular.id }`)
        expect(res.status).toBe(401)
    })

    test("prevent reading non-existing member", async () => {
        const res = await http.get(`/teams/${ adminTeam }/members`, admin.config)
        expect(res.status).toBe(200)
        expect(res.data.length).toBe(1)
        expect(res.data[0].username).not.toBe(regular.username)
    })

})

describe("delete teams", () => {

    test("prevent deleting team as non-member", async () => {
        const res = await http.delete("/teams/" + adminTeam, regular.config)
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
        const res = await http.delete("/teams/" + playerTeam, regular.config)
        expect(res.status).toBe(403)
    })

    test("delete team as admin", async () => {
        const res = await http.delete("/teams/" + organizerTeam, admin.config)
        expect(res.status).toBe(204)
    })

    test("delete team as organizer", async () => {
        // create new team
        let res = await http.post(`/tournaments/${ tournament2 }/teams`, { name: "test" }, admin.config)
        const teamId = res.data.id

        res = await http.delete("/teams/" + teamId, regular.config)
        expect(res.status).toBe(204)
    })

    test("prevent reading deleted team", async () => {
        const res = await http.get("/teams/" + organizerTeam, admin.config)
        expect(res.status).toBe(404)
    })

})
