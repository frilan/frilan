<script setup lang="ts">
import { User } from "@frilan/models"
import ConsoleIcon from "../../assets/images/console.svg?component"

const props = withDefaults(defineProps<{
  user: User
  size?: number
  square?: boolean
}>(), {
  size: 1.5,
  square: false,
})

let hue = $computed(() => props.user.id * 73)

let style = $computed(() => ({
  height: props.size + "em",
  width: props.size + "em",
  color: `hsl(${ hue }, 50%, 75%)`,
  backgroundColor: `hsl(${ hue }, 25%, 25%)`,
  borderRadius: props.square ? "5px" : "100%",
}))
</script>

<template lang="pug">
img(v-if="user.profilePicture" :src="user.profilePicture" :style="style" alt="Profile picture")
.default(v-else :style="style")
  console-icon.icon
</template>

<style scoped lang="sass">
img, .default
  object-fit: cover
  overflow: hidden
  display: inline-flex
  align-items: center
  justify-content: center

.icon
  height: 70%
</style>
