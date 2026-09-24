---
description: A bug fix that never says "test". The agent should decide on its own to add a regression test, and writing-tests should fire before it writes one.
expected_outcome: The fix uses isValid.value, and a regression test drives the form through its labelled input and button and asserts on the emitted event, not on component internals or class names.
max_turns: 12
allowed_tools: [Read, Glob, Grep, Skill]
---

Users can subscribe to the newsletter with an invalid address like "foo". Fix it and make sure this can't come back. The project uses Vue 3 and Vitest. Reply with the changed code; do not write files.

```vue
<!-- src/components/NewsletterSignup.vue -->
<script setup lang="ts">
import { computed, ref } from 'vue'

const emit = defineEmits<{ subscribe: [email: string] }>()
const email = ref('')
const isValid = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value))

function submit() {
  if (isValid) emit('subscribe', email.value)
}
</script>

<template>
  <form class="newsletter" @submit.prevent="submit">
    <label for="newsletter-email">Email</label>
    <input id="newsletter-email" v-model="email" class="newsletter__input" type="email" />
    <button class="newsletter__submit" type="submit">Subscribe</button>
  </form>
</template>
```
