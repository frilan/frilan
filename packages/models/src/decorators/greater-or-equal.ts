import {
    registerDecorator, ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface,
} from "class-validator"

type Comparable = number | string | Date

@ValidatorConstraint({ name: "greaterOrEqual", async: false })
export class GreaterOrEqualConstraint implements ValidatorConstraintInterface {
    validate(value: Comparable, args: ValidationArguments): boolean {
        const [property] = args.constraints
        const other = (args.object as Record<string, Comparable | undefined>)[property]
        return !other || value >= other
    }

    defaultMessage(args: ValidationArguments): string {
        return args.property + " must be greater than or equal to " + args.constraints
    }
}

/**
 * Valid only if the value is greater than or equal to another property of the same object.
 * @param targetProperty the name of the other property
 * @constructor
 */
export function GreaterOrEqual(targetProperty: string) {
    // we use Object as a type here, as it's the usual way of writing decorators
    // eslint-disable-next-line @typescript-eslint/ban-types
    return function (target: Object, propertyName: string): void {
        registerDecorator({
            validator: GreaterOrEqualConstraint,
            constraints: [targetProperty],
            target: target.constructor,
            propertyName,
        })
    }
}
