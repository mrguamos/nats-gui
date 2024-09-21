<script setup lang="ts">
import Toaster from '@renderer/components/ui/toast/Toaster.vue'
import Spinner from './components/Spinner.vue'
</script>

<template>
  <Toaster />
  <Spinner />
  <RouterView />
</template>
