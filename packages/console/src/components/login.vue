<template lang="pug">
h2 Log in to your account
form(@submit.prevent="login")
  .field
    label(for="username") Username
    input(id="username" v-model="username")
  button(type="submit") Log in

router-link(:to="{ name: 'join' }") Create a new account
</template>

<script lang="ts">
import { defineComponent, ref } from "vue"
import { useRouter } from "vue-router"
import { useStore } from "../store/store"

export default defineComponent({
  name: "Login",
  setup() {
    const router = useRouter()
    const store = useStore()

    const username = ref("")

    return {
      username,

      login: async () => {
        await store.dispatch("login", username.value)
        router.push({ name: "home" })
      },
    }
  },
})
</script>

<style lang="sass" scoped>

</style>
