<template>
  <ResizablePanelGroup class="min-h-screen" direction="horizontal">
    <ResizablePanel class="border-r" :default-size="25">
      <div class="flex flex-col items-center">
        <div class="mb-10 mt-10">
          <Sunny v-show="isDark" class="hover:cursor-pointer w-5 h-5" @click="toggleDark()"></Sunny>
          <Moon v-show="!isDark" class="hover:cursor-pointer w-5 h-5" @click="toggleDark()"></Moon>
        </div>
        <div class="font-bold mb-10">NATS GUI</div>
        <Button class="mb-2" @click="addPublisher()"> + </Button>
        <Button
          v-for="(publisher, idx) in publishers"
          :key="idx"
          class="mb-2"
          :class="{ 'bg-secondary': selectedPublisher === idx }"
          variant="ghost"
          @click="
            () => {
              selectedPublisher = idx
              currentPublisher = publishers[selectedPublisher]
            }
          "
          >{{ publisher.name }}</Button
        >
      </div>
    </ResizablePanel>

    <ResizablePanel :default-size="75">
      <div v-if="currentPublisher" class="flex grow flex-col gap-y-5 p-10">
        <Card class="">
          <CardHeader>
            <CardTitle>Nats Connection</CardTitle>
          </CardHeader>
          <CardContent class="flex items-center gap-x-2">
            <Input v-model="natsUrl" placeholder="nats://localhost:4222" />
            <Button :disabled="status" @click="connect()">Connect</Button>
            <Button :disabled="!status" @click="disconnect()">Disconnect</Button>
          </CardContent>
        </Card>
        <Card class="">
          <CardHeader>
            <CardTitle>Publish Message</CardTitle>
          </CardHeader>
          <CardContent class="flex flex-col gap-y-3">
            <Input v-model="currentPublisher.subject" placeholder="Subject" />
            <JsonEditorVue
              v-model="currentPublisher.payload"
              :status-bar="false"
              :class="{ 'jse-theme-dark': isDark }"
              mode="text"
              :navigation-bar="false"
              :main-menu-bar="false"
            />
            <Button class="self-start" :disabled="!status" @click="request()">Publish</Button>
          </CardContent>
        </Card>
        <Card class="">
          <CardHeader>
            <CardTitle>Response</CardTitle>
          </CardHeader>
          <CardContent class="">
            <div class="overflow-x-auto">
              <pre class="">{{ currentPublisher?.response }}</pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </ResizablePanel>
  </ResizablePanelGroup>
</template>

<script lang="ts" setup>
import Sunny from '@renderer/components/Sunny.vue'
import Moon from '@renderer/components/Moon.vue'
import { onMounted, ref } from 'vue'
import { Card, CardHeader, CardTitle, CardContent } from '@renderer/components/ui/card'
import { Input } from '@renderer/components/ui/input'
import { Button } from '@renderer/components/ui/button'
import { ResizablePanelGroup, ResizablePanel } from '@renderer/components/ui/resizable'
import JsonEditorVue from 'json-editor-vue'
import { useDark, useToggle } from '@vueuse/core'

const isDark = useDark()
const natsUrl = ref<string>('')
const status = ref<boolean>(false)
const selectedPublisher = ref<number>(0)

const currentPublisher = ref<Publisher | null>(null)

const toggleDark = useToggle(isDark)

const connect = async () => {
  try {
    await window.api.connect(natsUrl.value)
    status.value = true
  } catch (error) {
    console.error(error)
  }
}

const disconnect = async () => {
  try {
    await window.api.disconnect(natsUrl.value)
    status.value = false
  } catch (error) {
    console.error(error)
  }
}

const request = async () => {
  try {
    if (currentPublisher.value) {
      publishers.value[selectedPublisher.value] = currentPublisher.value
    }
    if (currentPublisher.value?.payload) {
      const res = await window.api.request(
        currentPublisher.value?.subject,
        JSON.parse(currentPublisher.value.payload)
      )
      currentPublisher.value.response = JSON.stringify(res, null, 2)
    }
  } catch (error) {
    console.error(error)
  }
}

type Publisher = {
  name: string
  subject?: string
  payload?: string
  response?: string
}

const addPublisher = () => {
  currentPublisher.value = {
    name: `Publisher - ${publishers.value.length}`,
    payload: '',
    response: ''
  }
  publishers.value.push(currentPublisher.value)
}

const publishers = ref<Publisher[]>([])
onMounted(() => {
  if (publishers.value.length === 0) addPublisher()
})
</script>
