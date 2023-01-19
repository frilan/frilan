<script setup lang="ts">
import { Star } from "mdue"</script>

<template lang="pug">
.organizer-tag(title="This user is an organizer of this event")
  star
  span Organizer
</template>

<style scoped lang="sass">
@import "@/assets/styles/main.sass"

.organizer-tag
  color: #fdcae4
  background: #852f55
  @extend .tag
</style>
