<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { useCartStore } from "../stores/cartStore";
import cart from "./cart.vue";
// import router from "@/router";
import { supabase } from "@/services/supabase";
import { User } from "@supabase/supabase-js";

const user = supabase.auth.user() as User | null;
const metadata = ref(user?.user_metadata || {});
// const name = ref(metadata.value?.nickname || user?.email);
const avatar_url = ref(metadata.value?.avatar_url || 'https://media.istockphoto.com/id/1327592449/vector/default-avatar-photo-placeholder-icon-grey-profile-picture-business-man.jpg?s=612x612&w=0&k=20&c=yqoos7g9jmufJhfkbQsk-mdhKEsih6Di4WZ66t_ib7I=');

let toggle = ref(false);
const cartStore = useCartStore();

function toggleCart() {
  cartStore.toggleCartVisibility();
}
const openCart = () => {
  cartStore.isCartVisible = true;
};
onMounted(() => {
  cartStore.loadCartFromSupabase(); // Load cart data from Supabase
});

const isMobileMenuVisible = ref(false);

function toggleMobileMenu() {
  isMobileMenuVisible.value = !isMobileMenuVisible.value;
}
//   if (user) {
//     console.log("User Metadata:", metadata.value);
//     console.log("Avatar URL :", user.user_metadata.avatar_url);
//   } else {
//     console.log("No  d user is logged in.");
//   }
// });
</script>
<template>
  <cart v-if="cartStore.isCartVisible" />

  <nav
    class="fixed top-0 left-0 right-0 z-10 mx-auto mb-10 w-full max-w-screen-xl overflow-hidden rounded-lg border border-stone-200 bg-white p-2 shadow-lg">
    <div class="flex items-center justify-between">
      <!-- Logo -->
      <div class="flex items-center">
        <router-link to="/"
          class="ml-2 block py-1 font-sans text-sm font-semibold text-current antialiased">Tinh25&nbsp; |
          &nbsp;</router-link>

        <!-- Navigation Menu -->
        <ul class="hidden lg:flex flex-row items-center gap-0">
          <a href="https://web.facebook.com/tinh25store"
            class="aria-disabled:opacity-50 aria-disabled:pointer-events-none dark:hover:text-white dark:focus:text-white dark:data-[selected=true]:text-white dark:bg-opacity-70 flex select-none items-center rounded-md bg-transparent py-1.5 px-2.5 align-middle font-sans text-stone-600 transition-all duration-300 ease-in hover:bg-stone-200 hover:text-stone-800 focus:bg-stone-200 focus:text-stone-800">
            <span class="mr-2 grid shrink-0 place-items-center">
              <i class="fa-brands fa-square-facebook"></i>
            </span>
            <small class="font-sans text-sm text-current antialiased">Facebook</small>
          </a>
          <a href="#"
            class="aria-disabled:opacity-50 aria-disabled:pointer-events-none dark:hover:text-white dark:focus:text-white dark:data-[selected=true]:text-white dark:bg-opacity-70 flex select-none items-center rounded-md bg-transparent py-1.5 px-2.5 align-middle font-sans text-stone-600 transition-all duration-300 ease-in hover:bg-stone-200 hover:text-stone-800 focus:bg-stone-200 focus:text-stone-800">
            <span class="mr-2 grid shrink-0 place-items-center">
              <i class="fa-solid fa-book-quran"></i>
            </span>
            <small class="font-sans text-sm text-current antialiased">Docs</small>
          </a>
        </ul>
      </div>

      <!-- Right Section -->
      <div class="flex items-center space-x-4">
        <!-- Cart Button -->
        <button ref="{{cartStore.cartRef}}" v-if="(['/', '/product/'].some(path => $route.path.startsWith(path)))"
          @click="toggleCart"
          class="cart-toggle-btn flex items-center justify-center rounded-md bg-stone-200 px-2 py-1 text-sm text-stone-800 hover:bg-stone-300">
          <i class="fa-solid fa-cart-arrow-down"></i>&nbsp;
          <div class="hidden lg:block">Cart</div> ({{ cartStore.cartItems.length }})
        </button>

        <!-- Profile Picture -->
        <router-link :to="`/profile/${user?.user_metadata?.full_name.replace(/\s+/g, '-')}`">
          <img aria-expanded="false" aria-haspopup="menu" id=":RlH2:" :src="avatar_url" alt="profile-picture"
            class="inline-block h-8 w-8 rounded border border-stone-800 object-cover object-center" />
        </router-link>

        <!-- Hamburger Menu (Mobile) -->
        <button @click="toggleMobileMenu"
          class="lg:hidden flex items-center justify-center rounded-md bg-transparent px-2 py-1 text-stone-800">
          <svg width="1.5em" height="1.5em" stroke-width="1.5" viewBox="0 0 24 24" fill="none"
            xmlns="http://www.w3.org/2000/svg" color="currentColor" class="h-4 w-4">
            <path d="M3 5H21" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path>
            <path d="M3 12H21" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path>
            <path d="M3 19H21" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path>
          </svg>
        </button>
      </div>
    </div>

    <!-- Mobile Dropdown Menu -->
    <div v-if="isMobileMenuVisible" class="mt-2 flex flex-col gap-2 lg:hidden text-left">
      <a href="https://web.facebook.com/tinh25store" class="block rounded-md bg-stone-200 px-2 py-1 text-stone-800 hover:bg-stone-300">
        <i class="fa-brands fa-square-facebook"></i>
        <span class="ml-2">Facebook</span>
      </a>
      <a href="#" class="block rounded-md bg-stone-200 px-2 py-1 text-stone-800 hover:bg-stone-300">
        <i class="fa-solid fa-book-quran"></i>
        <span class="ml-2">Docs</span>
      </a>
      <router-link :to="`/profile/${user?.user_metadata?.full_name.replace(/\s+/g, '-')}`"
        class="block rounded-md bg-stone-200 px-2 py-1 text-stone-800 hover:bg-stone-300">
        Profile
      </router-link>
    </div>
  </nav>
</template>