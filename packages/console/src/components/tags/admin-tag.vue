<script setup lang="ts">
import { Crown } from "mdue"</script>

<template lang="pug">
.admin-tag(title="This user is an administrator")
  crown
  span Site admin
</template>

<style scoped lang="sass">
@import "@/assets/styles/main.sass"

.admin-tag
  color: #c7fffc
  background: #317371
  @extend .tag
</style>
