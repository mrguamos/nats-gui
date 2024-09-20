<template>
  <div class="flex w-full">
    <div class="flex flex-col items-center w-52">
      <div class="font-bold mb-10">NATS GUI</div>
      <Button variant="ghost">Publish1</Button>
      <Button variant="ghost">Publish2</Button>
    </div>
    <div class="flex flex-col justify-center items-center gap-y-5 w-full">
      <Card class="w-full">
        <CardHeader>
          <CardTitle>Nats Connection</CardTitle>
        </CardHeader>
        <CardContent class="flex items-center gap-x-2">
          <Input v-model="natsUrl" placeholder="nats://localhost:4222" />
          <Button :disabled="status" @click="connect()">Connect</Button>
          <Button :disabled="!status" @click="disconnect()">Disconnect</Button>
        </CardContent>
      </Card>
      <Card class="w-full">
        <CardHeader>
          <CardTitle>Publish Message</CardTitle>
        </CardHeader>
        <CardContent class="flex flex-col gap-y-3">
          <Input v-model="subject" placeholder="Subject" />
          <JsonEditorVue
            v-model="payload"
            :status-bar="false"
            :class="{ 'jse-theme-dark': isDark }"
            mode="text"
            :navigation-bar="false"
            :main-menu-bar="false"
          />
          <Button class="self-start" :disabled="!status" @click="request()">Publish</Button>
        </CardContent>
      </Card>
      <Card class="w-full">
        <CardHeader>
          <CardTitle>Response</CardTitle>
        </CardHeader>
        <CardContent class="flex flex-col gap-y-3 overflow-auto overscroll-contain">
          <div class="h-auto overflow-x-auto">
            <pre>{{ response }}</pre>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { Card, CardHeader, CardTitle, CardContent } from '@renderer/components/ui/card'
import { Input } from '@renderer/components/ui/input'
import { Button } from '@renderer/components/ui/button'
import JsonEditorVue from 'json-editor-vue'
import { useDark } from '@vueuse/core'

const isDark = useDark()
const natsUrl = ref<string>('')
const status = ref<boolean>(false)
const subject = ref('')
const payload = ref('')
const response = ref('')

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
    const res = await window.api.request(subject.value, JSON.parse(payload.value))
    response.value = JSON.stringify(res, null, 2)
  } catch (error) {
    console.error(error)
  }
}
</script>
