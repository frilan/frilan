<script setup lang="ts">
import { useRouter } from "vue-router"
import { useStore } from "@/store/store"
import { redirectToEvent } from "@/utils/redirect-to-event"
import Logo from "@/components/common/logo.vue"
import axios from "axios"
import { AlertCircle } from "mdue"

const router = useRouter()
const store = useStore()

let username = $ref("")
let password = $ref("")
let wrongCredentials = $ref(false)

async function login() {
  wrongCredentials = false
  try {
    await store.dispatch("login", { username, password })
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      wrongCredentials = true
      return
    } else
      throw error
  }

  // redirect to requested page if available
  if (store.state.next)
    router.push(store.state.next)

  // redirect to active event if registered for it
  else if (store.state.user.registrations.length)
    redirectToEvent("home")

  else
    router.push({ name: "events" })
}
</script>

<template lang="pug">
.container
  .window
    logo.logo(vertical)
    form(@submit.prevent="login")
      input(placeholder="Username" autocomplete="username" autofocus required v-model="username")
      input(placeholder="Password" type="password" autocomplete="current-password" required v-model="password")
      button.button(type="submit") Sign in

    .error.icon-text(v-if="wrongCredentials")
      alert-circle
      span Wrong username and/or password

    .join
      router-link(:to="{ name: 'join' }") Create a new account
</template>

<style lang="sass" scoped>
@import "@/assets/styles/main.sass"

.container
  position: fixed
  left: 0
  bottom: 0
  right: 0
  top: 0
  background-image: linear-gradient(-45deg, black, #071949, #3b0007, black, #071949)
  background-size: 400% 400%

  animation-name: scroll
  animation-duration: 15s
  animation-iteration-count: infinite
  animation-timing-function: linear
  @keyframes scroll
    from
      background-position: 100% 100%
    to
      background-position: 0 0

.window
  background-color: rgba(255, 255, 255, 0.15)
  max-width: 400px
  padding: 40px 30px
  border-radius: 5px
  margin: 120px auto 0

  animation-name: slide-in
  animation-duration: 0.5s
  animation-timing-function: ease-out
  @keyframes slide-in
    from
      opacity: 0
      transform: translate(0, 30px)
    to
      opacity: 100%
      transform: translate(0, 0)

  .logo, form, .join
    opacity: 0
    animation-name: zoom-in
    animation-delay: 0.15s
    animation-fill-mode: forwards
    animation-duration: 0.4s
    animation-timing-function: ease-out
    @keyframes zoom-in
      from
        transform: scale(0.95)
      to
        opacity: 100%
        transform: scale(1)

  form
    animation-delay: 0.3s

  .join
    animation-delay: 0.45s

form
  max-width: 250px
  margin: 40px auto 0
  text-align: right

  .button
    margin-bottom: 10px
    background-color: rgba(255, 255, 255, 0.15)
    outline: 1px solid rgba(255, 255, 255, 0.2)

    &:not([disabled]):hover
      background-color: rgba(255, 255, 255, 0.2)
      outline: 1px solid rgba(255, 255, 255, 0.4)

input
  display: block
  width: 100%
  box-sizing: border-box
  margin-bottom: 16px
  font-family: inherit
  font-size: 1.1em
  padding: 12px 8px
  border: none
  border-radius: 5px
  background-color: rgba(255, 255, 255, 0.6)

  &:focus
    outline: 1px solid cornflowerblue
    background-color: rgba(255, 255, 255, 0.8)

.error
  color: $accent
  justify-content: center
  margin: 15px 0

  animation-name: bounce
  animation-duration: 0.3s
  animation-timing-function: linear
  @keyframes bounce
    0%
      transform: scale(0.1)
    33%
      transform: scale(1.1)
    66%
      transform: scale(0.95)
    100%
      transform: scale(1)

.join
  margin: 20px 30px 0
  padding-top: 20px
  border-top: 1px solid rgba(255, 255, 255, 0.15)
  text-align: center
</style>

<style lang="sass">
// animate this component on login
.login-leave-active
  transition: opacity 1s ease

  .container
    transition: animation-duration 1s

  .window
    transition: transform 1s cubic-bezier(0.5, -0.5, 0.8, 0.8)

.login-leave-to
  opacity: 0

  .container
    animation-duration: 1s

  .window
    transform: translate(0, -600px)

// animate next component
.login-enter-active
  transition: opacity 2s

.login-enter-from
  opacity: 0
</style>
