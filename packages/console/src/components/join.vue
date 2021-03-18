<template lang="pug">
h2 Create a new account
form(@submit.prevent="join")
  .field
    label(for="username") Username
    input(id="username" v-model="fields.username")
  .field
    label(for="display") Display name
    input(id="display" v-model="fields.displayName")
  .field
    label(for="picture") Profile picture
    input(id="picture" v-model="fields.profilePicture")
  button(type="submit") Join

router-link(:to="{ name: 'login' }") Log in to an existing account
</template>

<script lang="ts">
import { defineComponent, reactive } from "vue"
import { useRouter } from "vue-router"
import axios from "axios"
import { useStore } from "../store/store"

export default defineComponent({
  name: "Join",
  setup() {
    const router = useRouter()
    const store = useStore()

    const fields = reactive({
      username: "",
      displayName: "",
      profilePicture: "",
    })

    const join = async () => {
      const user = await axios.post("/users", fields)
      await store.commit("setUser", user.data)
      router.push({ name: "home" })
    }

    return { fields, join }
  },
})
</script>

<style lang="sass" scoped>

</style>
