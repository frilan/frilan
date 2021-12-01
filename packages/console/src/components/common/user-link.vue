<script setup lang="ts">
import { User } from "@frilan/models"
import EventLink from "./event-link.vue"
import { useStore } from "../../store/store"
import { toRefs } from "vue"

const store = useStore()
let { user: currentUser } = $(toRefs(store.state))

defineProps<{ user: User }>()
</script>

<template lang="pug">
event-link(
  to="results"
  :params="{ name: user.username }"
  :class="{ myself: user.id === currentUser.id }"
)
  | {{ user.displayName }}
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

</style>
