import { http, TestUser } from "./setup"
import { AxiosBasicCredentials } from "axios"
import { User } from "@frilan/models"

// shared states
const admin: TestUser & AxiosBasicCredentials & Partial<User> = {
    id: NaN,
    username: "admin",
    displayName: "The Administrator",
    password: "secure-password",
    admin: true,
    config: {},
}
const regular: TestUser & AxiosBasicCredentials & Partial<User> = {
    id: NaN,
    username: "test",
    displayName: "Someone",
    password: "another-password",
    admin: false,
    config: {},
}

describe("create users", () => {

    test("create first administrator account", async () => {
        const res = await http.post("/users", { ...admin, admin: false })
        expect(res.status).toBe(201)
        expect(res.data).toMatchObject({
            username: admin.username,
            displayName: admin.displayName,
            admin: admin.admin,
        })
        expect(res.data).not.toHaveProperty("password")
    })

    test("login into admin account", async () => {
        const res = await http.get("/login", { auth: admin })
        expect(res.status).toBe(200)
        expect(res.data.user).toMatchObject({
            username: admin.username,
            displayName: admin.displayName,
            admin: admin.admin,
        })
        expect(typeof res.data.user.id).toBe("number")
        admin.id = res.data.user.id
        expect(typeof res.data.token).toBe("string")
        admin.config = { headers: { authorization: "Bearer " + res.data.token } }
    })

    test("create regular account", async () => {
        const res = await http.post("/users", { ...regular, admin: true })
        expect(res.data).toMatchObject({ admin: regular.admin })
        expect(res.status).toBe(201)
    })

    test("prevent duplicate usernames", async () => {
        const res = await http.post("/users", regular)
        expect(res.status).toBe(409)
    })

    test("login into regular account", async () => {
        const res = await http.get("/login", { auth: regular })
        expect(res.status).toBe(200)
        regular.id = res.data.user.id
        regular.config = { headers: { authorization: "Bearer " + res.data.token } }
    })

    test("prevent logging in with wrong password", async () => {
        const res = await http.get("/login", { auth: { username: regular.username, password: "wrong" } })
        expect(res.status).toBe(401)
    })

})

describe("read users", () => {

    test("read all users as admin", async () => {
        const res = await http.get("/users", admin.config)
        expect(res.status).toBe(200)
        expect(res.data.length).toBe(2)
        expect(res.data[1].username).toBe(regular.username)
    })

    test("read all users as regular user", async () => {
        const res = await http.get("/users", regular.config)
        expect(res.status).toBe(200)
        expect(res.data.length).toBe(2)
        expect(res.data[0].username).toBe(admin.username)
    })

    test("read single user", async () => {
        const res = await http.get("/users/" + admin.id, regular.config)
        expect(res.status).toBe(200)
        expect(res.data).toMatchObject({ username: admin.username })
    })

    test("prevent reading single user when not logged in", async () => {
        const res = await http.get("/users/" + regular.id)
        expect(res.status).toBe(401)
    })

    test("prevent reading non-existing user", async () => {
        const res = await http.get("/users/9999", admin.config)
        expect(res.status).toBe(404)
    })

})

describe("update users", () => {

    test("update current user", async () => {
        const username = "new name"
        const res = await http.patch("/users/" + regular.id, { username }, regular.config)
        expect(res.status).toBe(200)
        expect(res.data).toMatchObject({ id: regular.id, username })
        regular.username = username

        const read = await http.get("/users/" + regular.id, regular.config)
        expect(read.data).toMatchObject(res.data)
    })

    test("update password", async () => {
        const password = "new-password"
        let res = await http.patch("/users/" + regular.id, { password }, regular.config)
        expect(res.status).toBe(200)

        res = await http.get("/login", { auth: { username: regular.username, password } })
        expect(res.status).toBe(200)
    })

    test("update other user as admin", async () => {
        const username = "other name"
        const res = await http.patch("/users/" + regular.id, { username }, admin.config)
        expect(res.status).toBe(200)
        expect(res.data).toMatchObject({ id: regular.id, username })
    })

    test("prevent updating other users as regular user", async () => {
        const res = await http.patch("/users/" + admin.id, { username: "name" }, regular.config)
        expect(res.status).toBe(403)
    })

    test("change privilege as admin", async () => {
        const res = await http.patch("/users/" + regular.id, { admin: true }, admin.config)
        expect(res.status).toBe(200)
        expect(res.data).toMatchObject({ id: regular.id, admin: true })

        // reset privileges
        await http.patch("/users/" + regular.id, { admin: false }, admin.config)
    })

    test("prevent changing privilege as regular user", async () => {
        const res = await http.patch("/users/" + regular.id, { admin: true }, regular.config)
        expect(res.status).toBe(403)
    })

    test("prevent updating user when not logged in", async () => {
        const res = await http.patch("/users/" + regular.id, { username: "garbage" })
        expect(res.status).toBe(401)
    })

    test("prevent updating non-existing user", async () => {
        const res = await http.patch("/users/9999", {}, admin.config)
        expect(res.status).toBe(404)
    })

    test("prevent duplicate usernames", async () => {
        const res = await http.patch("/users/" + regular.id, { username: "admin" }, regular.config)
        expect(res.status).toBe(409)
    })

})

describe("delete users", () => {

    test("prevent deleting user as regular user", async () => {
        const res = await http.delete("/users/" + regular.id, regular.config)
        expect(res.status).toBe(403)
    })

    test("prevent deleting user when not logged in", async () => {
        const res = await http.delete("/users/" + regular.id)
        expect(res.status).toBe(401)
    })

    test("delete user as admin", async () => {
        const res = await http.delete("/users/" + regular.id, admin.config)
        expect(res.status).toBe(204)
    })

    test("prevent deleting the last admin", async () => {
        const res = await http.delete("/users/" + admin.id, admin.config)
        expect(res.status).toBe(403)
    })

    test("prevent reading deleted user", async () => {
        const res = await http.get("/users/" + regular.id, admin.config)
        expect(res.status).toBe(404)
    })

    test("prevent deleting user registered for an event", async () => {
        // recreate account
        let res = await http.post("/users", regular)
        regular.id = res.data.id

        // create event
        res = await http.post("/events",
            { name: "n", shortName: "s", start: new Date(), end: new Date() }, admin.config)
        const eventId = res.data.id

        // register user
        await http.put(`/events/${ eventId }/registrations/${ regular.id }`, {}, admin.config)

        res = await http.delete("/users/" + regular.id, admin.config)
        expect(res.status).toBe(400)
    })
})
