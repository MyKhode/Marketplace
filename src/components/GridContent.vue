<template>
    <div
      id="app"
      class="grid grid-cols-12 min-h-screen items-center max-w-screen-lg mt-20 mx-auto py-10 px-5 gap-x-3 place-content-center"
    >
      <h1 class="capitalize col-span-12 text-left mb-5 text-3xl font-bold">
        Shop by Category
      </h1>
      <form class="col-span-12 md:col-span-6">
        <label
          for="default-search"
          class="mb-2 text-sm font-medium text-gray-900 sr-only dark:text-gray-300"
        >
          Search
        </label>
        <div class="relative">
          <div
            class="flex absolute inset-y-0 left-0 items-center pl-3 pointer-events-none"
          >
            <svg
              aria-hidden="true"
              class="w-5 h-5 text-gray-500 dark:text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              ></path>
            </svg>
          </div>
          <input
            type="search"
            id="default-search"
            class="block p-4 pl-10 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 max-w-xs"
            placeholder="Search product by name"
            required
            v-model.trim="inputSearch"
          />
        </div>
      </form>
      <div
        class="tags mt-5 md:mt-0 col-span-12 md:col-span-6 md:justify-self-end"
      >
        <ul class="flex items-center flex-wrap gap-2">
          <li
            :class="[ 
              'capitalize text-sm hover:bg-indigo-600 hover:text-white py-2 px-5 rounded-md cursor-pointer',
              activeCategory === category ? 'active' : '' 
            ]"
            v-for="category in categories"
            :key="category"
            @click="setActiveCategory(category)"
          >
            {{ category }}
          </li>
        </ul>
      </div>
      <h2
        class="col-span-12 text-indigo-600 text-xl font-bold my-12"
        v-if="filteredProducts.length === 0"
      >
        No products found!
      </h2>
      <div class="col-span-12 grid grid-cols-12 gap-5 mt-12">
        <div
          v-for="(product, index) in filteredProducts"
          :key="index"
          class="col-span-12 md:col-span-6 lg:col-span-4 sm:flex bg-white  rounded-lg p-5 gap-5 h-full border border-transparent cursor-pointer hover:shadow-lg hover:border-indigo-300"
        >
          <router-link :to="`/product/${product.id}`" class="w-full">
            <img
              :src="product.image"
              :alt="product.name"
              class="rounded-lg w-full h-48 object-cover"
            />
            <div class="text-left mt-3">
              <h2 class="text-lg font-semibold truncate">
                {{ product.name }}
              </h2>
              <p class="text-orange-500 text-sm mb-2 capitalize">{{ product.category }}</p>
              <div class="flex items-center">
                <p class="text-lg font-semibold text-black cursor-auto my-3">
                  ${{product.price - product.discount.toFixed(2) }}
                </p>
                <del v-if="product.discount">
                  <p class="text-sm text-gray-600 cursor-auto ml-2">
                    <!-- ${{ product.oldPrice + product.discount }} -->
                    ${{  product.price.toFixed(2) }}
                  </p>
                </del>
              </div>
            </div>
          </router-link>
        </div>

      </div>
    </div>
  </template>
  
  <script>
  import { ref, computed, onMounted } from "vue";
  import { supabase } from "@/services/supabase";
  
  export default {
    setup() {
      const activeCategory = ref("all");
      const categories = ref(["all"]);
      const products = ref([]);
      const inputSearch = ref("");
  
      const fetchProducts = async () => {
        const { data: productData, error: productError } = await supabase
          .from("product")
          .select("product_id, title, price, discount, thumbnail, category_id");
  
        const { data: categoryData, error: categoryError } = await supabase
          .from("product_category")
          .select("category_id, name");
  
        if (productError || categoryError) {
          console.error("Error fetching data:", productError || categoryError);
        } else {
          categories.value = ["all", ...categoryData.map(category => category.name)];
          products.value = productData.map(product => {
            const category = categoryData.find(cat => cat.category_id === product.category_id);
            return {
              id: product.product_id,
              name: product.title,
              price: product.price,
              discount: product.discount,
              image: product.thumbnail,
              category: category ? category.name : "other"
            };
          });
        }
      };
  
      const filteredProducts = computed(() => {
        return products.value.filter(product => {
          const matchesCategory = activeCategory.value === "all" || product.category === activeCategory.value;
          const matchesSearch = product.name.toLowerCase().includes(inputSearch.value.toLowerCase());
          return matchesCategory && matchesSearch;
        });
      });
  
      function setActiveCategory(category) {
        activeCategory.value = category;
      }
  
      onMounted(() => {
        fetchProducts();
      });
  
      return {
        products,
        inputSearch,
        filteredProducts,
        categories,
        activeCategory,
        setActiveCategory,
      };
    },
  };
  </script>
  
  
  <style>
  #app {
    font-family: Avenir, Helvetica, Arial, sans-serif;
    text-align: center;
    color: #2c3e50;
  }
  /* button {
    background: none;
    border: solid 1px;
    border-radius: 2em;
    font: inherit;
    padding: 0.75em 2em;
  } */
  .active {
    background-color: #4f46e5;
    color: #fff;
  }
  </style>
  