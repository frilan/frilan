<script setup lang="ts">
import { onErrorCaptured } from "vue"
import { useStore } from "./store/store"
import ErrorHandler from "./components/error-handler.vue"

const store = useStore()

// catch unhandled errors
onErrorCaptured(err => {
  store.commit("setError", err)
  return true
})
</script>

<template lang="pug">
header
  h1 Console
main
  error-handler
  router-view
</template>

<style lang="sass">
#app
  font-family: Avenir, Helvetica, Arial, sans-serif
  -webkit-font-smoothing: antialiased
  -moz-osx-font-smoothing: grayscale
</style>
