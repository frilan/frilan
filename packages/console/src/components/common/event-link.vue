<script setup lang="ts">
import { toRefs } from "vue"
import type { RouteParamsRaw } from "vue-router"
import { useStore } from "@/store/store"
import { routeInEvent } from "@/utils/route-in-event"

const props = defineProps<{
  to: string
  params?: RouteParamsRaw
}>()

const store = useStore()
let { event, mainEvent, init } = $(toRefs(store.state))

const location = $computed(() => init || event.shortName === mainEvent
  ? { name: props.to, params: props.params }
  : routeInEvent(props.to, event.shortName, props.params))
</script>

<template lang="pug">
router-link(:to="location")
  slot
</template>

<style scoped lang="sass">

</style>
