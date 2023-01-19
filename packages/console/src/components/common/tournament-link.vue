<script setup lang="ts">
import type { Tournament } from "@frilan/models"
import EventLink from "./event-link.vue"

defineProps<{ tournament: Tournament }>()
</script>

<template lang="pug">
event-link(to="tournament" :params="{ name: tournament.shortName }") {{ tournament.name }}
</template>
