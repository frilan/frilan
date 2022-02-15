<script setup lang="ts">
import { CheckboxBlank, CheckboxMarked } from "mdue"

defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ (e: "update:modelValue", value: boolean): void }>()
</script>

<template lang="pug">
button.button(type="button" @click.prevent="emit('update:modelValue', !modelValue)" :class="{ checked: modelValue }")
  checkbox-marked.marked(v-if="modelValue")
  checkbox-blank.blank(v-else)
  slot
</template>

<style scoped lang="sass">
@import "../../assets/styles/main"

.button.checked:focus
  outline-color: mediumspringgreen

  &:not([disabled]):hover
    outline-color: #6cffc0

.button:not(.checked)
  opacity: 65%

.marked
  color: mediumspringgreen

.blank
  color: $medium-glass
</style>
