<script setup lang="ts">
import { supabase } from "@/services/supabase";
import { User } from "@supabase/supabase-js";
import { ref, watch } from "vue";

const user = supabase.auth.user() as User;
const metadata = user.user_metadata;
const name = ref(metadata?.nickname || user.email);

const password = ref("");
const nickname = ref(name.value);

const loading = ref(false);

// Initialize the bio from local storage or default to an empty string
const bio = ref(localStorage.getItem("userBio") || "");

// Watch the `bio` variable and save it to localStorage whenever it changes
watch(bio, (newBio) => {
  localStorage.setItem("userBio", newBio);
});

// Renamed products to productList to avoid conflict
const productList = ref([
  {
    id: 1,
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff",
    name: "Digital Flip Down Clock",
    description: "A stylish and modern clock for your workspace.",
    price: "$29.99",
  },
]);

const orders = ref([
  {
    id: 1,
    name: "Order #1",
    description: "Digitalasfasdf Clock",
    price: "$29.99",
  },
  {
    id: 2,
    name: "Order sadf #1",
    description: "Digital Flip Down Clock",
    price: "$29.99",
  },
]);

const activeTab = ref("products");

const activeTabClass =
  "text-gray-900 border-b-2 border-black";
const inactiveTabClass =
  "text-gray-400 hover:text-gray-900 border-b-2 border-transparent hover:border-black";

// Banner and profile
const bannerImage = ref(
  "https://scontent.fpnh10-1.fna.fbcdn.net/v/t39.30808-6/473809754_122170666478054769_45386897099752156_n.jpg?stp=cp6_dst-jpg_p526x296_tt6&_nc_cat=109&ccb=1-7&_nc_sid=127cfc&_nc_eui2=AeE5NOTqQFIscJoynOxTzZsbg9-W9P8hcM6D35b0_yFwzmoARe3RTTBmcRnoFgihQCwbt3BnSrY8_zLRPer9OVKN&_nc_ohc=ljW1kHhipCwQ7kNvgHPg2Hd&_nc_zt=23&_nc_ht=scontent.fpnh10-1.fna&_nc_gid=A7mHE_5VnXFg7j-TRZkyYJH&oh=00_AYAhXNzXheSmnC9m5ftbkk8-WTG85hQQRJwmC2427CcAwg&oe=678FCCDE"
);
const profileImage = ref(
  "https://scontent.fpnh10-1.fna.fbcdn.net/v/t39.30808-6/473574437_122170666340054769_6952260061557860464_n.jpg?stp=cp6_dst-jpg_p526x296_tt6&_nc_cat=110&ccb=1-7&_nc_sid=127cfc&_nc_eui2=AeH6c2o2YHZ-zA2UPyVapm-Ri_Vucm2vflSL9W5yba9-VKevVGORyERNfdrNc2h7mrlycKO-SA7x_CpdzNKxdcjY&_nc_ohc=7qltEvUMDgUQ7kNvgGYwtfH&_nc_zt=23&_nc_ht=scontent.fpnh10-1.fna&_nc_gid=A6gXidnfNu5bF_bJkDcdhzh&oh=00_AYCVQ99oMAfqdwjN5riag71zuSMS-ejMOA5KlypO-8s_Vg&oe=678FE656"
);

const isModalOpen = ref(false);
const modalImage = ref("");

function openModal(image: string) {
  modalImage.value = image;
  isModalOpen.value = true;
}

function closeModal() {
  isModalOpen.value = false;
  modalImage.value = "";
}

/* Change Password */
async function changePassword() {
  loading.value = true;
  const { error } = await supabase.auth.update({
    password: password.value,
  });
  alert(error?.message || "password successfully changed");
  password.value = "";
  loading.value = false;
}

/* Change Nickname */
async function changeNickname() {
  loading.value = true;
  const { error } = await supabase.auth.update({
    data: { nickname: nickname.value },
  });
  if (error) alert(error.message);
  else {
    alert("nickname successfully changed");
    name.value = nickname.value;
  }
  loading.value = false;
}

// Product data
const products = ref([
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff",
    name: "Digital Flip Down Clock",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed sed ante justo. Integer euismod libero id mauris malesuada tincidunt.",
    price: "$29.99",
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff",
    name: "Digital Flip Down Clock",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed sed ante justo. Integer euismod libero id mauris malesuada tincidunt.",
    price: "$29.99",
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff",
    name: "Digital Flip Down Clock",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed sed ante justo. Integer euismod libero id mauris malesuada tincidunt.",
    price: "$29.99",
  },
]);
</script>

