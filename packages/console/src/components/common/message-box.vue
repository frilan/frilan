<script setup lang="ts">
withDefaults(defineProps<{
  modelValue: boolean
  background?: string
  width?: string
}>(), {
  background: "#446",
  width: "500px",
})

const emit = defineEmits<{ (e: "update:modelValue", opened: boolean): void }>()

function close() {
  emit("update:modelValue", false)
}
</script>

<template lang="pug">
transition(name="fade")
  .bg(v-if="modelValue" @click="close")
    .box(v-if="modelValue" @click.stop :style="`background-color: ${background}; max-width: ${width}`")
      slot
</template>

<style scoped lang="sass">
.bg
  position: fixed
  z-index: 1000
  left: 0
  top: 0
  width: 100%
  height: 100%
  display: flex
  align-items: center
  overflow: auto
  background-color: rgba(0, 0, 0, 0.7)

.box
  border-radius: 5px
  padding: 24px
  margin: auto
  width: 95%
  box-shadow: 0 0 30px rgba(0, 0, 0, 0.8)

.fade-enter-active, .fade-leave-active
  transition: opacity 0.2s ease

  .box
    transition: transform 0.15s ease-out

.fade-enter-from, .fade-leave-to
  opacity: 0

.fade-enter-from .box
  transform: scale(1.5)

.fade-leave-to .box
  transform: scale(0.9)
</style>
