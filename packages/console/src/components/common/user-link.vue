<script setup lang="ts">
import { User } from "@frilan/models"
import EventLink from "./event-link.vue"

defineProps<{ user: User }>()
</script>

<template lang="pug">
event-link(to="user" :params="{ name: user.username }") {{ user.displayName }}
</template>
