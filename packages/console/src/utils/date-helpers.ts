import { computed } from "vue"

/**
 * Converts a date into a string that can be accepted by a "datetime-local" input.
 * @param date
 */
export function formatDate(date: Date): string {
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, -1)
}

/**
 * Any key of object T with a date property.
 */
type DateKey<T> = { [K in keyof T]-?: T[K] extends Date ? Date extends T[K] ? K : never : never }[keyof T]

/**
 * Maps the date of an object to a string that can be accepted by a "datetime-local" input.
 * @param object The object containing the date
 * @param key
 */
export function computedDate<T>(object: T, key: DateKey<T>): ReturnType<typeof computed> {
    return computed({
        get: () => formatDate(object[key]),
        set: val => (object[key] as Date) = new Date(val),
    })
}
