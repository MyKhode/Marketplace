<script setup lang="ts">
import { ref, onMounted } from "vue";
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
  console.log(cartStore.toggleCart);
}

// Log user metadata on component mount
// onMounted(() => {
//   if (user) {
//     console.log("User Metadata:", metadata.value);
//     console.log("Avatar URL :", user.user_metadata.avatar_url);
//   } else {
//     console.log("No  d user is logged in.");
//   }
// });
</script>

<template>
  <cart v-if="cartStore.toggleCart" />
  
  <nav
    class="fixed top-0 left-0 right-0 z-10 shadow-stone-950/5 mx-auto w-full max-w-screen-xl overflow-hidden rounded-lg border border-stone-200 bg-white p-2 shadow-lg">
    <div class="flex items-center">
      <router-link to="/" class="ml-2 mr-2 block py-1 font-sans text-sm font-semibold text-current antialiased">Marketplace</router-link>
      <hr class="border-secondary-dark mx-1 hidden h-5 w-px border-l border-t-0 lg:block" />
      <div class="hidden lg:block">
        <ul class="min-w-60 mt-4 flex flex-col gap-1 lg:mt-0 lg:flex-row lg:items-center">
          <button class="group outline-none">
            <li
              class="aria-disabled:opacity-50 aria-disabled:pointer-events-none dark:hover:text-white dark:focus:text-white dark:data-[selected=true]:text-white dark:bg-opacity-70 flex select-none items-center rounded-md bg-transparent py-1.5 px-2.5 align-middle font-sans text-stone-600 transition-all duration-300 ease-in hover:bg-stone-200 hover:text-stone-800 focus:bg-stone-200 focus:text-stone-800">
              <span class="me-2.5 me-1.5 grid shrink-0 place-items-center"><svg width="1.5em" height="1.5em"
                  viewBox="0 0 24 24" stroke-width="1.5" fill="none" xmlns="http://www.w3.org/2000/svg"
                  color="currentColor" class="h-4 w-4">
                  <path d="M7 18H10.5H14" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path>
                  <path d="M7 14H7.5H8" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path>
                  <path d="M7 10H8.5H10" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path>
                  <path d="M7 2L16.5 2L21 6.5V19" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                  </path>
                  <path
                    d="M3 20.5V6.5C3 5.67157 3.67157 5 4.5 5H14.2515C14.4106 5 14.5632 5.06321 14.6757 5.17574L17.8243 8.32426C17.9368 8.43679 18 8.5894 18 8.74853V20.5C18 21.3284 17.3284 22 16.5 22H4.5C3.67157 22 3 21.3284 3 20.5Z"
                    stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path>
                  <path d="M14 5V8.4C14 8.73137 14.2686 9 14.6 9H18" stroke="currentColor" stroke-linecap="round"
                    stroke-linejoin="round"></path>
                </svg>
              </span>
              <small class="font-sans text-sm text-current antialiased">Pages</small>
              <span class="ps-2.5 ms-auto ps-0.5 grid shrink-0 place-items-center"><svg width="1.5em" height="1.5em"
                  stroke-width="1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"
                  color="currentColor" class="group-data-[open=true]:rotate-180 h-3.5 w-3.5">
                  <path d="M6 9L12 15L18 9" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path>
                </svg>
              </span>
            </li>
          </button>
          <router-link to="/profile">
            <a href="#"
              class="aria-disabled:opacity-50 aria-disabled:pointer-events-none dark:hover:text-white dark:focus:text-white dark:data-[selected=true]:text-white dark:bg-opacity-70 flex select-none items-center rounded-md bg-transparent py-1.5 px-2.5 align-middle font-sans text-stone-600 transition-all duration-300 ease-in hover:bg-stone-200 hover:text-stone-800 focus:bg-stone-200 focus:text-stone-800">
              <span class="me-2.5 mr-1.5 grid shrink-0 place-items-center"><svg width="1.5em" height="1.5em"
                  stroke-width="1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"
                  color="currentColor" class="h-4 w-4">
                  <path
                    d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2Z"
                    stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path>
                  <path d="M4.271 18.3457C4.271 18.3457 6.50002 15.5 12 15.5C17.5 15.5 19.7291 18.3457 19.7291 18.3457"
                    stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path>
                  <path
                    d="M12 12C13.6569 12 15 10.6569 15 9C15 7.34315 13.6569 6 12 6C10.3431 6 9 7.34315 9 9C9 10.6569 10.3431 12 12 12Z"
                    stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path>
                </svg>
              </span>
              <small class="font-sans text-sm text-current antialiased">Account</small>
            </a>
          </router-link>
          <a href="#"
            class="aria-disabled:opacity-50 aria-disabled:pointer-events-none dark:hover:text-white dark:focus:text-white dark:data-[selected=true]:text-white dark:bg-opacity-70 flex select-none items-center rounded-md bg-transparent py-1.5 px-2.5 align-middle font-sans text-stone-600 transition-all duration-300 ease-in hover:bg-stone-200 hover:text-stone-800 focus:bg-stone-200 focus:text-stone-800">
            <span class="me-2.5 mr-1.5 grid shrink-0 place-items-center"><svg width="1.5em" height="1.5em"
                stroke-width="1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"
                color="currentColor" class="h-4 w-4">
                <path
                  d="M21 7.35304L21 16.647C21 16.8649 20.8819 17.0656 20.6914 17.1715L12.2914 21.8381C12.1102 21.9388 11.8898 21.9388 11.7086 21.8381L3.30861 17.1715C3.11814 17.0656 3 16.8649 3 16.647L2.99998 7.35304C2.99998 7.13514 3.11812 6.93437 3.3086 6.82855L11.7086 2.16188C11.8898 2.06121 12.1102 2.06121 12.2914 2.16188L20.6914 6.82855C20.8818 6.93437 21 7.13514 21 7.35304Z"
                  stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path>
                <path d="M3.52844 7.29357L11.7086 11.8381C11.8898 11.9388 12.1102 11.9388 12.2914 11.8381L20.5 7.27777"
                  stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path>
                <path d="M12 21L12 12" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path>
                <path
                  d="M11.6914 11.8285L3.89139 7.49521C3.49147 7.27304 3 7.56222 3 8.01971V16.647C3 16.8649 3.11813 17.0656 3.30861 17.1715L11.1086 21.5048C11.5085 21.727 12 21.4378 12 20.9803V12.353C12 12.1351 11.8819 11.9344 11.6914 11.8285Z"
                  fill="currentColor" stroke="currentColor" stroke-linejoin="round"></path>
              </svg>
            </span>
            <small class="font-sans text-sm text-current antialiased">Blocks</small>
          </a>
          <a href="#"
            class="aria-disabled:opacity-50 aria-disabled:pointer-events-none dark:hover:text-white dark:focus:text-white dark:data-[selected=true]:text-white dark:bg-opacity-70 flex select-none items-center rounded-md bg-transparent py-1.5 px-2.5 align-middle font-sans text-stone-600 transition-all duration-300 ease-in hover:bg-stone-200 hover:text-stone-800 focus:bg-stone-200 focus:text-stone-800">
            <span class="me-2.5 mr-1.5 grid shrink-0 place-items-center"><svg width="1.5em" height="1.5em"
                stroke-width="1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"
                color="currentColor" class="h-4 w-4">
                <path d="M7 6L17 6" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path>
                <path d="M7 9L17 9" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path>
                <path d="M9 17H15" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path>
                <path
                  d="M3 12H2.6C2.26863 12 2 12.2686 2 12.6V21.4C2 21.7314 2.26863 22 2.6 22H21.4C21.7314 22 22 21.7314 22 21.4V12.6C22 12.2686 21.7314 12 21.4 12H21M3 12V2.6C3 2.26863 3.26863 2 3.6 2H20.4C20.7314 2 21 2.26863 21 2.6V12M3 12H21"
                  stroke="currentColor"></path>
              </svg>
            </span>
            <small class="font-sans text-sm text-current antialiased">Docs</small>
          </a>
        </ul>
      </div>
      <button
        class="ml-auto mr-2 grid min-h-[34px] min-w-[34px] select-none place-items-center rounded-md border border-transparent bg-transparent text-center align-middle font-sans text-sm font-medium text-stone-800 shadow-none transition-all duration-300 ease-in hover:border-stone-600/10 hover:bg-stone-200/10 hover:shadow-none disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none lg:hidden">
        <svg width="1.5em" height="1.5em" stroke-width="1.5" viewBox="0 0 24 24" fill="none"
          xmlns="http://www.w3.org/2000/svg" color="currentColor" class="h-4 w-4">
          <path d="M3 5H21" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path>
          <path d="M3 12H21" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path>
          <path d="M3 19H21" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path>
        </svg>
      </button>
      <div class="flex items-center space-x-2 lg:ml-auto">
        <button v-if="(['/', '/product/,'].some(path => $route.path.startsWith(path)))" @click="toggleCart" class="ml-2 flex items-center justify-center rounded-md bg-stone-200 px-2 py-1 text-sm text-stone-800 hover:bg-stone-300">
          <i class="fa-solid fa-cart-arrow-down"></i> &nbsp;
          <div class="hidden lg:block">Cart</div> ({{ cartStore.cartItems.length }})
        </button>
        <router-link to="/profile">
          <img aria-expanded="false" aria-haspopup="menu" id=":RlH2:" :src="avatar_url " alt="profile-picture"
          class="group inline-block h-8 w-8 rounded border border-stone-800 object-cover object-center p-0.5 outline-none" />
        </router-link>
      </div>
    </div>
  </nav>
</template>
