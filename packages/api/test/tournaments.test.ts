import { createEvents, createUsers, http, refreshPrivilege, TestUser } from "./setup"
import { Role, Status } from "@frilan/models"

// shared states
let admin: TestUser
let regular: TestUser
let event1: number
let event2: number
let team1: number
let team2: number
let team3: number
let team4: number

const tournament1 = {
    id: NaN,
    name: "League Of Legends",
    date: new Date(5).toISOString(),
    duration: 120,
    rules: "5v5 matches, best of 3",
    team_size_min: 1,
    team_size_max: 6,
    team_count_min: 2,
    team_count_max: 16,
    status: Status.Ready,
}

const tournament2 = { ...tournament1, status: Status.Hidden }
const tournament3 = { ...tournament2 }

beforeAll(async () => {
    [admin, regular] = await createUsers(2)
    ;[event1, event2] = await createEvents(2, admin.config)

    // register users to events
    await http.put(`/events/${ event1 }/registrations/${ admin.id }`, {}, admin.config)
    await http.put(`/events/${ event1 }/registrations/${ regular.id }`, {}, admin.config)
    await http.put(`/events/${ event2 }/registrations/${ regular.id }`, { role: Role.Organizer }, admin.config)
    await refreshPrivilege(regular)
})

describe("create tournaments", () => {

    test("create tournament as admin", async () => {
        const res = await http.post(`/events/${ event1 }/tournaments`, tournament1, admin.config)
        expect(res.status).toBe(201)
        tournament1.id = res.data.id
        expect(res.data).toMatchObject(tournament1)
    })

    test("create tournament as organizer", async () => {
        const res = await http.post(`/events/${ event2 }/tournaments`, tournament2, regular.config)
        expect(res.status).toBe(201)
        tournament2.id = res.data.id
        expect(res.data).toMatchObject(tournament2)
    })

    test("prevent creating tournament earlier than event start", async () => {
        const res = await http.post(`/events/${ event1 }/tournaments`, { ...tournament1, date: 0 }, admin.config)
        expect(res.status).toBe(400)
    })

    test("prevent creating tournament later than event end", async () => {
        const res = await http.post(`/events/${ event1 }/tournaments`, { ...tournament1, date: 20 }, admin.config)
        expect(res.status).toBe(400)
    })

    test("prevent creating tournament with single team", async () => {
        const res = await http.post(`/events/${ event1 }/tournaments`,
            { ...tournament1, team_count_min: 1, team_count_max: 1 }, admin.config)
        expect(res.status).toBe(400)
    })

    test("prevent creating tournament with maximum teams lower than minimum", async () => {
        const res = await http.post(`/events/${ event1 }/tournaments`,
            { ...tournament1, team_count_min: 2, team_count_max: 1 }, admin.config)
        expect(res.status).toBe(400)
    })

    test("prevent creating tournament with maximum teams size lower than minimum", async () => {
        const res = await http.post(`/events/${ event1 }/tournaments`,
            { ...tournament1, team_size_min: 2, team_size_max: 1 }, admin.config)
        expect(res.status).toBe(400)
    })

    test("prevent creating tournament that has already started", async () => {
        let res = await http.post(`/events/${ event1 }/tournaments`,
            { ...tournament1, status: Status.Started }, admin.config)
        expect(res.status).toBe(400)

        res = await http.post(`/events/${ event1 }/tournaments`,
            { ...tournament1, status: Status.Finished }, admin.config)
        expect(res.status).toBe(400)
    })

    test("prevent creating tournament as player", async () => {
        const res = await http.post(`/events/${ event1 }/tournaments`, tournament2, regular.config)
        expect(res.status).toBe(403)
    })

    test("prevent creating tournament as unregistered", async () => {
        // unregister user from event1
        await http.delete(`/events/${ event1 }/registrations/${ regular.id }`, admin.config)
        await refreshPrivilege(regular)

        const res = await http.post(`/events/${ event1 }/tournaments`, tournament2, regular.config)
        expect(res.status).toBe(403)
    })

    test("prevent creating tournament when not logged in", async () => {
        const res = await http.post(`/events/${ event2 }/tournaments`, tournament1)
        expect(res.status).toBe(401)
    })

    test("prevent creating tournament in non-existing event", async () => {
        const res = await http.post("/events/999/tournaments", tournament2, admin.config)
        expect(res.status).toBe(404)
    })

})

