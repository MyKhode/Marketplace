<script setup>
import { ref, watch } from "vue";

const props = defineProps({
  images: {
    type: Array,
    required: true,
  },
});

const currentIndex = ref(0);
const defPro = ref(props.images[currentIndex.value]);

// Watch for changes in props.images to update default product
watch(
  () => props.images,
  (newImages) => {
    if (newImages.length > 0) {
      defPro.value = newImages[currentIndex.value];
    }
  },
  { immediate: true } // This ensures it runs on initialization
);

function changePro(index) {
  currentIndex.value = index;
  defPro.value = props.images[currentIndex.value];
}
</script>

<template>
  <div class="mb-5">
    <div class="relative">
      <!-- Wrapper div instead of a button -->
      <div @click="pressed = !pressed">
        <!-- Left arrow button -->
        <button 
          class="absolute left-3 top-1/2 -translate-y-1/2 rotate-180 lg:hidden opacity-70 hover:opacity-80" 
          @click.stop="changePro((currentIndex - 1 + product_src.length) % product_src.length)"
        >
          <div class="bg-white px-3 py-2.5 rounded-full">
            <img src="/images/icon-next.svg" class="w-2.5" alt="icon-next" />
          </div>
        </button>
        <!-- Product image -->
        <img 
          :src="defPro" 
          class="w-96 h-96 object-cover rounded-lg lg:rounded-xl lg:mb-6 cursor-auto lg:cursor-pointer" 
          alt="product" 
        />
        <!-- Right arrow button -->
        <button 
          class="absolute right-3 top-1/2 -translate-y-1/2 lg:hidden opacity-70 hover:opacity-80" 
          @click.stop="changePro((currentIndex + 1) % product_src.length)"
        >
          <div class="bg-white px-3 py-2.5 rounded-full">
            <img src="/images/icon-next.svg" class="w-2.5" alt="icon-next" />
          </div>
        </button>
      </div>
    </div>
    <!-- Thumbnail navigation -->
    <div class="thumbs hidden lg:block w-96 lg:flex lg:justify-between">
      <div v-for="(product, index) in props.images" :key="index">
        <button @click="changePro(index)">
          <img
            :src="product"
            class="w-20 h-20 object-cover rounded-md hover:opacity-80"
            :class="[
              product === defThumb
                ? 'opacity-70 ring-2 ring-[var(--orange)]'
                : 'opacity-100',
            ]"
            :alt="'product-' + (index + 1) + '-thumb'"
          />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
