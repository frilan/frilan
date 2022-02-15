<script setup lang="ts">
import EventLink from "../components/common/event-link.vue"
import { EmoticonDead, Home } from "mdue"

document.title = "Not Found - Console"
</script>

<template lang="pug">
.not-found
  emoticon-dead
  p This page doesn't exist anymore
  event-link.button(to="home")
    home
    span Home
</template>

<style scoped lang="sass">
@import "../assets/styles/main"

.not-found
  text-align: center
  margin: 50px 100px

svg
  font-size: 10em

p
  @extend .skewed
  color: white
  margin-bottom: 40px
</style>
