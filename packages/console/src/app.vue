<template lang="pug">
header
  h1 Console
main
  router-view
</template>

<script lang="ts">
import { defineComponent } from "vue"

export default defineComponent({
  name: "App",
})
</script>

<style lang="sass">
#app
  font-family: Avenir, Helvetica, Arial, sans-serif
  -webkit-font-smoothing: antialiased
  -moz-osx-font-smoothing: grayscale
</style>