describe("read tournaments", () => {

    test("read all tournaments as admin", async () => {
        // create one more tournament
        let res = await http.post(`/events/${ event1 }/tournaments`, tournament2, admin.config)
        tournament3.id = res.data.id

        res = await http.get(`/events/${ event1 }/tournaments`, admin.config)
        expect(res.status).toBe(200)
        expect(res.data.length).toBe(2)
        expect(res.data[0]).toMatchObject(tournament1)

        res = await http.get(`/events/${ event2 }/tournaments`, admin.config)
        expect(res.status).toBe(200)
        expect(res.data.length).toBe(1)
        expect(res.data[0]).toMatchObject(tournament2)
    })

    test("read all tournaments as registered", async () => {
        const res = await http.get(`/events/${ event2 }/tournaments`, regular.config)
        expect(res.status).toBe(200)
    })

    test("read all tournaments as unregistered", async () => {
        const res = await http.get(`/events/${ event1 }/tournaments`, regular.config)
        expect(res.status).toBe(200)
        expect(res.data.length).toBe(1) // no hidden tournament
    })

    test("prevent reading all tournaments when not logged in", async () => {
        const res = await http.get(`/events/${ event1 }/tournaments`)
        expect(res.status).toBe(401)
    })

    test("read single tournament as admin", async () => {
        const res = await http.get("/tournaments/" + tournament1.id, admin.config)
        expect(res.status).toBe(200)
        expect(res.data).toMatchObject(tournament1)
        expect(res.data.eventId).toBe(event1)
    })

    test("read single tournament as registered", async () => {
        const res = await http.get("/tournaments/" + tournament2.id, regular.config)
        expect(res.status).toBe(200)
        expect(res.data).toMatchObject(tournament2)
        expect(res.data.eventId).toBe(event2)
    })

    test("read single tournament as unregistered", async () => {
        const res = await http.get("/tournaments/" + tournament1.id, regular.config)
        expect(res.status).toBe(200)
    })

    test("prevent reading hidden tournament as player", async () => {
        const res = await http.get("/tournaments/" + tournament3.id, regular.config)
        expect(res.status).toBe(404)
    })

    test("prevent reading single tournament when not logged in", async () => {
        const res = await http.get("/tournaments/" + tournament1.id)
        expect(res.status).toBe(401)
    })

    test("prevent reading non-existing tournament", async () => {
        const res = await http.get("/tournaments/999", admin.config)
        expect(res.status).toBe(404)
    })

})

