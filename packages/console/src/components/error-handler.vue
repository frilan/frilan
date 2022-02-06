<script setup lang="ts">
import axios from "axios"
import { ValidationError } from "class-validator"
import { useStore } from "../store/store"
import { toRefs, watchEffect } from "vue"
import MessageBox from "./common/message-box.vue"
import { AlertOctagon } from "mdue"

const store = useStore()
let { error } = $(toRefs(store.state))

function clearError() {
  store.commit("clearError")
}

let message = $computed((): string => {
  if (axios.isAxiosError(error)) {
    if (error.response)
      return error.response.data.message ?? error.response.data
    else if (error.request)
      if (navigator.onLine)
        return "Cannot connect to the server"
      else
        return "No Internet connection"
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

let showError = $computed({
  get: () => !!error,
  set: val => {
    if (!val) clearError()
  },
})

let closeButton = $ref<HTMLDivElement>()
watchEffect(() => closeButton?.focus())
</script>

<template lang="pug">
message-box(v-model="showError" background="#412")
  .title
    span Error
    alert-octagon
  .message
    p {{ message }}
    fieldset.details(v-if="details.length")
      legend errors
      ul
        li(v-for="detail in details") {{ detail }}
  footer
    button.button(@click="clearError" ref="closeButton") Close
</template>

<style scoped lang="sass">
@import "../assets/styles/main"

$border: 1px solid rgba(255, 255, 255, 0.15)

.title
  font-size: 1.5em
  font-weight: bold
  color: $accent
  margin-bottom: 20px
  padding-bottom: 20px
  text-transform: uppercase
  letter-spacing: 2px
  border-bottom: $border
  display: flex
  align-items: center
  justify-content: space-between

  svg
    font-size: 1.2em
    margin-left: 12px

.message
  color: #fbc

.details
  font-size: 0.85em

  legend
    font-weight: bold
    color: $accent

.details
  border: $border
  border-radius: 3px

footer
  margin-top: 25px
  text-align: right

  .button
    background-color: #312

    &:not([disabled]):hover
      background-color: #423
</style>
