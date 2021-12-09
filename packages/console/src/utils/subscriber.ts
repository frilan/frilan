import { ClassConstructor } from "class-transformer/types/interfaces"
import { plainToClass } from "class-transformer"
import http from "./http"
import { store } from "../store/store"

/**
 * A class representing a subscription to entity events.
 */
export class Subscriber<T> {

    private readonly eventSource: EventSource | null = null

    private static sources: EventSource[] = []

    /**
     * Creates a new subscriber for the specified entity class.
     * @param cls The entity class
     * @param filters The filters which entities have to match to be sent back
     */
    public constructor(private cls: ClassConstructor<T>, filters?: Record<string, unknown>) {
        let url = http.baseURL + "/subscribe/" + cls.name.toLowerCase() + "s"
        if (filters)
            url += "?" + Object.entries(filters).map(([key, value]) => key + "=" + value).join("&")
        this.eventSource = new EventSource(url)
        Subscriber.sources.push(this.eventSource)
    }

    /**
     * Closes all active event sources.
     */
    public static closeAllConnections(): void {
        for (const src of Subscriber.sources)
            src.close()

        Subscriber.sources = []
    }

    /**
     * Triggers the callback when a matching entity has been created.
     * @param callback The callback function
     */
    public onCreate(callback: (entity: T, type?: string) => void): Subscriber<T> {
        this.on("create", callback)
        return this
    }

    /**
     * Triggers the callback when a matching entity has been updated.
     * @param callback The callback function
     */
    public onUpdate(callback: (entity: T, type?: string) => void): Subscriber<T> {
        this.on("update", callback)
        return this
    }

    /**
     * Triggers the callback when a matching entity has been deleted.
     * @param callback The callback function
     */
    public onDelete(callback: (entity: T, type?: string) => void): Subscriber<T> {
        this.on("delete", callback)
        return this
    }

    private on(type: string, callback: (entity: T, type?: string) => void): void {
        this.eventSource?.addEventListener(type, async event => {
            try {
                await callback(plainToClass(this.cls, JSON.parse((event as MessageEvent).data)), event.type)
            } catch (err) {
                store.commit("setError", err)
            }
        })
    }
}
