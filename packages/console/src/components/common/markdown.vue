<script setup lang="ts">
import MarkdownIt from "markdown-it"

const props = defineProps<{ src: string }>()
const md = new MarkdownIt({ linkify: true })
const rendered = $computed(() => md.render(props.src
  .replace(/^(\s*#+)([^\s#])/gm, "$1 $2") // missing space in headings
  .replace(/^(\s*[*+-])([^\s*+-])/gm, "$1 $2"))) // missing space in list items
</script>

<template lang="pug">
div(v-html="rendered")
</template>

<style scoped lang="sass">
::v-deep img
  max-width: 100%
</style>
