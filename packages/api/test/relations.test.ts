import { createEvents, createUsers, http, refreshPrivilege, TestUser } from "./setup"
import { Role } from "@frilan/models"

// shared states
let user: TestUser

beforeAll(async () => {
    [user] = await createUsers(1)
    const eventId = await createEvents(1, user.config)

    // register user to event
    await http.put(`/events/${ eventId }/registrations/${ user.id }`, { role: Role.Organizer }, user.config)
    await refreshPrivilege(user)

    // create tournament
    const tournament =
        { name: "foo", date: 0, duration: 1, team_size_min: 1, team_size_max: 1, team_count_min: 1, team_count_max: 8 }
    const res = await http.post(`/events/${ eventId }/tournaments`, tournament, user.config)
    const tournamentId = res.data.id

    //create team
    await http.post(`/tournaments/${ tournamentId }/teams`, { name: "bar" }, user.config)
})

describe("load relations", () => {

    test("load single relation", async () => {
        const res = await http.get(`/users/${ user.id }?load=registrations`, user.config)
        expect(res.status).toBe(200)
        expect(res.data.registrations[0].role).toBe(Role.Organizer)
    })

    test("load multiple relations", async () => {
        const res = await http.get(`/users/${ user.id }?load=registrations,teams`, user.config)
        expect(res.status).toBe(200)
        expect(res.data.teams[0].name).toBe("bar")
    })

    test("load relations with multiples parameters", async () => {
        const res = await http.get(`/users/${ user.id }?load=registrations&load=teams`, user.config)
        expect(res.status).toBe(200)
        expect(res.data.teams[0].name).toBe("bar")
    })

    test("load nested relations", async () => {
        const res = await http.get(`/users/${ user.id }?load=registrations,registrations.event`, user.config)
        expect(res.status).toBe(200)
        expect(res.data.registrations[0].role).toBe(Role.Organizer)
        expect(res.data.registrations[0].event.name).toBe("event-0")
    })

    test("load deeply nested relations", async () => {
        const res = await http.get(`/users/${ user.id }?load=teams,teams.tournament,teams.tournament.event`, user.config)
        expect(res.status).toBe(200)
        expect(res.data.teams[0].name).toBe("bar")
        expect(res.data.teams[0].tournament.name).toBe("foo")
        expect(res.data.teams[0].tournament.event.name).toBe("event-0")
    })

    test("prevent loading non-existing relations", async () => {
        const res = await http.get(`/users/${ user.id }?load=garbage`, user.config)
        expect(res.status).toBe(400)
    })

})
