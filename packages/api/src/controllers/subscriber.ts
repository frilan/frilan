import { Authorized, BadRequestError, Ctx, Get, JsonController, Param, Req, Res, UseBefore } from "routing-controllers"
import { Context, Request, Response } from "koa"
import { classToPlain } from "class-transformer"
import { PassThrough } from "stream"
import { FiltersParser } from "../middlewares/filters-parser"
import { Entity, EntityClass, EntityEventType, entitySubscriber } from "../util/entity-subscriber"

@JsonController("/subscribe")
export class SubscriberController {

    /**
     * @openapi
     * /subscribe/{entity}:
     *   get:
     *     summary: subscribe to entity events
     *     tags:
     *       - subscriber
     *     parameters:
     *       - name: entity
     *         in: path
     *         schema:
     *           type: string
     *           enum:
     *             - users
     *             - events
     *             - registrations
     *             - tournaments
     *             - teams
     *           example: users
     *     responses:
     *       200:
     *         description: start of stream
     *         content:
     *           text/event-stream:
     *             schema:
     *               type: string
     *               example: |
     *                 event: create
     *                 data: { id: 3, ... }
     *
     *                 event: update
     *                 data: { id: 15, ... }
     *
     *                 event: delete
     *                 data: { id: 6, ... }
     *       404:
     *         description: the specified entity type doesn't exist
     */
    @Get("/:entity")
    @UseBefore(FiltersParser)
    @Authorized()
    async subscribe(
        @Param("entity") cls: string,
        @Ctx() ctx: Context,
        @Req() request: Request,
        @Res() response: Response,
    ): Promise<Response> {

        // check for valid entity class
        const entityClass = cls.slice(0, -1) as EntityClass
        if (!Object.values(EntityClass).includes(entityClass))
            return response

        // check for valid event type
        const eventType = request.query.event as EntityEventType ?? EntityEventType.Any
        if (!Object.values(EntityEventType).includes(eventType))
            throw new BadRequestError("Invalid event type: " + eventType)

        const stream = new PassThrough()
        const listener = (type: EntityEventType, entity: Entity) => {
            // skip entities that don't match filters
            if (Object.entries(ctx.filters)
                .filter(([key]) => key !== "event")
                .some(([key, value]) => String(entity[key]) !== String(value)))
                return

            stream.write(`event: ${ type }\n`)
            stream.write(`data: ${ JSON.stringify(classToPlain(entity)) }\n\n`)
        }

        entitySubscriber.addListener(eventType, entityClass, listener)

        request.req.on("close", () => {
            entitySubscriber.removeListener(eventType, entityClass, listener)
            stream.end()
        })

        response.body = stream
        response.set({
            /* eslint-disable @typescript-eslint/naming-convention */
            "Content-Type": "text/event-stream; charset=utf-8",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            /* eslint-enable */
        })

        return response
    }
}
