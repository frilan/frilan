import {
    registerDecorator, ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface,
} from "class-validator"

@ValidatorConstraint({ name: "rankList", async: false })
export class RankConstraint implements ValidatorConstraintInterface {
    validate(ids: unknown): boolean {
        return Array.isArray(ids) &&
            ids.every(id => Number.isInteger(id) ||
                Array.isArray(id) && id.every(i => Number.isInteger(i)))
    }

    defaultMessage(args: ValidationArguments): string {
        return args.property + " must be an array in which each item is a team ID or a list of team IDs"
    }
}

/**
 * Valid only if the value is an array of integers or list of integers.
 * @constructor
 */
export function RankList() {
    // we use Object as a type here, as it's the usual way of writing decorators
    // eslint-disable-next-line @typescript-eslint/ban-types
    return function (target: Object, propertyName: string): void {
        registerDecorator({
            validator: RankConstraint,
            target: target.constructor,
            propertyName,
        })
    }
}
