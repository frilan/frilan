<template lang="pug">
h2 Welcome, {{ user.displayName }}
button(@click="logout") Log out
</template>

<script lang="ts">
import { defineComponent } from "vue"
import { useStore } from "../store/store"
import { useRouter } from "vue-router"

export default defineComponent({
  name: "Home",
  setup() {
    const router = useRouter()
    const store = useStore()

    return {
      user: store.state.user,

      logout: () => {
        store.dispatch("logout")
        router.push({ name: "login" })
      },
    }
  },
})
</script>

<style lang="sass" scoped>

</style>
