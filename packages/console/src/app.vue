<template lang="pug">
header
  h1 Console
main
  p#error(v-if="error") {{ error }}
  router-view
</template>

<script lang="ts">
import { computed, defineComponent, onErrorCaptured } from "vue"
import { AxiosError } from "axios"
import { useStore } from "./store/store"

export default defineComponent({
  name: "App",
  setup() {
    const store = useStore()

    onErrorCaptured(err => {
      // only handle axios errors
      const axiosError = err as AxiosError
      if (axiosError.response)
        store.commit("setError", axiosError.response.data.message)
      else if (axiosError.request)
        store.commit("setError", "Cannot connect to the server")

      else
        return true

      return false
    })

    return { error: computed(() => store.state.error) }
  },
})
</script>

<style lang="sass">
#app
  font-family: Avenir, Helvetica, Arial, sans-serif
  -webkit-font-smoothing: antialiased
  -moz-osx-font-smoothing: grayscale

#error
  color: red
</style>