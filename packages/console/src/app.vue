<script setup lang="ts">
import { onErrorCaptured } from "vue"
import { AxiosError } from "axios"
import { useStore } from "./store/store"

const store = useStore()

// catch unhandled errors
onErrorCaptured((err: AxiosError) => {
  if (err.response) {
    const res = err.response.data
    store.commit("setError", res.message ?? res)
    if (res.errors)
      store.commit("setValidationErrors", res.errors)
  } else if (err.request)
    store.commit("setError", "Cannot connect to the server")

  else
    return true

  return false
})

let error = $computed(() => store.state.error)
let constraintsList = $computed(() =>
  store.state.validationErrors
    .map(e => e.constraints)
    .filter((c): c is { [p: string]: string } => !!c)
    .map(c => Object.values(c).join(", ")))
</script>

<template lang="pug">
header
  h1 Console
main
  #error(v-if="error")
    p {{ error }}
    ul(v-if="constraintsList")
      li(v-for="constraints in constraintsList") {{ constraints }}
  router-view
</template>

<style lang="sass">
#app
  font-family: Avenir, Helvetica, Arial, sans-serif
  -webkit-font-smoothing: antialiased
  -moz-osx-font-smoothing: grayscale

#error
  color: red
</style>
