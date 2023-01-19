<script setup lang="ts">
import type { Tournament } from "@frilan/models"

const props = defineProps<{ tournament: Tournament }>()

let backgroundStyle = $computed(() => ({
  backgroundImage: props.tournament.background ? `url(${ props.tournament.background })` : undefined,
  backgroundColor: `hsl(${ props.tournament.id * 73 }, 40%, 30%)`,
}))
</script>

<template lang="pug">
.bg(:style="backgroundStyle")
</template>

<style scoped lang="sass">
.bg
  background-size: cover
  background-position: center
  position: absolute
  left: 0
  top: 0
  width: 100%
  height: 100%
  opacity: 40%
  z-index: -2
</style>
