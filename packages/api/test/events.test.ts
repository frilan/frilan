import { createUsers, http, refreshPrivilege, TestUser } from "./setup"

// shared states
let admin: TestUser
let regular: TestUser

const event = {
    id: NaN,
    name: "FriLAN 2022",
    start: new Date("2022-03-11T16:00").toISOString(),
    end: new Date("2022-03-13T20:00").toISOString(),
}

beforeAll(async () => [admin, regular] = await createUsers(2))

describe("create events", () => {

    test("create event as admin", async () => {
        const res = await http.post("/events", event, admin.config)
        expect(res.status).toBe(201)
        event.id = res.data.id
        expect(res.data).toMatchObject(event)
    })

    test("prevent creating event without privilege", async () => {
        let res = await http.post("/events", event, regular.config)
        expect(res.status).toBe(403)
        res = await http.post("/events", event)
        expect(res.status).toBe(401)
    })

})

describe("read events", () => {

    test("read all events as admin", async () => {
        const res = await http.get("/events", admin.config)
        expect(res.status).toBe(200)
        expect(res.data).toMatchObject([event])
    })

    test("prevent reading all events without privilege", async () => {
        let res = await http.get("/events", regular.config)
        expect(res.status).toBe(403)
        res = await http.post("/events")
        expect(res.status).toBe(401)
    })

    test("read single event as admin", async () => {
        const res = await http.get("/events/" + event.id, admin.config)
        expect(res.status).toBe(200)
        expect(res.data).toMatchObject(event)
    })

    test("prevent reading single event as unregistered", async () => {
        const res = await http.get("/events/" + event.id, regular.config)
        expect(res.status).toBe(403)
    })

    test("read single event as registered", async () => {
        // register regular user
        await http.put(`/events/${ event.id }/registrations/${ regular.id }`, {}, admin.config)
        await refreshPrivilege(regular)

        const res = await http.get("/events/" + event.id, regular.config)
        expect(res.status).toBe(200)
        expect(res.data).toMatchObject(event)
    })

    test("prevent reading single event when not logged in", async () => {
        const res = await http.get("/events/" + event.id)
        expect(res.status).toBe(401)
    })

    test("prevent reading non-existing event", async () => {
        const res = await http.get("/events/9999", admin.config)
        expect(res.status).toBe(404)
    })

})

describe("update events", () => {

    test("update event as admin", async () => {
        event.name = "FriLAN 3"
        const res = await http.patch("/events/" + event.id, event, admin.config)
        expect(res.status).toBe(200)
        expect(res.data).toMatchObject(event)
    })

    test("prevent updating event without privilege", async () => {
        let res = await http.patch("/events/" + event.id, event, regular.config)
        expect(res.status).toBe(403)
        res = await http.patch("/events/" + event.id, event)
        expect(res.status).toBe(401)
    })

    test("prevent updating non-existing event", async () => {
        const res = await http.patch("/events/9999", event, admin.config)
        expect(res.status).toBe(404)
    })

})

describe("delete events", () => {

    test("prevent deleting event without privilege", async () => {
        let res = await http.delete("/events/" + event.id, regular.config)
        expect(res.status).toBe(403)
        res = await http.delete("/events/" + event.id)
        expect(res.status).toBe(401)
    })

    test("delete event as admin", async () => {
        const res = await http.delete("/events/" + event.id, admin.config)
        expect(res.status).toBe(204)
    })

    test("prevent reading deleted event", async () => {
        const res = await http.get("/events/" + event.id, admin.config)
        expect(res.status).toBe(404)
    })

})
