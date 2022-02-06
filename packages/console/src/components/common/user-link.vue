<script setup lang="ts">
import { Registration, Role } from "@frilan/models"
import EventLink from "./event-link.vue"
import { useStore } from "../../store/store"
import { toRefs } from "vue"
import { Star } from "mdue"

const store = useStore()
let { user } = $(toRefs(store.state))

const props = defineProps<{ registration: Registration }>()

let myself = $computed(() => props.registration.userId === user.id)
let organizer = $computed(() => props.registration.role === Role.Organizer)
</script>

<template lang="pug">
event-link(
  to="results"
  :params="{ name: registration.user.username }"
  :class="{ myself, organizer }"
  :title="organizer ? 'Organizer' : undefined"
)
  span {{ registration.user.displayName }}
  star(v-if="organizer")
</template>

<style scoped lang="sass">
.myself
  font-weight: bold
  animation-name: blink
  animation-duration: 0.8s
  animation-iteration-count: infinite
  animation-direction: alternate
  @keyframes blink
    from
      color: cornflowerblue
    to
      color: orange

.organizer
  color: #f3a5c3
  display: inline-flex
  align-items: center

  &:hover
    color: #ffdbb1

  svg
    font-size: 0.8em
    margin-left: 3px
</style>
