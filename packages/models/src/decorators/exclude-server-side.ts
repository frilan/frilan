import { Exclude, Expose } from "class-transformer"

// will be true only when running in Node.js
const serverSide = typeof window === "undefined"

/**
 * Excludes a property when transforming into a class only on server side.
 * Prevents the client from changing some properties, while still being able to fetch them.
 * @constructor
 */
export function ExcludeServerSide(): ReturnType<typeof Exclude> {
    return serverSide ? Exclude({ toClassOnly: true }) : Expose()
}
