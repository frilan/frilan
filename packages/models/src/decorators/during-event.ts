import {
    registerDecorator, ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface,
} from "class-validator"
import { getRepository } from "typeorm"
import { Event } from "../entities/event"

@ValidatorConstraint({ name: "duringEvent", async: false })
export class DuringEventConstraint implements ValidatorConstraintInterface {
    async validate(date: unknown, args: ValidationArguments): Promise<boolean> {
        if (!(date instanceof Date))
            return false

        const [property] = args.constraints
        const eventId = (args.object as Record<string, number | Date>)[property]
        const event = await getRepository(Event).findOne(eventId)
        return event !== undefined && date > event.start && date < event.end
    }

    defaultMessage(args: ValidationArguments): string {
        return args.property + " must happen during the specified event"
    }
}

export function DuringEvent(targetProperty: string) {
    // we use Object as a type here, as it's the usual way of writing decorators
    // eslint-disable-next-line @typescript-eslint/ban-types
    return function (target: Object, propertyName: string): void {
        registerDecorator({
            validator: DuringEventConstraint,
            constraints: [targetProperty],
            target: target.constructor,
            propertyName,
        })
    }
}
