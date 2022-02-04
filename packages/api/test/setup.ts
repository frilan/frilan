import { startServer, stopServer } from "../src/server"
import axios, { AxiosInstance, AxiosRequestConfig } from "axios"

export interface TestUser {
    username: string
    id: number
    config: AxiosRequestConfig
}

/**
 * Creates multiples users. If the database is empty, the first one will be an administrator.
 */
export async function createUsers(amount: number): Promise<TestUser[]> {
    const users = []
    // requests must be sent sequentially in order to make sure the first user is an admin
    // `map` won't work here
    for (const i of Array(amount).keys()) {
        const username = "user-" + i
        await http.post("/users", { username, displayName: "test", password: "password" })
        const res = await http.get("/login", { auth: { username, password: "password" } })
        users.push({
            username,
            id: res.data.user.id,
            config: { headers: { authorization: "Bearer " + res.data.token } },
        })
    }
    return users
}

/**
 * Refreshes privilege of the provided user by getting a new access token.
 */
export async function refreshPrivilege(user: TestUser): Promise<void> {
    const res = await http.get("/login", { auth: { username: user.username, password: "password" } })
    user.config.headers.authorization = "Bearer " + res.data.token
}

/**
 * Creates multiple events and returns their ids.
 */
export async function createEvents(amount: number, config: AxiosRequestConfig): Promise<number[]> {
    return Promise.all([...Array(amount).keys()].map(async index => {
        const event = { name: "event-" + index, shortName: index.toString(), start: 1, end: 10 }
        const res = await http.post("/events", event, config)
        return res.data.id
    }))
}

export let http: AxiosInstance

beforeAll(async () => {
    const baseURL = await startServer()
    http = axios.create({ baseURL, validateStatus: () => true })
})

afterAll(async () => {
    await stopServer()
})
