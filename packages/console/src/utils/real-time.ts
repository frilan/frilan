import { ref, Ref } from "vue"
import { Registration, User } from "@frilan/models"
import { Subscriber } from "./subscriber"
import http from "./http"

/**
 * Returns a reference to a list of registrations that updates automatically on every change.
 * @param eventId
 */
export async function realTimeRegistrations(eventId: number): Promise<Ref<Registration[]>> {
    const registrations = ref(await http.getMany(`/events/${ eventId }/registrations?load=user`, Registration))

    new Subscriber(Registration, { eventId })
        .onUpdate(async registration => {
            const index = registrations.value.findIndex(({ userId, eventId }) =>
                userId === registration.userId && eventId === registration.eventId)
            if (index >= 0)
                Object.assign(registrations.value[index], registration)
            else
                registrations.value.push({
                    ...registration,
                    user: await http.getOne("/users/" + registration.userId, User),
                })
        })
        .onDelete(({ userId, eventId }) => {
            const index = registrations.value.findIndex(registration =>
                userId === registration.userId && eventId === registration.eventId)
            if (index >= 0) registrations.value.splice(index, 1)
        })

    return registrations
}
