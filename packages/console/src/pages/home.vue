<script setup lang="ts">
import { useStore } from "../store/store"
import { useRouter } from "vue-router"

const router = useRouter()
const store = useStore()

const user = store.state.user

function logout() {
  store.dispatch("logout")
  router.push({ name: "login" })
}
</script>

<template lang="pug">
h2 Welcome, {{ user.displayName }}
button(@click="logout") Log out
</template>

<style lang="sass" scoped>

</style>
