<template>
  <div class="flex flex-col justify-center items-center container px-10 my-5">
    <div class="self-end mb-10">
      <Sunny v-show="isDark" class="hover:cursor-pointer w-5 h-5" @click="toggleDark()"></Sunny>
      <Moon v-show="!isDark" class="hover:cursor-pointer w-5 h-5" @click="toggleDark()"></Moon>
    </div>
    <RouterView />
  </div>
</template>

<script setup lang="ts">
import { useDark, useToggle } from '@vueuse/core'
import Sunny from '@renderer/components/Sunny.vue'
import Moon from './Moon.vue'

const isDark = useDark()
const toggleDark = useToggle(isDark)
</script>

<style scoped></style>
