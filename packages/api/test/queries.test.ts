import { createEvents, createUsers, http, refreshPrivilege, TestUser } from "./setup"
import { Role } from "@frilan/models"

// shared states
let admin: TestUser
let regular: TestUser
let other: TestUser
let eventId: number

beforeAll(async () => {
    [admin, regular, other] = await createUsers(4)
    ;[eventId] = await createEvents(1, admin.config)

    // register user to event
    await http.put(`/events/${ eventId }/registrations/${ admin.id }`, { role: Role.Organizer }, admin.config)
    await refreshPrivilege(admin)

    // create tournament
    const tournament =
        { name: "foo", date: 5, duration: 1, team_size_min: 1, team_size_max: 1, team_count_min: 1, team_count_max: 8 }
    const res = await http.post(`/events/${ eventId }/tournaments`, tournament, admin.config)
    const tournamentId = res.data.id

    //create team
    await http.post(`/tournaments/${ tournamentId }/teams`, { name: "bar" }, admin.config)
})

describe("load relations", () => {

    test("load single relation", async () => {
        const res = await http.get(`/users/${ admin.id }?load=registrations`, admin.config)
        expect(res.status).toBe(200)
        expect(res.data.registrations[0].role).toBe(Role.Organizer)
    })

    test("load multiple relations", async () => {
        const res = await http.get(`/users/${ admin.id }?load=registrations,teams`, admin.config)
        expect(res.status).toBe(200)
        expect(res.data.teams[0].name).toBe("bar")
    })

    test("load relations with multiples parameters", async () => {
        const res = await http.get(`/users/${ admin.id }?load=registrations&load=teams`, admin.config)
        expect(res.status).toBe(200)
        expect(res.data.teams[0].name).toBe("bar")
    })

    test("load nested relations", async () => {
        const res = await http.get(`/users/${ admin.id }?load=registrations,registrations.event`, admin.config)
        expect(res.status).toBe(200)
        expect(res.data.registrations[0].role).toBe(Role.Organizer)
        expect(res.data.registrations[0].event.name).toBe("event-0")
    })

    test("load deeply nested relations", async () => {
        const res = await http.get(`/users/${ admin.id }?load=teams,teams.tournament,teams.tournament.event`, admin.config)
        expect(res.status).toBe(200)
        expect(res.data.teams[0].name).toBe("bar")
        expect(res.data.teams[0].tournament.name).toBe("foo")
        expect(res.data.teams[0].tournament.event.name).toBe("event-0")
    })

    test("prevent loading non-existing relations", async () => {
        const res = await http.get(`/users/${ admin.id }?load=garbage`, admin.config)
        expect(res.status).toBe(400)
    })

})

describe("filter results", () => {

    test("filter single field", async () => {
        const res = await http.get(`/users?username=${ regular.username }`, admin.config)
        expect(res.status).toBe(200)
        expect(res.data.length).toBe(1)
        expect(res.data[0].id).toBe(regular.id)
    })

    test("filter multiple fields", async () => {
        const res = await http.get(`/users?username=${ admin.username }&displayName=test`, admin.config)
        expect(res.status).toBe(200)
        expect(res.data.length).toBe(1)
        expect(res.data[0].id).toBe(admin.id)
    })

    test("filter with multiple values", async () => {
        const res = await http.get(`/users?username=${ regular.username },${ admin.username }`, admin.config)
        expect(res.status).toBe(200)
        expect(res.data.length).toBe(2)
    })

    test("filter with multiple parameters", async () => {
        const res = await http.get(`/users?id=${ regular.id }&id=${ admin.id },${ other.id }`, admin.config)
        expect(res.status).toBe(200)
        expect(res.data.length).toBe(3)
    })

    test("prevent filtering on non-existing field", async () => {
        const res = await http.get("/users?garbage=3", admin.config)
        expect(res.status).toBe(400)
    })

    test("prevent filtering with invalid values", async () => {
        const res = await http.get(`/events/${ eventId }/registrations?userId=garbage`, admin.config)
        expect(res.status).toBe(400)
    })

})
