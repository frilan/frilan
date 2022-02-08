<script setup lang="ts">
import { CheckboxBlank, CheckboxMarked } from "mdue"

defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ (e: "update:modelValue", value: boolean): void }>()
</script>

<template lang="pug">
button.button(type="button" @click="emit('update:modelValue', !modelValue)" :class="{ checked: modelValue }")
  checkbox-marked(v-if="modelValue")
  checkbox-blank(v-else)
  slot
</template>
