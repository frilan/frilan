<script setup lang="ts">
import { GoogleController } from "mdue"</script>

<template lang="pug">
.admin-tag(title="This user attended this event")
  google-controller
  span Participant
</template>

<style scoped lang="sass">
@import "../../assets/styles/main"

.admin-tag
  color: #d7d8ff
  background: #3e42bd
  @extend .tag
</style>
