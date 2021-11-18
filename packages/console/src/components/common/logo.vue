<script setup lang="ts">
import ConsoleIcon from "../../assets/images/console.svg?component"

defineProps<{ vertical?: boolean }>()
</script>

<template lang="pug">
.console(:class="{ vertical }")
  console-icon
  span console
</template>

<style scoped lang="sass">
.console
  font-weight: bolder
  font-size: 2em
  padding: 0 8px
  user-select: none

  span
    display: inline-block
    transform: skew(-8.5deg)
    text-shadow: 0.4px 0, 0.8px 0

:not(.vertical)
  svg
    width: 18px
    margin-right: 12px

.vertical
  display: flex
  flex-direction: column
  align-items: center

  span
    font-size: 1.2em
    padding-right: 6px

  svg
    width: 80px
    margin-bottom: 12px
</style>