describe("update tournaments", () => {

    test("update tournament as admin", async () => {
        tournament1.name = "Overwatch"
        const res = await http.patch("/tournaments/" + tournament1.id, tournament1, admin.config)
        expect(res.status).toBe(200)
        expect(res.data).toMatchObject(tournament1)
    })

    test("update tournament as organizer", async () => {
        tournament2.name = "Rocket League"
        const res = await http.patch("/tournaments/" + tournament2.id, tournament2, regular.config)
        expect(res.status).toBe(200)
        expect(res.data).toMatchObject(tournament2)
    })

    test("prevent updating tournament as unregistered", async () => {
        const res = await http.patch("/tournaments/" + tournament1.id, { name: "Garbage" }, regular.config)
        expect(res.status).toBe(403)
    })

    test("prevent updating tournament as player", async () => {
        // register user to event1
        await http.put(`/events/${ event1 }/registrations/${ regular.id }`, admin.config)
        await refreshPrivilege(regular)

        const res = await http.patch("/tournaments/" + tournament1.id, { name: "Garbage" }, regular.config)
        expect(res.status).toBe(403)
    })

    test("prevent updating tournament when not logged in", async () => {
        const res = await http.patch("/tournaments/" + tournament1.id, { name: "Garbage" })
        expect(res.status).toBe(401)
    })

    test("prevent updating non-existing tournament", async () => {
        const res = await http.patch("/tournaments/999", { name: "Garbage" }, admin.config)
        expect(res.status).toBe(404)
    })

    test("prevent starting tournament without enough teams", async () => {
        const res = await http.patch("/tournaments/" + tournament1.id, { status: Status.Started }, admin.config)
        expect(res.status).toBe(400)
    })

    test("start tournament as admin", async () => {
        // register user to event
        await http.put(`/events/${ event1 }/registrations/${ regular.id }`, { role: Role.Organizer }, admin.config)
        await refreshPrivilege(regular)

        // add teams to tournament
        let res = await http.post(`/tournaments/${ tournament1.id }/teams`, { name: "team 1" }, admin.config)
        team1 = res.data.id
        res = await http.post(`/tournaments/${ tournament1.id }/teams`, { name: "team 2" }, regular.config)
        team2 = res.data.id

        res = await http.patch("/tournaments/" + tournament1.id, { status: Status.Started }, admin.config)
        expect(res.status).toBe(200)
    })

    test("start tournament as organizer", async () => {
        // add teams to tournament
        let res = await http.post(`/tournaments/${ tournament3.id }/teams`, { name: "team 3" }, admin.config)
        team3 = res.data.id
        res = await http.post(`/tournaments/${ tournament3.id }/teams`, { name: "team 4" }, regular.config)
        team4 = res.data.id

        res = await http.patch("/tournaments/" + tournament3.id, { status: Status.Ready }, regular.config)
        expect(res.status).toBe(200)
        res = await http.patch("/tournaments/" + tournament3.id, { status: Status.Started }, regular.config)
        expect(res.status).toBe(200)
    })

    test("prevent starting tournament that is not ready", async () => {
        const res = await http.patch("/tournaments/" + tournament2.id, { status: Status.Started }, admin.config)
        expect(res.status).toBe(400)
    })

    test("prevent hiding tournament that has started", async () => {
        const res = await http.patch("/tournaments/" + tournament1.id, { status: Status.Hidden }, admin.config)
        expect(res.status).toBe(400)
    })

})

