<template>
  <div class="h-screen">
    <div class="border-r fixed h-full top-0 left-0 w-80 overflow-y-auto">
      <div class="flex flex-col items-center">
        <div class="my-10">
          <Sunny v-show="isDark" class="hover:cursor-pointer w-5 h-5" @click="toggleDark()"></Sunny>
          <Moon v-show="!isDark" class="hover:cursor-pointer w-5 h-5" @click="toggleDark()"></Moon>
        </div>
        <div class="font-bold mb-10">NATS GUI</div>
        <Button class="mb-2" @click="addPublisher()"> + </Button>
        <Button
          v-for="(publisher, idx) in publishers"
          :key="idx"
          class="block mb-2 max-w-72 w-full overflow-ellipsis overflow-hidden"
          :class="{ 'bg-secondary': selectedPublisher === idx }"
          variant="ghost"
          @click="
            () => {
              selectedPublisher = idx
              currentPublisher = publishers[selectedPublisher]
            }
          "
          >{{ publisher.subject }}</Button
        >
      </div>
    </div>
    <div v-if="currentPublisher" class="ml-80 flex flex-col gap-y-10 p-10">
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
        <CardContent class="flex flex-col gap-y-10">
          <Input v-model="currentPublisher.subject" placeholder="Subject" />
          <div class="flex flex-col w-full max-h-64 overflow-y-auto border p-5 gap-y-3 rounded-lg">
            <span>Headers</span>
            <div v-for="(header, idx) of currentPublisher.headers" :key="idx" class="flex gap-5">
              <Input v-model="header.key" class="w-1/2" placeholder="Key" />
              <Input v-model="header.value" class="w-1/2" placeholder="Value" />
              <Button @click="currentPublisher?.headers?.splice(idx, 1)">X</Button>
            </div>
            <div class="flex justify-end mt-10">
              <Button @click="currentPublisher?.headers?.push({ key: '', value: '' })">+</Button>
            </div>
          </div>
          <span>Payload</span>
          <JsonEditorVue
            v-model="currentPublisher.payload"
            :status-bar="false"
            :class="{ 'jse-theme-dark': isDark }"
            mode="text"
            :navigation-bar="false"
            :main-menu-bar="false"
          />
        </CardContent>
        <CardFooter class="flex justify-between">
          <Button :disabled="!status" @click="request()">Publish</Button>
          <Button :disabled="publishers.length === 1" variant="outline" @click="remove()">
            Delete
          </Button>
        </CardFooter>
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
  </div>
</template>

<script lang="ts" setup>
import Sunny from '@renderer/components/Sunny.vue'
import Moon from '@renderer/components/Moon.vue'
import { onMounted, ref } from 'vue'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@renderer/components/ui/card'
import { Input } from '@renderer/components/ui/input'
import { Button } from '@renderer/components/ui/button'
import JsonEditorVue from 'json-editor-vue'
import { useDark, useToggle } from '@vueuse/core'
import { useToast } from '@renderer/components/ui/toast/use-toast'
import { useGlobalState } from '@renderer/composables/store'

type NatsHeader = {
  key: string
  value: string
}

const state = useGlobalState()
const isDark = useDark()
const natsUrl = ref<string>('')
const status = ref<boolean>(false)
const selectedPublisher = ref<number>(0)

const currentPublisher = ref<Publisher | null>(null)

const toggleDark = useToggle(isDark)

const { toast } = useToast()

const connect = async () => {
  try {
    state.loading.value = true
    await window.api.connect(natsUrl.value)
    status.value = true
    toast({
      duration: 5000,
      title: 'Nats Connection',
      description: 'Connected successfully'
    })
  } catch (error) {
    toast({
      duration: 5000,
      variant: 'destructive',
      title: 'Nats Connection',
      description: `Failed to connect. ${error}`
    })
  } finally {
    state.loading.value = false
  }
}

const disconnect = async () => {
  try {
    state.loading.value = true
    await window.api.disconnect(natsUrl.value)
    status.value = false
    toast({
      duration: 5000,
      title: 'Nats Connection',
      description: 'Disconnected successfully'
    })
  } catch (error) {
    toast({
      duration: 5000,
      variant: 'destructive',
      title: 'Nats Connection',
      description: `Failed to disconnect. ${error}`
    })
  } finally {
    state.loading.value = false
  }
}

const request = async () => {
  try {
    state.loading.value = true
    if (currentPublisher.value) {
      if (currentPublisher.value?.payload) {
        const res = await window.api.request(
          currentPublisher.value?.subject,
          JSON.parse(currentPublisher.value.payload),
          JSON.stringify(currentPublisher.value.headers)
        )
        currentPublisher.value.response = JSON.stringify(res, null, 2)
      }
      publishers.value[selectedPublisher.value] = currentPublisher.value
      window.localStorage.setItem('publishers', JSON.stringify(publishers.value))
    }
  } catch (error) {
    toast({
      duration: 5000,
      variant: 'destructive',
      title: 'Nats',
      description: `Failed to publish. ${error}`
    })
  } finally {
    state.loading.value = false
  }
}

type Publisher = {
  subject: string
  payload?: string
  response?: string
  headers?: NatsHeader[]
}

const addPublisher = () => {
  currentPublisher.value = {
    payload: '',
    response: '',
    subject: 'nats.subject',
    headers: []
  }
  selectedPublisher.value = publishers.value.length
  publishers.value.push(currentPublisher.value)
  window.localStorage.setItem('publishers', JSON.stringify(publishers.value))
}

const remove = () => {
  if (publishers.value.length === 1) return
  publishers.value.splice(selectedPublisher.value, 1)
  selectedPublisher.value = 0
  currentPublisher.value = publishers.value[selectedPublisher.value]
  window.localStorage.setItem('publishers', JSON.stringify(publishers.value))
}

window.api.onDisconnected(() => {
  status.value = false
  toast({
    duration: 5000,
    title: 'Nats Connection',
    description: 'Disconnected'
  })
})

window.api.onReconnected(() => {
  status.value = true
  toast({
    duration: 5000,
    title: 'Nats Connection',
    description: 'Reconnected'
  })
})

const publishers = ref<Publisher[]>([])
onMounted(() => {
  const data = window.localStorage.getItem('publishers')
  publishers.value = data ? JSON.parse(data) : []
  if (publishers.value.length === 0) {
    addPublisher()
  } else {
    selectedPublisher.value = 0
    currentPublisher.value = publishers.value[selectedPublisher.value]
  }
})
</script>
