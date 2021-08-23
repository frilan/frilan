import { http } from "./setup"
import { AxiosRequestConfig } from "axios"

// shared states
const admin = {
    id: NaN,
    username: "admin",
    displayName: "The Administrator",
    password: "secure-password",
    config: {} as AxiosRequestConfig,
}
const regular = {
    id: NaN,
    username: "test",
    displayName: "Someone",
    password: "another-password",
    config: {} as AxiosRequestConfig,
}

describe("create users", () => {

    test("create first administrator account", async () => {
        const res = await http.post("/users", { ...admin, admin: false })
        expect(res.status).toBe(201)
        expect(res.data).toMatchObject({
            username: admin.username,
            displayName: admin.displayName,
            admin: true,
        })
        expect(res.data).not.toHaveProperty("password")
    })

    test("login into admin account", async () => {
        const res = await http.get("/login", { auth: admin })
        expect(res.status).toBe(200)
        expect(res.data.user).toMatchObject({
            username: admin.username,
            displayName: admin.displayName,
            admin: true,
        })
        expect(typeof res.data.user.id).toBe("number")
        admin.id = res.data.user.id
        expect(typeof res.data.token).toBe("string")
        admin.config = { headers: { Authorization: "Bearer " + res.data.token } }
    })

    test("create regular account", async () => {
        const res = await http.post("/users", { ...regular, admin: true })
        expect(res.data).toMatchObject({ admin: false })
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
        regular.config = { headers: { Authorization: "Bearer " + res.data.token } }
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

        const read = await http.get("/users/" + regular.id, regular.config)
        expect(read.data).toMatchObject(res.data)
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

})
