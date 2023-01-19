<script setup lang="ts">
import { toRefs, watchEffect } from "vue"
import { useRoute } from "vue-router"
import { User } from "@frilan/models"
import { useStore } from "@/store/store"
import http from "@/utils/http"
import { NotFoundError } from "@/utils/not-found-error"
import router from "@/router"
import ProfilePicture from "@/components/common/profile-picture.vue"
import Checkbox from "@/components/common/checkbox.vue"
import { Close, ContentSave, Delete, FormTextboxPassword, ImageEdit } from "mdue"

const route = useRoute()
const store = useStore()

const { name } = route.params
let { user: currentUser } = $(toRefs(store.state))

const users = await http.getMany(`/users?username=${ name }`, User)
if (!users.length)
  throw new NotFoundError()

let user = $ref(users[0])
user.password = ""

watchEffect(() => document.title = `Edit ${ user.displayName } - Console`)

let profilePictureURL = $ref<string | undefined>(user.profilePicture)
let newPassword = $ref(false)

let hasProfilePicture = $computed(() => typeof profilePictureURL === "string")
let isCurrentUser = $computed(() => currentUser.id === user.id)

function removeProfilePicture() {
  profilePictureURL = undefined
  user.profilePicture = undefined
}

async function save() {
  const body: Partial<User> = { ...user }
  if (!currentUser.admin)
    delete body.admin
  else if (currentUser.id === user.id && !body.admin
    && !confirm("Do you really want to loose your admin role?\nThis action is irreversible."))
    return

  if (!user.password.length)
    delete body.password
  if (!user.profilePicture?.length)
    body.profilePicture = undefined

  const updatedUser = await http.patch("/users/" + user.id, body, User)
  if (isCurrentUser)
    store.commit("setUser", { ...currentUser, ...updatedUser })

  router.push({ name: "user", params: { name: updatedUser.username } })
}
</script>

<template lang="pug">
h1
  profile-picture(:user="user")
  span {{ user.displayName }}

form(@submit.prevent="save")
  fieldset
    label Username
      input(minlength=2 maxlength=30 v-model="user.username" required)
    label Display name
      input(autofocus minlength=2 maxlength=30 v-model="user.displayName" required)

    template(v-if="hasProfilePicture")
      label Profile picture
        input.small(v-model="profilePictureURL" placeholder="Picture URL"
          @focusout="user.profilePicture = profilePictureURL")
      .remove-pic
        button.button(@click.prevent="removeProfilePicture")
          delete
          span Remove
    .add-pic.wide(v-else)
      button.button(@click.prevent="profilePictureURL = ''")
        image-edit
        span Set profile picture

    label.wide(v-if="newPassword") New password
      input(type="password" minlength=6 v-model="user.password")
    .new-password.wide(v-else)
      button.button(@click.prevent="newPassword = true")
        form-textbox-password
        span Change password

    .role.wide(v-if="currentUser.admin")
      label Role
      checkbox(v-model="user.admin") Administrator
  .buttons-right
    button.button(type="button" @click.prevent="router.back")
      close
      span Cancel
    button.button(type="submit")
      content-save
      span Save
</template>

<style scoped lang="sass">
@import "@/assets/styles/form.sass"

h1
  display: flex
  justify-content: center
  align-items: center

  span
    margin-left: 15px

form
  min-width: 600px
  padding: 30px

.add-pic, .new-password
  text-align: center

.remove-pic
  display: flex
  align-items: center
  margin-top: 14px

.role
  display: flex
  align-items: center
  justify-content: center

  label
    margin-top: 8px
    margin-right: 10px

.save
  text-align: right
</style>
