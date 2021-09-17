<script setup lang="ts">
import { User } from "@frilan/models"

defineProps<{ user: User }>()
</script>

<template lang="pug">
router-link(:to="{ name: 'user', params: { name: user.username } }") {{ user.displayName }}
</template>
