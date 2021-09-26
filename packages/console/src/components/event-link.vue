<script setup lang="ts">
import type { RouteParamsRaw } from "vue-router"
import { useStore } from "../store/store"
import { computed, toRefs } from "vue"
import { routeInEvent } from "../utils/route-in-event"

const props = defineProps<{
  to: string
  params?: RouteParamsRaw
}>()

const store = useStore()
let { event, latestEvent } = $(toRefs(store.state))

const location = computed(() => event.id === latestEvent
  ? { name: props.to, params: props.params }
  : routeInEvent(props.to, event.id, props.params))
</script>

<template lang="pug">
router-link(:to="location")
  slot
</template>

<style scoped lang="sass">

</style>
