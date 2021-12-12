<script setup lang="ts">
const props = defineProps<{
  modelValue?: Date
  min?: Date
  max?: Date
}>()

const emit = defineEmits<{ (e: "update:modelValue", date: Date | null): void }>()

/**
 * Converts a date into a string that can be accepted by a "datetime-local" input.
 * @param date
 */
function formatDate(date: Date): string {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, -1)
}

let date = $computed({
  get: () => props.modelValue ? formatDate(props.modelValue) : null,
  set: val => emit("update:modelValue", val ? new Date(val) : null),
})
</script>

<template lang="pug">
input(id="date" type="datetime-local" v-model="date"
  :min="min ? formatDate(min) : undefined"
  :max="max ? formatDate(max) : undefined"
  :class="{ empty: !date }")
</template>

<style scoped lang="sass">
input.empty
  color: lightgrey
</style>
