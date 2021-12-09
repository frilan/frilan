/**
 * Any object-like entity.
 */
export type Entity = Record<string, unknown>

/**
 * The type of event happening to an entity.
 * - Create: a new entity has been inserted into the database.
 * - Update: an existing entity has been updated.
 * - Delete: an entity has been removed from the database.
 */
export enum EntityEventType {
    Any = "any",
    Create = "create",
    Update = "update",
    Delete = "delete",
}

/**
 * All possible classes of entities that we can subscribe to.
 */
export enum EntityClass {
    User = "user",
    Registration = "registration",
    Event = "event",
    Tournament = "tournament",
    Team = "team",
}

/**
 * A callback function handling entity events.
 */
export type EntityEventListener = (type: EntityEventType, entity: Entity, previous?: Entity) => void

/**
 * A collection of callback lists for each entity types and entity classes.
 */
type EntityListeners = Record<EntityEventType, Record<EntityClass, EntityEventListener[]>>

/**
 * A class that handles entity events.
 */
export class EntitySubscriber {

    private listeners: EntityListeners = {
        [EntityEventType.Create]: {
            [EntityClass.User]: [],
            [EntityClass.Registration]: [],
            [EntityClass.Event]: [],
            [EntityClass.Tournament]: [],
            [EntityClass.Team]: [],
        },
        [EntityEventType.Update]: {
            [EntityClass.User]: [],
            [EntityClass.Registration]: [],
            [EntityClass.Event]: [],
            [EntityClass.Tournament]: [],
            [EntityClass.Team]: [],
        },
        [EntityEventType.Delete]: {
            [EntityClass.User]: [],
            [EntityClass.Registration]: [],
            [EntityClass.Event]: [],
            [EntityClass.Tournament]: [],
            [EntityClass.Team]: [],
        },
        [EntityEventType.Any]: {
            [EntityClass.User]: [],
            [EntityClass.Registration]: [],
            [EntityClass.Event]: [],
            [EntityClass.Tournament]: [],
            [EntityClass.Team]: [],
        },
    }

    /**
     * Adds a listener for a specific type of entity event.
     * @param type The type of event happening to the entity
     * @param cls The entity class
     * @param callback The callback function
     */
    public addListener(type: EntityEventType, cls: EntityClass, callback: EntityEventListener): void {
        this.listeners[type][cls].push(callback)
    }

    /**
     * Removes an existing listener.
     * @param type The type of event happening to the entity
     * @param cls The entity class
     * @param callback The callback function
     */
    public removeListener(type: EntityEventType, cls: EntityClass, callback: EntityEventListener): void {
        this.listeners[type][cls].filter(l => l !== callback)
    }

    /**
     * Emits an event, which calls every registered listeners.
     * @param type The event type
     * @param cls The entity class
     * @param entity The entity data
     * @param previous The previous data (can be used to match filters)
     */
    public emit(
        type: Exclude<EntityEventType, EntityEventType.Any>,
        cls: EntityClass,
        entity: unknown,
        previous?: unknown,
    ): void {
        for (const callback of [...this.listeners[type][cls], ...this.listeners[EntityEventType.Any][cls]])
            callback(type, entity as Entity, previous as Entity)
    }
}

/**
 * A global entity events handler.
 */
export const entitySubscriber = new EntitySubscriber()
