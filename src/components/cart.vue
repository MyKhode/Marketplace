<script setup>
// import { useCartStore } from "@/stores/cartStore";

const cartStore = useCartStore();

onMounted(() => {
  cartStore.loadCartFromCookie(); // Load cart data from the cookie
});
</script>

<template>
  <div class="flex justify-center content-center">
    <div class="absolute top-16 lg:top-15 lg:right-10 z-20 w-80 bg-[var(--color-background)] rounded-lg shadow-2xl bg-white dark:bg-[#1A202C]">
      <div class="title p-4">
        <p class="font-bold">Cart</p>
      </div>
      <div class="divider h-px bg-[var(--color-border)]"></div>
      <div class="body text-[#a1a1a1] font-bold text-center p-5">
        <div v-if="cartStore.cartItems.length > 0">
          <!-- Loop through cart items -->
          <div
            v-for="item in cartStore.cartItems"
            :key="item.id"
            class="flex justify-between items-center mb-4"
          >
            <div>
              <img
                :src="item.image || '/images/image-product-1-thumbnail.jpg'"
                class="w-10 rounded"
                alt="product"
              />
            </div>
            <div class="text-start">
              <h3 class="text-sm">{{ item.name }}</h3>
              <p class="text-sm">
                ${{ item.price.toFixed(2) }} x {{ item.quantity }}
                <strong class="text-black dark:text-white ms-1">
                  ${{ (item.price * item.quantity).toFixed(2) }}
                </strong>
              </p>
            </div>
            <div>
              <button
                @click="cartStore.removeItem(item.id)"
                class="text-red-500 hover:text-red-700"
              >
              <i class="fa-solid fa-trash-can"></i>
              </button>
            </div>
          </div>
          <!-- Checkout button -->
          <button
            class="bg-orange-500 w-full h-12 mt-4 text-sm text-white rounded-lg hover:bg-orange-600"
          >
            Checkout
          </button>
        </div>
        <p class="mt-6" v-else>Your cart is empty</p>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