<template>
  <div class="mt-20 text-left">
    <div class="max-w-2xl mx-auto">

      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden transition-colors duration-200">
        <div class="relative h-48">
          <img @click="openModal(bannerImage)" :src="bannerImage" alt="Cover"
            class="w-full h-full object-cover cursor-pointer" />
          <div class="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2">
            <img @click="openModal(profileImage)" :src="profileImage" alt="Profile"
              class="w-24 h-24 rounded-xl object-cover border-4 border-white dark:border-gray-800 shadow-lg cursor-pointer" />
          </div>
        </div>

        <div v-if="isModalOpen" class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div class="relative">
            <img :src="modalImage" alt="Full View" class="max-w-full max-h-screen rounded-lg" />
            <button @click="closeModal" class="absolute top-2 right-2 bg-white rounded-full p-2 shadow-lg">
              ✕
            </button>
          </div>
        </div>

        <div class="pt-16 px-6 pb-6">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div class="w-full flex flex-col items-center">
              <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Bong Sann HD</h1>
              <p class="text-1xl font-bold text-gray-600 dark:text-white">@Bong Sann HD</p>
              <div class="flex justify-between w-full mt-6 px-20 max-w-md">
                <div class="text-center transform transition-all duration-300 hover:scale-110">
                  <p
                    class="text-2xl font-bold bg-gradient-to-r from-pink-500 to-violet-500 text-transparent bg-clip-text">
                    1.2k</p>
                  <p class="text-black text-sm">FOLLOWERS</p>
                </div>
                <div class="text-center transform transition-all duration-300 hover:scale-110">
                  <p
                    class="text-2xl font-bold bg-gradient-to-r from-pink-500 to-violet-500 text-transparent bg-clip-text">
                    86</p>
                  <p class="text-black text-sm">PROJECTS</p>
                </div>
                <div class="text-center transform transition-all duration-300 hover:scale-110">
                  <p
                    class="text-2xl font-bold bg-gradient-to-r from-pink-500 to-violet-500 text-transparent bg-clip-text">
                    4.8</p>
                  <p class="text-black text-sm">RATING</p>
                </div>
              </div>
            </div>

            <!-- <a href="https://abhirajk.vercel.app/" target="_blank"
              class="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-200 text-sm font-medium">
              View Portfolio
              <svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a> -->

          </div>
          <div class="mt-6">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">Bio</h2>
            <textarea class="w-full p-2 border-2 border-gray-300 rounded-lg resize-none" rows="5"
              v-model="bio"></textarea>
          </div>

          <!-- <div class="mt-6">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">Skills</h2>
          <div class="flex flex-wrap gap-2">
            <span class="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 rounded-lg text-sm font-medium">Node.js</span>
            <span class="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 rounded-lg text-sm font-medium">React</span>
            <span class="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 rounded-lg text-sm font-medium">Tailwind CSS</span>
            <span class="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 rounded-lg text-sm font-medium">MySQL</span>
          </div>
        </div> -->

          <div class="mt-6">
            <!-- Tab Navigation -->
            <div class="flex space-x-4 border-b-2 border-gray-300">
              <button @click="activeTab = 'products'"
                :class="activeTab === 'products' ? activeTabClass : inactiveTabClass" class="px-4 py-2 font-bold">
                Products
              </button>
              <button @click="activeTab = 'orders'" :class="activeTab === 'orders' ? activeTabClass : inactiveTabClass"
                class="px-4 py-2 font-bold">
                Orders
              </button>
            </div>

            <!-- Tab Content -->
            <div class="mt-6">
              <!-- Products Tab -->
              <div v-if="activeTab === 'products'">
                <h2 class="text-3xl font-bold text-black mb-8">Products</h2>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div v-for="product in products" :key="product.id" class="bg-white rounded-lg shadow-lg p-8">
                    <div class="relative overflow-hidden">
                      <img class="object-cover w-full h-full" :src="product.image" alt="Product" />
                      <div class="absolute inset-0 bg-black opacity-40"></div>
                      <div class="absolute inset-0 flex items-center justify-center">
                        <button class="bg-white text-gray-900 py-2 px-6 rounded-full font-bold hover:bg-gray-300">
                          View
                        </button>
                      </div>
                    </div>
                    <!-- Debugging output for product.id and product.name -->
                    <h3 class="text-xl font-bold text-gray-900 mt-4">
                      {{ product.id }} - {{ product.name }} <!-- Display both id and name for debugging -->
                    </h3>
                    <p class="text-gray-500 text-sm mt-2">
                      {{ product.description }}
                    </p>
                    <div class="flex items-center justify-between mt-4">
                      <span class="text-gray-900 font-bold text-lg">
                        {{ product.price }}
                      </span>
                      <button class="bg-gray-900 text-white py-2 px-4 rounded-full font-bold hover:bg-gray-800">
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Orders Tab -->
              <div v-if="activeTab === 'orders'">
                <h2 class="text-3xl font-bold text-black mb-8">Your Orders</h2>
                <div v-if="orders.length > 0">
                  <div v-for="order in orders" :key="order.id" class="bg-white rounded-lg shadow-lg p-8 mb-4">
                    <h3 class="text-xl font-bold text-gray-900">{{ order.name }}</h3>
                    <p class="text-gray-500 text-sm mt-2">{{ order.description }}</p>
                    <span class="text-gray-900 font-bold text-lg">{{ order.price }}</span>
                  </div>
                </div>
                <div v-else>
                  <p class="text-gray-500 text-lg">No orders yet.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
