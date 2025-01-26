<script>
import { ref, computed, onMounted, watch } from "vue";
import { useRoute } from "vue-router";
import { supabase } from "@/services/supabase";
import SkeletonProduct from "@/components/SkeletonProduct.vue";
import Navbar from "@/layouts/navbar.vue";
import AppFooter from "@/components/AppFooter.vue";
// import SuccessNotification from "./SuccessNotification.vue";

export default {
  setup() {
    const activeCategory = ref("all");
    const categories = ref(["all"]);
    const products = ref([]);
    const all_products = ref([]);
    const users = ref(null);
    const inputSearch = ref("");
    const loading = ref(true);
    const errorMessage = ref("");
    const route = useRoute();
    const router = useRouter();
    const orders = ref([]);
    const wishlist = ref([]);
    const notification = ref(false);
    const activeTab = ref(0);

    const setActiveTab = (index) => {
      activeTab.value = index;
      console.log("Active Tab:", activeTab.value);
    };

    const fetchData = async () => {
      try {
        loading.value = true;
        errorMessage.value = "";

        const { data: usersData, error: usersError } = await supabase
          .from("users")
          .select("id, email, fullname, meta, bio, role, wishlist")
          .eq("fullname", route.params.id.replace("-", " "))
          .single();

        if (usersError) throw new Error("Failed to fetch user data.");

        users.value = usersData;

        if (usersData.role === "seller") {
          setActiveTab(0);
        } else {
          setActiveTab(1);
        }

        const { data: productData, error: productError } = await supabase
          .from("product")
          .select(
            "product_id, title, price, discount, stock, thumbnail, category_id, seller_username"
          )
          .eq("seller_username", usersData.fullname);

        if (productError) throw new Error("Failed to fetch product data.");

        const { data: categoryData, error: categoryError } = await supabase
          .from("product_category")
          .select("category_id, name");

        if (categoryError) throw new Error("Failed to fetch category data.");

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
      } catch (error) {
        console.error(error.message);
        errorMessage.value = error.message;
      } finally {
        loading.value = false;
      }
    };

    const fetchOrders = async () => {
      try {
        loading.value = true;
        errorMessage.value = "";

        const { data: ordersData, error: ordersError } = await supabase
          .from("order")
          .select(
            "order_id, order_date, order_status, price, quantity, total_price, product_id, user_id"
          )
          .eq("user_id", users.value.id);

        if (ordersError) throw new Error("Failed to fetch order data.");

        const productIds = ordersData.map((order) => order.product_id);
        const { data: productData, error: productError } = await supabase
          .from("product")
          .select("product_id, title, thumbnail, meta_title")
          .in("product_id", productIds);

        if (productError) throw new Error("Failed to fetch product data.");

        orders.value = ordersData.map((order) => {
          const product = productData.find(
            (prod) => prod.product_id === order.product_id
          );
          return {
            ...order,
            product_title: product ? product.title : "Unknown Product",
            product_thumbnail: product ? product.thumbnail : null,
            meta_title: product ? product.meta_title : null,
          };
        });
      } catch (error) {
        console.error(error.message);
        errorMessage.value = error.message;
      } finally {
        loading.value = false;
      }
    };

    const fetchWishlist = async () => {
      try {
        loading.value = true;
        errorMessage.value = "";

        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("wishlist")
          .eq("id", supabase.auth.user().id)
          .single();

        if (userError) throw new Error("Failed to fetch wishlist.");

        const wishlistArray = JSON.parse(userData.wishlist || "[]")
          .map((item) =>
            typeof item === "object" && item.id ? Number(item.id) : Number(item)
          )
          .filter((id) => !isNaN(id)); // Ensure valid numeric IDs.

        if (wishlistArray.length === 0) {
          wishlist.value = [];
          return;
        }

        const { data: productData, error: productError } = await supabase
          .from("product")
          .select(
            "product_id, title, price, discount, stock, thumbnail, category_id"
          )
          .in("product_id", wishlistArray);

        if (productError) throw new Error("Failed to fetch wishlist products.");

        wishlist.value = productData.map((product) => ({
          id: product.product_id,
          name: product.title,
          price: product.price,
          discount: product.discount,
          stock: product.stock,
          image: product.thumbnail,
        }));
      } catch (error) {
        console.error("Error fetching wishlist:", error.message);
        errorMessage.value = error.message;
      } finally {
        loading.value = false;
      }
    };

    const addToWishlist = async (productId) => {
  try {
    const standardizedProductId = String(productId); // Ensure the productId is standardized

    // Check if the product is already in the wishlist by comparing the `id` field of each object in the array
    const productIndex = wishlist.value.findIndex(item => item.id === standardizedProductId);

    if (productIndex !== -1) {
      // If the product is in the wishlist, remove it
      wishlist.value.splice(productIndex, 1);
      console.log(`Product ID ${standardizedProductId} removed from wishlist`);
    } else {
      // If the product is not in the wishlist, add it
      wishlist.value.push({ id: standardizedProductId }); // Add it as an object with an `id` field
      console.log(`Product ID ${standardizedProductId} added to wishlist`);
    }

    // Log the current state of the wishlist
    console.log("hihi " + JSON.stringify(wishlist.value));

    // Update the wishlist in the database
    const { error } = await supabase
      .from("users")
      .update({ wishlist: JSON.stringify(wishlist.value.id) }) // Save the entire wishlist array as a JSON string
      .eq("id", supabase.auth.user().id);

    if (error) {
      console.error("Error updating wishlist:", error);
      throw error;
    }

    console.log("Updated Wishlist:", wishlist.value);
  } catch (error) {
    console.error("Error in addToWishlist:", error.message);
  }
};


    watch(wishlist, (newWishlist) => {
      if (!Array.isArray(newWishlist)) {
        console.warn("Wishlist is not an array. Resetting to an empty array.");
        wishlist.value = [];
      }
    });

    let clickTimeout = null;

    const handleClick = (product) => {
      if (clickTimeout) clearTimeout(clickTimeout);
      clickTimeout = setTimeout(() => {
        router.push(`/product/${product.id}`);
      }, 250);
    };

    const handleDoubleClick = (product) => {
      if (clickTimeout) clearTimeout(clickTimeout);
      notification.value = true;

      addToWishlist(product.id);
      console.log("product id" + product.id);

      console.log(
        wishlist.value.includes(product.id)
          ? `Product ${product.name} added to wishlist`
          : `Product ${product.name} removed from wishlist`
      );

      setTimeout(() => {
        notification.value = false;
      }, 1000);
    };

    watch(
      () => route.params.id,
      () => {
        if (route.params.id) {
          fetchData();
        }
      },
      { immediate: true }
    );

    watch(activeTab, () => {
      if (activeTab.value === 0) {
        fetchData();
      } else if (activeTab.value === 1) {
        fetchOrders();
      } else if (activeTab.value === 2) {
        fetchWishlist();
      }
    });

    watch(activeCategory, fetchData);

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

    const setActiveCategory = (category) => {
      activeCategory.value = category;
    };

    onMounted(() => {
      fetchData();
      fetchOrders();
    });

    return {
      products,
      inputSearch,
      filteredProducts,
      categories,
      activeCategory,
      setActiveCategory,
      loading,
      users,
      errorMessage,
      activeTab,
      setActiveTab,
      fetchOrders,
      orders,
      fetchWishlist,
      wishlist,
      handleClick,
      handleDoubleClick,
    };
  },
};
</script>

