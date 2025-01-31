<script setup>
import { ref, watch } from "vue";

// Props for passing the images array
const props = defineProps({
  images: {
    type: Array,
    required: true,
  },
});

// State to track the current image index
const currentIndex = ref(0);

// State for the currently displayed image
const displayedImage = ref(props.images[currentIndex.value]);

// Watch for changes in the images array to update the displayed image
watch(
  () => props.images,
  (newImages) => {
    if (newImages.length > 0) {
      displayedImage.value = newImages[currentIndex.value];
    }
  },
  { immediate: true }
);

// Function to change the displayed image
function changeImage(index) {
  currentIndex.value = index;
  displayedImage.value = props.images[currentIndex.value];
}
</script>

<template>
  <div class="product-cart flex grid grid-cols-0 flex-col justify-center items-center">
    <!-- Main Image Section -->
    <div class="relative w-full h-auto px-1 py-4 max-w-lg">
      <!-- Left Arrow -->
      <button
        class="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white p-2 rounded-full shadow-md hover:bg-gray-200 lg:hidden"
        @click.stop="changeImage((currentIndex - 1 + props.images.length) % props.images.length)"
      >
        <img src="/images/icon-previous.svg" alt="Previous" class="w-4 h-4" />
      </button>

      <!-- Main Product Image -->
      <img
        :src="displayedImage"
        class="w-96 h-auto mx-auto  object-cover rounded-md shadow-md cursor-pointer"
        alt="Main Product"
      />

      <!-- Right Arrow -->
      <button
        class="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white p-2 rounded-full shadow-md hover:bg-gray-200 lg:hidden"
        @click.stop="changeImage((currentIndex + 1) % props.images.length)"
      >
        <img src="/images/icon-next.svg" alt="Next" class="w-4 h-4" />
      </button>
    </div>

    <!-- Thumbnail Navigation -->
    <div
      class="thumbnails mx-auto flex flex-wrap mt-4"
    >
      <div
        v-for="(image, index) in props.images"
        :key="index"
        class="thumbnail-wrapper"
      >
        <button
          @click="changeImage(index)"
          class="outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
        >
          <img
            :src="image"
            :class="[
              'w-20 h-auto rounded-md object-cover border-2 transition-opacity',
              index === currentIndex.value
                ? 'border-orange-500 opacity-70'
                : 'border-gray-200 hover:opacity-80',
            ]"
            :alt="'Thumbnail ' + (index + 1)"
          />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.product-cart {
  width: 100%;
}

.thumbnails {
  display: flex;
  justify-content: center;
  gap: 1rem;
}
</style>
