<template>
  <div
    v-if="isLoading"
    class="fixed inset-0 flex items-center justify-center bg-background/50 z-50"
  >
    <div
      class="w-16 h-16 border-4 border-t-4 border-foreground border-t-primary rounded-full animate-spin"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { useGlobalState } from '@renderer/composables/store'
const state = useGlobalState()
const isLoading = state.loading
</script>

<style scoped>
/* No additional styles needed as we are using Tailwind CSS */
</style>
