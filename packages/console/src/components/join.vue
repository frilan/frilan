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
import { useStore } from "../store/store"
import http from "../utils/http"
import { User } from "@frilan/models"

export default defineComponent({
  name: "Join",
  setup() {
    const router = useRouter()
    const store = useStore()

    const fields = reactive({
      username: "",
      displayName: "",
      profilePicture: "",
    } as User)

    const join = async () => {
      const user = await http.post("/users", fields, User)
      await store.commit("setUser", user)
      router.push({ name: "home" })
    }

    return { fields, join }
  },
})
</script>

<style lang="sass" scoped>

</style>
