<script setup>
import { ref } from "vue";
import lightbox from "./lightbox.vue";
import cart from "./cart.vue";
import { useCartStore } from "@/stores/cartStore";

const quantity = ref(0);
const cartStore = useCartStore();

function addCartButton() {
  if (quantity.value > 0) {
    const item = {
      id: 1, // Replace with a unique identifier for the product
      name: "Fall Limited Edition Sneakers",
      price: 125.0,
      quantity: quantity.value,
    };
    cartStore.addItem(item);
  }
}
</script>


<template>
  <Navbar/>
  <!-- <cart :quantity="addCart" v-if="cartStore.toggleCart" /> -->
  <div class="lg:flex lg:justify-center justify-center gap-28 lg:items-center mx-auto lg:mt-0 mt-10 h-full w-1/2 ">
    <lightbox />
    <div class="text-left">
      <h1
        class="text-[var(--orange)] font-bold uppercase tracking-wide text-sm mb-2"
      >
        Sneaker Company
      </h1>
      <h2 class="text-2xl font-bold w-56 mb-3 lg:mb-6">
        Fall Limited Edition Sneakers
      </h2>
      <p class="text-[#a1a1a1] max-w-96 mb-5">
        These low-profile sneakers are your perfect casual wear companion.
        Featuring a durable rubber outer sole, they’ll withstand everything the
        weather can offer.
      </p>
      <div class="flex justify-between mb-6 lg:flex-col">
        <div class="flex items-center">
          <p class="text-2xl font-bold me-3">$125.00</p>
          <a class="bg-[#ff7d1a33] text-sm px-2 rounded-md">50%</a>
          
        </div>
        <del class="text-[#a1a1a1]">$250.00</del>
      </div>
      <div class="lg:flex lg:justify-between">
        <div
          class="quantity flex w-full h-12 lg:w-32 bg-[var(--color-background-mute)] rounded-md justify-between items-center mb-3"
        >
          <button @click="[quantity > 0 ? quantity-- : (quantity = 0)]">
            <svg width="12" height="4" class="m-5 fill-[var(--orange)] hover:fill-[var(--orange-dark)]" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><defs><path d="M11.357 3.332A.641.641 0 0 0 12 2.69V.643A.641.641 0 0 0 11.357 0H.643A.641.641 0 0 0 0 .643v2.046c0 .357.287.643.643.643h10.714Z" id="a"/></defs><use fill-rule="nonzero" xlink:href="#a"/></svg>
          </button>
          <p class="light:text-black font-bold">{{ quantity }}</p>
          <button @click="quantity++">
            <svg width="12" height="12" class="m-5 fill-[var(--orange)] hover:fill-[var(--orange-dark)]" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><defs><path d="M12 7.023V4.977a.641.641 0 0 0-.643-.643h-3.69V.643A.641.641 0 0 0 7.022 0H4.977a.641.641 0 0 0-.643.643v3.69H.643A.641.641 0 0 0 0 4.978v2.046c0 .356.287.643.643.643h3.69v3.691c0 .356.288.643.644.643h2.046a.641.641 0 0 0 .643-.643v-3.69h3.691A.641.641 0 0 0 12 7.022Z" id="b"/></defs><use fill-rule="nonzero" xlink:href="#b"/></svg>
          </button>
        </div>
        <button
          @click="addCartButton()"
          class="w-50 shadow-2xl lg:w-60 h-12 w-full flex justify-center items-center bg-[#ff7d1a] text-white rounded-md hover:bg-[#ff7d1a80]"
        >
          <p class="m-3 text-lg">
            <i class="fa-solid fa-cart-plus"></i>
            Add to cart
          </p>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
