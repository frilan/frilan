<script setup lang="ts">
import axios from "axios"
import { ValidationError } from "class-validator"
import { useStore } from "../store/store"
import { toRefs } from "vue"

const store = useStore()
let { error } = $(toRefs(store.state))

let message = $computed((): string => {
  if (axios.isAxiosError(error)) {
    if (error.response)
      return error.response.data.message ?? error.response.data
    else if (error.request)
      return "Cannot connect to the server"
  } else if (error instanceof Error)
    return error.message
  return String(error)
})

let details = $computed((): string[] => {
  // if any, list payload validation errors
  if (axios.isAxiosError(error) && error.response && error.response.data.errors)
    return (error.response.data.errors as ValidationError[])
      .filter((err): err is Required<ValidationError> => !!err.constraints)
      .map(err => Object.values(err.constraints).join(", "))
  else
    return []
})
</script>

<template lang="pug">
#error(v-if="error")
  p {{ message }}
  ul(v-if="details")
    li(v-for="detail in details") {{ detail }}
</template>

<style scoped lang="sass">
#error
  color: red
</style>
