import { createEvents, createUsers, http, refreshPrivilege, TestUser } from "./setup"
import { Role, Status } from "@frilan/models"

// shared states
let admin: TestUser
let regular: TestUser
let event1: number
let event2: number

const tournament1 = {
    id: NaN,
    name: "League Of Legends",
    date: new Date("2022-03-12T14:00").toISOString(),
    duration: 120,
    rules: "5v5 matches, best of 3",
    team_size_min: 5,
    team_size_max: 6,
    team_count_min: 4,
    team_count_max: 16,
    status: Status.Ready,
}

const tournament2 = { ...tournament1 }

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
        await http.post(`/events/${ event1 }/tournaments`, tournament2, admin.config)

        let res = await http.get(`/events/${ event1 }/tournaments`, admin.config)
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

    test("prevent reading all tournaments as unregistered", async () => {
        const res = await http.get(`/events/${ event1 }/tournaments`, regular.config)
        expect(res.status).toBe(403)
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

    test("prevent reading single tournament as unregistered", async () => {
        const res = await http.get("/tournaments/" + tournament1.id, regular.config)
        expect(res.status).toBe(403)
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

    test("prevent creating tournament as unregistered", async () => {
        const res = await http.post(`/events/${ event1 }/tournaments`, tournament2, regular.config)
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

})

describe("delete tournaments", () => {

    test("prevent deleting tournament as player", async () => {
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
