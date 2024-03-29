import { createEvents, createUsers, http, refreshPrivilege, TestUser } from "./setup"
import { Role, Status } from "@frilan/models"

// shared states
let admin: TestUser
let regular: TestUser
let event1: number
let event2: number

beforeAll(async () => {
    [admin, regular] = await createUsers(2)
    ;[event1, event2] = await createEvents(2, admin.config)
})

describe("register users to events", () => {

    test("prevent users from registering themselves", async () => {
        const res = await http.put(`/events/${ event1 }/registrations/${ regular.id }`, {}, regular.config)
        expect(res.status).toBe(403)
    })

    test("register another user by admin", async () => {
        const res = await http.put(`/events/${ event1 }/registrations/${ regular.id }`,
            { score: 100, arrival: new Date(0), departure: new Date(999) }, admin.config)

        expect(res.status).toBe(200)
        expect(res.data.role).toBe(Role.Player)
        expect(res.data.arrival).toBe(new Date(0).toISOString())
        expect(res.data.departure).toBe(new Date(999).toISOString())
        // make sure score is set to default value
        expect(res.data.score).toBe(0)
    })

    test("prevent registering another user by regular user", async () => {
        const res = await http.put(`/events/${ event1 }/registrations/${ admin.id }`, {}, regular.config)
        expect(res.status).toBe(403)
    })

    test("register an organizer by admin", async () => {
        const res = await http.put(`/events/${ event1 }/registrations/${ regular.id }`,
            { role: Role.Organizer }, admin.config)
        expect(res.status).toBe(200)
        expect(res.data.role).toBe(Role.Organizer)
    })

    test("register another user by organizer", async () => {
        await refreshPrivilege(regular)
        const res = await http.put(`/events/${ event1 }/registrations/${ admin.id }`, {}, regular.config)
        expect(res.status).toBe(200)
    })

    test("prevent organizers from defining roles", async () => {
        let res = await http.put(`/events/${ event1 }/registrations/${ regular.id }`,
            { role: Role.Player }, regular.config)
        expect(res.status).toBe(403)

        res = await http.put(`/events/${ event1 }/registrations/${ admin.id }`,
            { role: Role.Organizer }, regular.config)
        expect(res.status).toBe(403)
    })

    test("prevent registering a user when not logged in", async () => {
        const res = await http.put(`/events/${ event1 }/registrations/${ admin.id }`)
        expect(res.status).toBe(401)
    })

    test("prevent registering a non-existing user", async () => {
        const res = await http.put(`/events/${ event1 }/registrations/999`, {}, admin.config)
        expect(res.status).toBe(404)
    })

    test("prevent registering a user to a non-existing event", async () => {
        const res = await http.put(`/events/999/registrations/${ regular.id }`, {}, admin.config)
        expect(res.status).toBe(404)
    })

    test("prevent departure earlier than arrival", async () => {
        const res = await http.put(`/events/${ event1 }/registrations/${ regular.id }`,
            { arrival: 10, departure: 5 }, admin.config)
        expect(res.status).toBe(400)
    })

})

