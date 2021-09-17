<script setup lang="ts">
import { Tournament } from "@frilan/models"

defineProps<{ tournament: Tournament }>()
</script>

<template lang="pug">
router-link(:to="{ name: 'tournament', params: { id: tournament.id } }") {{ tournament.name }}
</template>
