<script setup lang="ts">
defineProps<{ rank: number }>()
</script>

<template lang="pug">
.rank(:class="{ ['_' + rank]: true }") {{ rank }}
</template>

<style scoped lang="sass">
.rank
  font-weight: bold
  color: lightblue
  display: flex
  align-items: center
  justify-content: center
  width: 1.4em
  height: 1.4em

._1, ._2, ._3
  font-size: 1.1em
  border-radius: 100%

._1
  background-color: #ffe989
  color: #bd7b32

._2
  background-color: #b4c1c7
  color: #425777

._3
  background-color: #b48b7e
  color: #721b0d
</style>
