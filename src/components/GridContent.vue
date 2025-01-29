<script>
import { ref, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { supabase } from "@/services/supabase";
import SkeletonProduct from "@/components/SkeletonProduct.vue";
import Notification from "./Notification.vue";

// Content List
// 1. State Variables
// 2. Fetch Products Function
// 3. Watchers
// 4. Computed Filter
// 5. Category Handling
// 6. Lifecycle Hook
// 7. Click Event Handler (Start / End)

export default {
  setup() {
    // 1. State Variables
    const activeCategory = ref("all");
    const categories = ref(["all"]);
    const products = ref([]);
    const inputSearch = ref("");
    const loading = ref(true);
    const notification = ref(false);
    const notificationMessage = ref("");
    const typeNotification = ref("");
    const route = useRoute();
    const router = useRouter();
    const wishlist = ref([]);
    const orders = ref([]);

    // 2. Fetch Products Function
    const fetchProducts = async () => {
      loading.value = true;
      const { data: productData } = await supabase
        .from("product")
        .select(
          "product_id, title, price, discount, stock, thumbnail, category_id"
        );

      const { data: categoryData } = await supabase
        .from("product_category")
        .select("category_id, name");

      categories.value = [
        "all",
        ...categoryData.map((category) => category.name),
      ];
      products.value = productData.map((product) => {
        const category = categoryData.find(
          (cat) => cat.category_id === product.category_id
        );
        return {
          id: product.product_id,
          name: product.title,
          price: product.price,
          discount: product.discount,
          stock: product.stock,
          image: product.thumbnail,
          category: category ? category.name : "other",
        };
      });
      loading.value = false;
    };

    const fetchWishlist = async () => {
      const { data: wishlistData } = await supabase
        .from("users")
        .select("wishlist")
        .eq("id", supabase.auth.user().id)
        .single();

      try {
        wishlist.value = JSON.parse(wishlistData.wishlist || "[]"); // Parse JSON string
      } catch (e) {
        wishlist.value = [];
      }
    };

    // Update wishlist function to ensure reactivity
    const addToWishlist = async (productId) => {
      const standardizedProductId = String(productId);

      // Toggle logic: Add or remove based on inclusion
      const isProductInWishlist = wishlist.value.includes(standardizedProductId);
      wishlist.value = isProductInWishlist
        ? wishlist.value.filter((id) => id !== standardizedProductId)
        : [...wishlist.value, standardizedProductId];

      // Ensure `wishlist` is stored as a proper JSON array
      const { error } = await supabase
        .from("users")
        .update({ wishlist: JSON.stringify(wishlist.value) }) // Convert to JSON string
        .eq("id", supabase.auth.user().id);

      if (error) {
        console.error("Error updating wishlist:", error);
      }

      return !isProductInWishlist; // Return true if product was added, false if removed
    };
    const fetchOrders = async () => {
      try {
        const { data, error } = await supabase
          .from("order")
          .select("*");

        if (error) {
          console.error("Error fetching orders:", error.message);
          return;
        }

        orders.value = data;
      } catch (err) {
        console.error("Unexpected error while fetching orders:", err);
      }
    };

    // Proper watch to track changes and react
    watch(wishlist, (newWishlist) => {
      if (!Array.isArray(newWishlist)) {
        console.warn("Wishlist is not an array. Resetting to an empty array.");
        wishlist.value = [];
      }
    });

    // 3. Watchers
    watch(() => route.params.id, fetchProducts);
    watch(activeCategory, fetchProducts);
    watch(wishlist, fetchWishlist);

    // 4. Computed Filter
    const filteredProducts = computed(() => {
      return products.value.filter((product) => {
        const matchesCategory =
          activeCategory.value === "all" ||
          product.category === activeCategory.value;
        const matchesSearch = product.name
          .toLowerCase()
          .includes(inputSearch.value.toLowerCase());
        return matchesCategory && matchesSearch;
      });
    });

    // 5. Category Handling
    function setActiveCategory(category) {
      activeCategory.value = category;
    }

    // 6. Lifecycle Hook
    onMounted(() => {
      fetchProducts(), fetchWishlist(), fetchOrders();
    });

    // 7. Click Event Handler (Start)
    let clickTimeout = null;

    // Handle single click (navigate to product)
    const handleClick = (product) => {
      if (clickTimeout) clearTimeout(clickTimeout);
      clickTimeout = setTimeout(() => {
        router.push(`/product/${product.id}`);
      }, 250); // Delay to distinguish single click
    };

    // Updated handleDoubleClick function
    const handleDoubleClick = async (product) => {
      if (clickTimeout) clearTimeout(clickTimeout);
      notification.value = true;

      const wasAdded = await addToWishlist(product.id); // Toggle the wishlist

      console.log(
        `Product ${product.id} ${wasAdded ? 'added' : 'removed'} from wishlist`
      );
      notificationMessage.value = `Product ${
        product.name.length > 10 ? product.name.slice(0, 10) + "..." : product.name
      } ${wasAdded ? 'added' : 'removed'}`;
      typeNotification.value = wasAdded ? 'success' : 'error';

      setTimeout(() => {
        notification.value = false;
      }, 1000);
    };

    // Click Event Handler (End)

    return {
      products,
      inputSearch,
      filteredProducts,
      categories,
      activeCategory,
      setActiveCategory,
      loading,
      notification,
      notificationMessage,
      typeNotification,
      handleClick,
      handleDoubleClick,
      wishlist,
      addToWishlist,
      orders,
    };
  },
};
</script>

<template>
  <div id="app"
    class="mx-auto md:mt-20 mt-10 grid min-h-screen max-w-screen-lg grid-cols-12 place-content-center items-center gap-x-3 px-5 py-10">
    <h1 class="col-span-12 mb-5 text-left text-3xl font-bold capitalize">
      Shop by Category
    </h1>
    <Notification v-if="notification" :value="notificationMessage" :typeNotification="typeNotification" />
    <form class="col-span-12 md:col-span-6">
      <label for="default-search" class="dark:text-gray-300 sr-only mb-2 text-sm font-medium text-gray-900">
        Search
      </label>
      <div class="relative">
        <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <svg aria-hidden="true" class="dark:text-gray-400 h-5 w-5 text-gray-500" fill="none" stroke="currentColor"
            viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
        </div>
        <input type="search" id="default-search"
          class="dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 block w-full max-w-xs rounded-lg border border-gray-300 bg-gray-50 p-4 pl-10 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500"
          placeholder="Search product by name" required v-model.trim="inputSearch" />
      </div>
    </form>
    <div class="tags col-span-12 mt-5 md:col-span-6 md:mt-0 md:justify-self-end">
      <ul class="flex flex-wrap items-center gap-2">
        <li :class="[
          'cursor-pointer rounded-md px-5 py-2 text-sm capitalize hover:bg-indigo-600 hover:text-white',
          activeCategory === category ? 'active' : '',
        ]" v-for="category in categories" :key="category" @click="setActiveCategory(category)">
          {{ category }}
        </li>
      </ul>
    </div>
    <h2 class="col-span-12 my-12 text-xl font-bold text-indigo-600" v-if="!loading && filteredProducts.length === 0">
      No products found!
    </h2>
    <div class="col-span-12 mt-12 grid grid-cols-12 gap-5">
      <!-- Skeleton Loader -->
      <div v-if="loading" class="product-card col-span-12 h-full gap-5 flex rounded-lg bg-white p-5 sm:col-span-2 md:col-span-6 lg:col-span-4">
        <SkeletonProduct />
      </div>
      <!-- Render products when not loading -->
      <div v-for="(product, index) in filteredProducts" :key="index"
        class="col-span-12 h-full cursor-pointer flex-col gap-5 rounded-lg border border-transparent bg-indigo-50 p-2 md:p-3 lg:p-5 hover:border-indigo-300 hover:shadow-lg sm:flex col-span-6 md:col-span-6 lg:col-span-4"
        @click="handleClick(product)" @dblclick="handleDoubleClick(product)">
        <div class="relative">
          <img :src="product.image" :alt="product.name" class=" md:h-58 h-58 w-full rounded-lg object-cover" />
          <div class="flex justify-end absolute bottom-2 right-2 lg:bottom-5 lg:right-5">
            <i class="fa-regular fa-heart" :class="wishlist.some((id) => id.includes(product.id))
              ? 'fa-solid fa-heart text-[#63E6BE]'
              : 'text-gray-500'
              "></i>
          </div>
        </div>
        <div class="mt-3 text-left">

          <h2 class="truncate text-xs md:text-sm lg:text-base font-semibold">
            {{ product.name }}
          </h2>
          <p class="mb-2 text-xs md:text-sm lg:text-base capitalize text-orange-500">
            {{ product.category }}
          </p>
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <p class=" my-0 cursor-auto text-xs md:text-sm lg:text-base font-semibold text-black">
                ${{ product.price - product.discount.toFixed(2) }}
              </p>
              <del v-if="product.discount">
                <p class="ml-2 cursor-auto text-xs md:text-sm lg:text-base text-gray-600">
                  ${{ product.price.toFixed(2) }}
                </p>
              </del>
            </div>
            <div>
              <span class="text-xs md:text-sm lg:text-base text-cyan-600">Sold </span>
              <span class="text-xs md:text-sm lg:text-base text-gray-600"> {{ orders.filter(order => order.product_id === product.id).length }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  text-align: center;
  color: #2c3e50;
}

.active {
  background-color: #4f46e5;
  color: #fff;
}
</style>