describe("read registrations", () => {

    test("read all registrations by admin", async () => {
        // create some registrations
        await http.put(`/events/${ event1 }/registrations/${ admin.id }`, {}, admin.config)
        await http.put(`/events/${ event2 }/registrations/${ admin.id }`, {}, admin.config)

        let res = await http.get(`/events/${ event1 }/registrations`, admin.config)
        expect(res.status).toBe(200)
        expect(res.data.length).toBe(2)
        expect(res.data[0].eventId).toBe(event1)
        expect(res.data[0].userId).toBe(regular.id)

        res = await http.get(`/events/${ event2 }/registrations`, admin.config)
        expect(res.status).toBe(200)
        expect(res.data.length).toBe(1)
        expect(res.data[0].eventId).toBe(event2)
        expect(res.data[0].userId).toBe(admin.id)
    })

    test("read all registrations by registered", async () => {
        const res = await http.get(`/events/${ event1 }/registrations`, regular.config)
        expect(res.status).toBe(200)
    })

    test("read all registrations by unregistered", async () => {
        const res = await http.get(`/events/${ event2 }/registrations`, regular.config)
        expect(res.status).toBe(200)
    })

    test("prevent reading all registrations when not logged in", async () => {
        const res = await http.get(`/events/${ event2 }/registrations`)
        expect(res.status).toBe(401)
    })

    test("read single registration by admin", async () => {
        const res = await http.get(`/events/${ event1 }/registrations/${ regular.id }`, admin.config)
        expect(res.status).toBe(200)
        expect(res.data.userId).toBe(regular.id)
    })

    test("read single registration by registered", async () => {
        const res = await http.get(`/events/${ event1 }/registrations/${ admin.id }`, regular.config)
        expect(res.status).toBe(200)
        expect(res.data.userId).toBe(admin.id)
    })

    test("read single registration by unregistered", async () => {
        const res = await http.get(`/events/${ event2 }/registrations/${ admin.id }`, regular.config)
        expect(res.status).toBe(200)
    })

    test("prevent reading single registration when not logged in", async () => {
        const res = await http.get(`/events/${ event2 }/registrations/${ admin.id }`)
        expect(res.status).toBe(401)
    })

    test("prevent reading registrations from unregistered user", async () => {
        const res = await http.get(`/events/${ event2 }/registrations/${ regular.id }`, admin.config)
        expect(res.status).toBe(404)
    })

})

describe("unregister users from events", () => {

    test("unregister user by admin", async () => {
        // register again
        await http.put(`/events/${ event1 }/registrations/${ regular.id }`, {}, admin.config)

        const res = await http.delete(`/events/${ event1 }/registrations/${ regular.id }`, admin.config)
        expect(res.status).toBe(204)
    })

    test("unregister user by organizer", async () => {
        const res = await http.delete(`/events/${ event1 }/registrations/${ admin.id }`, regular.config)
        expect(res.status).toBe(204)
    })

    test("prevent reading deleted registration", async () => {
        const res = await http.get(`/events/${ event1 }/registrations/${ regular.id }`, admin.config)
        expect(res.status).toBe(404)
    })

    test("prevent unregistering users by regular user", async () => {
        // register again
        await http.put(`/events/${ event1 }/registrations/${ regular.id }`, {}, admin.config)
        await http.put(`/events/${ event1 }/registrations/${ admin.id }`, {}, admin.config)
        await refreshPrivilege(regular)

        let res = await http.delete(`/events/${ event1 }/registrations/${ regular.id }`, regular.config)
        expect(res.status).toBe(403)

        res = await http.delete(`/events/${ event1 }/registrations/${ admin.id }`, regular.config)
        expect(res.status).toBe(403)
    })

    test("prevent unregistering users when not logged in", async () => {
        const res = await http.delete(`/events/${ event1 }/registrations/${ admin.id }`)
        expect(res.status).toBe(401)
    })

    test("prevent unregistering when one tournament has started", async () => {
        // register again
        await http.put(`/events/${ event1 }/registrations/${ regular.id }`, {}, admin.config)

        // create tournament
        const tournament = {
            name: "foo",
            shortName: "f",
            date: 5,
            duration: 1,
            teamSizeMin: 1,
            teamSizeMax: 1,
            teamCountMin: 2,
            teamCountMax: 8,
            status: Status.Ready,
        }
        let res = await http.post(`/events/${ event1 }/tournaments`, tournament, admin.config)
        const tournamentId = res.data.id

        // create teams
        await http.post(`/tournaments/${ tournamentId }/teams`,
            { name: "regular", members: [{ userId: regular.id }] }, admin.config)
        await http.post(`/tournaments/${ tournamentId }/teams`,
            { name: "admin", members: [{ userId: admin.id }] }, admin.config)

        // start tournament
        await http.patch(`/tournaments/${ tournamentId }`, { status: Status.Started }, admin.config)

        res = await http.delete(`/events/${ event1 }/registrations/${ regular.id }`, admin.config)
        expect(res.status).toBe(400)
    })

})
