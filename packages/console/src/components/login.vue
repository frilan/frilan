<template lang="pug">
h2 Log in to your account
form(@submit.prevent="login")
  .field
    label(for="username") Username
    input(id="username" v-model="username")
  button(type="submit") Login

router-link(:to="{ name: 'join' }") Create a new account
</template>

<script lang="ts">
import { defineComponent, ref } from "vue"
import { useRouter } from "vue-router"

export default defineComponent({
  name: "Login",
  setup() {
    const router = useRouter()

    const username = ref("")

    const login = () => {
      router.push({ name: "home" })
    }

    return { username, login }
  },
})
</script>

<style lang="sass" scoped>

</style>
