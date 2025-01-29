<script setup>
const props = defineProps({
  value: {
    type: String,
    required: true
  },
  typeNotification: {
    type: String,
    required: true
  }
})
</script>
<template>
  <div id="toast-success"
    class="fixed flex lg:right-80 lg:top-20 right-2 top-2 z-50 dark:text-gray-400 dark:bg-gray-800 mb-4 flex w-full max-w-xs items-center rounded-lg bg-white p-4 text-gray-500 shadow"
    role="alert">
    <!-- success notification -->
    <div v-if="props.typeNotification === 'success'" 
      class="dark:bg-green-800 dark:text-green-200 inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-500">
      <i class="fa-regular fa-circle-check"></i>
      <span class="sr-only">Check icon</span>
    </div>
    <div v-else-if="props.typeNotification === 'warning'"
      class="dark:bg-yellow-800 dark:text-yellow-200 inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-yellow-100 text-yellow-500">
      <i class="fa-solid fa-triangle-exclamation"></i>
      <span class="sr-only">Check icon</span>
    </div>
    <div v-else-if="props.typeNotification === 'error'"
      class="dark:bg-red-800 dark:text-red-200 inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-500">
      <i class="fa-solid fa-circle-xmark"></i>
      <span class="sr-only">Check icon</span>
    </div>
    <div class="ms-3 text-sm font-normal">{{ props.value }} {{ props.typeNotification }}</div>
    <button type="button"
      class="dark:text-gray-500 dark:hover:text-white dark:bg-gray-800 dark:hover:bg-gray-700 -mx-1.5 -my-1.5 ms-auto inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-900 focus:ring-2 focus:ring-gray-300"
      data-dismiss-target="#toast-success" aria-label="Close">
      <span class="sr-only">Close</span>
      <i class="fa-solid fa-xmark"></i>
    </button>
  </div>
</template>