<template>
  <div>
    <div class="mx-auto">
      <Navbar />
      <SuccessNotification
        v-if="notification"
        value="Product added to wishlist."
      />
      <div class="relative mx-auto my-3 mt-20 max-w-2xl">
        <!-- ------------------------------ -->

        <!-- top header -->
        <div class="my-5 flex flex-col items-center justify-center">
          <img
            v-if="users && users.meta"
            :src="users.meta.avatar_url"
            alt="User Avatar"
            class="h-16 w-16 rounded-md bg-cover bg-center bg-no-repeat"
          />
          <span class="my-3">@{{ users?.fullname }} {{ meta }} l</span>

          <div class="flex gap-10 text-sm">
            <div class="flex flex-col items-center">
              <span class="font-bold">10</span>
              <span>Following</span>
            </div>
            <div class="flex flex-col items-center">
              <span class="font-bold">1.20 K</span>
              <span>Followers</span>
            </div>
            <div class="flex flex-col items-center">
              <span class="font-bold">100 K</span>
              <span>Likes</span>
            </div>
          </div>

          <!-- <button class="my-5 px-5 py-2 font-semibold text-sm border border-gray-400">Edit profile</button> -->

          <p class="mb-3 mt-5 w-1/2">{{ users?.bio }}</p>
        </div>
        <!-- top header end -->

        <!-- middle navigation -->
        <div class="grid grid-cols-4">
          <!-- Icon Tab 1 -->
          <button
            v-if="users?.role === 'seller'"
            class="px-4 py-2 text-sm font-medium"
            :class="[
              activeTab === 0
                ? 'border-b-2 border-blue-500 text-blue-500'
                : 'text-gray-500',
            ]"
            @click="setActiveTab(0)"
          >
            <i class="fa-solid fa-bag-shopping h-6 w-6"></i>
          </button>
          <!-- Icon Tab 2 -->
          <button
            class="px-4 py-2 text-sm font-medium"
            :class="[
              activeTab === 1
                ? 'border-b-2 border-blue-500 text-blue-500'
                : 'text-gray-500',
            ]"
            @click="setActiveTab(1)"
          >
            <!-- <i class="fa-solid fa-cart-arrow-down"></i> -->
            <i class="fa-solid fa-cart-arrow-down"></i>
          </button>
          <!-- Icon Tab 3 -->
          <button
            class="px-4 py-2 text-sm font-medium"
            :class="[
              activeTab === 2
                ? 'border-b-2 border-blue-500 text-blue-500'
                : 'text-gray-500',
            ]"
            @click="setActiveTab(2)"
          >
            <!-- <i class="fa-solid fa-heart"></i> -->
            <i class="fa-solid fa-heart"></i>
          </button>
          <!-- Icon Tab 4 -->
          <button
            class="px-4 py-2 text-sm font-medium"
            :class="[
              activeTab === 3
                ? 'border-b-2 border-blue-500 text-blue-500'
                : 'text-gray-500',
            ]"
            @click="setActiveTab(3)"
          >
            <i class="fa-solid fa-user"></i>
          </button>
        </div>
        <!-- middle navigation end -->
      </div>
      <!-- start product list  -->
      <div
        id="app"
        v-if="users?.role === 'seller'"
        :class="{ hidden: activeTab !== 0 }"
        class="mx-auto grid min-h-screen max-w-screen-md grid-cols-12 place-content-center items-center gap-x-3 px-5 py-10"
      >
        <div class="col-span-12 justify-self-start md:col-span-6">
          <form class="col-span-12 mb-5 md:col-span-6">
            <label
              for="default-search"
              class="dark:text-gray-300 sr-only mb-2 text-sm font-medium text-gray-900"
            >
              Search
            </label>
            <div class="relative">
              <div
                class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"
              >
                <i class="fa-solid fa-magnifying-glass"></i>
              </div>
              <input
                type="search"
                id="default-search"
                class="dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 block w-full max-w-xs rounded-lg border border-gray-300 bg-gray-50 p-4 pl-10 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                placeholder="Search product by name"
                required
                v-model.trim="inputSearch"
              />
            </div>
          </form>
          <div
            class="tags col-span-12 mt-5 md:col-span-6 md:mt-0 md:justify-self-end"
          >
            <ul class="flex flex-wrap items-center gap-2">
              <li
                :class="[
                  'cursor-pointer rounded-md px-5 py-2 text-sm capitalize hover:bg-indigo-600 hover:text-white',
                  activeCategory === category ? 'active' : '',
                ]"
                v-for="category in categories"
                :key="category"
                @click="setActiveCategory(category)"
              >
                {{ category }}
              </li>
            </ul>
          </div>
        </div>
        <h2
          class="col-span-10 my-12 text-xl font-bold text-indigo-600"
          v-if="!loading && filteredProducts.length === 0"
        >
          No products found!
        </h2>
        <div class="col-span-12 mt-12 grid grid-cols-12 gap-5">
          <!-- Skeleton Loader -->
          <div
            v-if="loading"
            class="col-span-12 h-full gap-5 rounded-lg bg-white p-5 sm:flex md:col-span-6 lg:col-span-4"
          >
            <SkeletonProduct />
            <SkeletonProduct />
            <SkeletonProduct />
          </div>
          <!-- Render products when not loading -->
          <div
            v-for="(product, index) in filteredProducts"
            :key="index"
            v-else
            class="col-span-12 h-full px-5 cursor-pointer gap-5 rounded-lg border border-transparent bg-indigo-50 p-5 hover:border-indigo-300 hover:shadow-lg sm:flex md:col-span-6 lg:col-span-4"
          >
            <router-link :to="`/product/${product?.id}`" class="w-full">
              <img
                :src="product.image"
                :alt="product.name"
                class="h-48 w-full rounded-lg object-cover"
              />
              <div class="mt-3 text-left">
                <h2 class="truncate text-lg font-semibold">
                  {{ product.name }}
                </h2>
                <p class="mb-2 text-sm capitalize text-orange-500">
                  {{ product.category }}
                </p>
                <div class="flex items-center justify-between">
                  <div class="flex items-center">
                    <p
                      class="my-3 cursor-auto text-lg font-semibold text-black"
                    >
                      ${{ product.price - product.discount.toFixed(2) }}
                    </p>
                    <del v-if="product.discount">
                      <p class="ml-2 cursor-auto text-sm text-gray-600">
                        ${{ product.price.toFixed(2) }}
                      </p>
                    </del>
                  </div>

                  <div>
                    <span class="text-sm text-green-600">Stock</span>
                    <span class="text-md text-gray-600">
                      {{ product.stock }}</span
                    >
                  </div>
                </div>
              </div>
            </router-link>
          </div>
        </div>
      </div>
      <!-- end product list  -->
      <!-- start order list -->
      <div :class="{ hidden: activeTab !== 1 }">
        <div class="mx-auto max-w-4xl p-6 text-left">
          <div class="mb-4 flex items-center justify-between">
            <h2 class="text-lg font-semibold">Order List</h2>
            <button
              class="rounded-lg border border-gray-300 px-3 py-1 text-sm text-gray-600"
            >
              Filter by: Latest
            </button>
          </div>
          <div class="rounded-lg border border-gray-200 shadow">
            <div
              v-for="(order, index) in orders"
              :key="order?.order_id"
              class="flex items-center justify-between border-b bg-indigo-100 p-4 last:border-none"
            >
              <div class="flex items-center gap-4">
                <img
                  :src="order.product_thumbnail"
                  alt="Product Thumbnail"
                  class="h-10 w-10 rounded"
                />
                <div>
                  <h3 class="font-medium">{{ order.product_title }}</h3>
                  <!-- <p class="text-sm text-gray-500 hidden sm:block">
                    Order ID:
                    <span class="text-blue-500 underline">{{
                      order?.order_id
                    }}</span>
                  </p> -->
                  <p class="text-sm text-gray-500 hidden sm:block">
                    <span class="text-blue-500">{{
                      order.meta_title.length > 50
                        ? order.meta_title.substring(0, 50) + "..."
                        : order.meta_title
                    }}</span>
                  </p>
                </div>
              </div>
              <div class="text-right w-1/4">
                <p class="font-semibold text-gray-800">
                  ${{ order.total_price.toFixed(2) }} * {{ order.quantity }}
                </p>
                <span
                  class="text-sm text-right"
                  :class="{
                    ' text-green-600':
                      order.order_status === 'shipped',
                    'text-yellow-600':
                      order.order_status === 'pending',
                    'text-red-600':
                      order.order_status === 'canceled',
                  }"
                >
                  {{ order.order_status }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- end order list -->
      <!-- start wishlist list -->
      <div
      :class="{ hidden: activeTab !== 2 }"  
      class="mx-auto flex max-w-4xl p-6 text-left gap-5">
        <div
          v-for="(product, index) in wishlist"
          :key="index"
          class="col-span-12 w-1/3 h-full cursor-pointer cursor-pointer flex-col gap-5 rounded-lg border border-transparent bg-indigo-50 p-5 hover:border-indigo-300 hover:shadow-lg sm:flex md:col-span-6 lg:col-span-4"
          @click="handleClick(product)"
        >
          <img
            :src="product.image"
            :alt="product.name"
            class="h-48 w-full rounded-lg object-cover"
          />
          <div class="mt-3 text-left">
            <div class="flex justify-end">
              <i
                class="fa-regular fa-heart"
                :class="
                  wishlist.includes(product)
                    ? 'fa-solid fa-heart text-[#63E6BE]'
                    : 'text-gray-500'
                "
              ></i>
            </div>
            <h2 class="truncate text-lg font-semibold">{{ product.name }}</h2>
            <p class="mb-2 text-sm capitalize text-orange-500">
              {{ product.category }}
            </p>
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <p class="my-3 cursor-auto text-lg font-semibold text-black">
                  ${{ product.price - product.discount.toFixed(2) }}
                </p>
                <del v-if="product.discount">
                  <p class="ml-2 cursor-auto text-sm text-gray-600">
                    ${{ product.price.toFixed(2) }}
                  </p>
                </del>
              </div>
              <div>
                <span class="text-sm text-green-600">Stock</span>
                <span class="text-md text-gray-600"> {{ product.stock }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- end wishlist list -->

      <AppFooter />
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
