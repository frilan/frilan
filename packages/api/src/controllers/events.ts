import { JsonController } from "routing-controllers"
import { Event } from "../entities/event"
import { CRUD } from "./common/crud"
import { getRepository } from "typeorm"

@JsonController("/events")
export class EventController extends CRUD<Event> {

    constructor() {
        super(getRepository(Event))
    }
}