describe("end tournaments", () => {

    test("prevent ending tournament that hasn't started", async () => {
        // try ending the tournament
        const res = await http.post(`/tournaments/${ tournament2.id }/end`,
            { ranks: [team2, team1], points: 100, distribution: "exponential" }, admin.config)
        expect(res.status).toBe(400)
    })

    test("end tournament as admin", async () => {
        // end tournament and update scores
        let res = await http.post(`/tournaments/${ tournament1.id }/end`,
            { ranks: [team2, team1], points: 100, distribution: "exponential" }, admin.config)
        expect(res.status).toBe(200)

        // check scores
        res = await http.get(`/teams/${ team1 }`, admin.config)
        expect(res.data.result).toBe(15)
        res = await http.get(`/teams/${ team2 }`, admin.config)
        expect(res.data.result).toBe(184)

        res = await http.get(`/events/${ event1 }/registrations/${ admin.id }`, admin.config)
        expect(res.data.score).toBe(15)
        res = await http.get(`/events/${ event1 }/registrations/${ regular.id }`, regular.config)
        expect(res.data.score).toBe(184)
    })

    test("end tournament as organizer", async () => {
        // end tournament and update scores
        let res = await http.post(`/tournaments/${ tournament3.id }/end`,
            { ranks: [[team4, team3]], points: 50, distribution: "exponential" }, regular.config)
        expect(res.status).toBe(200)

        // check scores
        res = await http.get(`/teams/${ team3 }`, admin.config)
        expect(res.data.result).toBe(50)
        res = await http.get(`/teams/${ team4 }`, admin.config)
        expect(res.data.result).toBe(50)

        res = await http.get(`/events/${ event1 }/registrations/${ admin.id }`, admin.config)
        expect(res.data.score).toBe(15 + 50)
        res = await http.get(`/events/${ event1 }/registrations/${ regular.id }`, regular.config)
        expect(res.data.score).toBe(184 + 50)
    })

    test("overwrite ranks and scores", async () => {
        let res = await http.post(`/tournaments/${ tournament1.id }/end`,
            { ranks: [team1, team2], points: 75, distribution: "exponential" }, admin.config)
        expect(res.status).toBe(200)

        // check scores
        res = await http.get(`/teams/${ team1 }`, admin.config)
        expect(res.data.result).toBe(138)
        res = await http.get(`/teams/${ team2 }`, admin.config)
        expect(res.data.result).toBe(11)

        res = await http.get(`/events/${ event1 }/registrations/${ admin.id }`, admin.config)
        expect(res.data.score).toBe(138 + 50)
        res = await http.get(`/events/${ event1 }/registrations/${ regular.id }`, regular.config)
        expect(res.data.score).toBe(11 + 50)
    })

    test("prevent missing teams in ranking", async () => {
        const res = await http.post(`/tournaments/${ tournament1.id }/end`,
            { ranks: [team2], points: 100, distribution: "exponential" }, admin.config)
        expect(res.status).toBe(400)
    })

    test("prevent ending tournament as player", async () => {
        // update role
        await http.put(`/events/${ event1 }/registrations/${ regular.id }`, { role: Role.Player }, admin.config)
        await refreshPrivilege(regular)

        const res = await http.post(`/tournaments/${ tournament1.id }/end`,
            { ranks: [team1, team2], points: 100, distribution: "exponential" }, regular.config)
        expect(res.status).toBe(403)
    })

    test("prevent ending tournament when not logged in", async () => {
        const res = await http.post(`/tournaments/${ tournament1.id }/end`,
            { ranks: [team1, team2], points: 100, distribution: "exponential" })
        expect(res.status).toBe(401)
    })

    test("prevent ending non-existing tournament", async () => {
        const res = await http.post("/tournaments/999/end",
            { ranks: [team1, team2], points: 100, distribution: "exponential" }, admin.config)
        expect(res.status).toBe(404)
    })

})

describe("delete tournaments", () => {

    test("prevent deleting tournament as player", async () => {
        // update role
        await http.put(`/events/${ event1 }/registrations/${ regular.id }`, { role: Role.Player }, admin.config)
        await refreshPrivilege(regular)

        const res = await http.delete("/tournaments/" + tournament1.id, regular.config)
        expect(res.status).toBe(403)
    })

    test("prevent deleting tournament as unregistered", async () => {
        // unregister user from event1
        await http.delete(`/events/${ event1 }/registrations/${ regular.id }`, admin.config)
        await refreshPrivilege(regular)

        const res = await http.delete("/tournaments/" + tournament1.id, regular.config)
        expect(res.status).toBe(403)
    })

    test("prevent updating tournament when not logged in", async () => {
        const res = await http.delete("/tournaments/" + tournament1.id)
        expect(res.status).toBe(401)
    })

    test("delete tournament as admin", async () => {
        const res = await http.delete("/tournaments/" + tournament1.id, admin.config)
        expect(res.status).toBe(204)
    })

    test("delete tournament as organizer", async () => {
        const res = await http.delete("/tournaments/" + tournament2.id, regular.config)
        expect(res.status).toBe(204)
    })

    test("prevent reading deleted tournament", async () => {
        const res = await http.get("/tournaments/" + tournament1.id, admin.config)
        expect(res.status).toBe(404)
    })

})
