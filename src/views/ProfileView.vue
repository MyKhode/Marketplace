<script>
import { ref, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { supabase } from "@/services/supabase";
import SkeletonProduct from "@/components/SkeletonProduct.vue";
import Navbar from "@/layouts/navbar.vue";
import AppFooter from "@/components/AppFooter.vue";
import router from "@/router";

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
    const Allorders = ref([]);
    const wishlist = ref([]);
    const wishlistProduct = ref([]);
    const notification = ref(false);
    const activeTab = ref(0);

    const full_name = ref("");
    const bio = ref("");
    const phone = ref("");
    const address = ref("");

    const notificationMessage = ref("");
    const typeNotification = ref("");


    const setActiveTab = (index) => {
      activeTab.value = index;
      // console.log("Active Tab:", activeTab.value);
    };

    const fetchData = async () => {
      try {
        loading.value = true;
        errorMessage.value = "";

        const { data: usersData, error: usersError } = await supabase
          .from("users")
          .select("id, email, fullname, meta, bio, role")
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
    const fetchAllOrders = async () => {
      try {
        const { data, error } = await supabase
          .from("order")
          .select("*");

        if (error) {
          console.error("Error fetching orders:", error.message);
          return;
        }

        Allorders.value = data;
      } catch (err) {
        console.error("Unexpected error while fetching orders:", err);
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

    const fetchWishlistProduct = async () => {
      const { data: wishlistData } = await supabase
        .from("users")
        .select("wishlist")
        .eq("id", supabase.auth.user().id)
        .single();

      try {
        wishlistProduct.value = JSON.parse(wishlistData.wishlist || "[]"); // Parse JSON string
      } catch (e) {
        wishlistProduct.value = [];
      }
    };

    // Update wishlist function to ensure reactivity
    const addToWishlist = async (productId) => {
      const standardizedProductId = String(productId);

      // Toggle logic: Add or remove based on inclusion
      const isProductInWishlist = wishlistProduct.value.includes(standardizedProductId);
      wishlistProduct.value = isProductInWishlist
        ? wishlistProduct.value.filter((id) => id !== standardizedProductId)
        : [...wishlistProduct.value, standardizedProductId];

      // Ensure `wishlist` is stored as a proper JSON array
      const { error } = await supabase
        .from("users")
        .update({ wishlist: JSON.stringify(wishlistProduct.value) }) // Convert to JSON string
        .eq("id", supabase.auth.user().id);

      if (error) {
        console.error("Error updating wishlist:", error);
      }

      return !isProductInWishlist; // Return true if product was added, false if removed
    };


    watch(wishlistProduct, (newWishlist) => {
      if (!Array.isArray(newWishlist)) {
        console.warn("Wishlist is not an array. Resetting to an empty array.");
        wishlistProduct.value = [];
      }
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
      notificationMessage.value = `Product ${product.name.length > 10 ? product.name.slice(0, 10) + "..." : product.name
        } ${wasAdded ? 'added' : 'removed'}`;
      typeNotification.value = wasAdded ? 'success' : 'error';

      fetchWishlist();
      setTimeout(() => {
        notification.value = false;
      }, 1000);
    };
    const initializeCheckoutInfo = async () => {
      try {
        const { data, error } = await supabase
          .from("users")
          .select("fullname, phone_number, address, bio")
          .eq("id", supabase.auth.user().id)
          .single();

        if (error) {
          console.error("Error fetching user data:", error.message);
          return;
        }

        if (data) {
          // console.log("User data fetched successfully:", data);
          full_name.value = data.fullname;
          phone.value = data.phone_number;
          address.value = data.address;
          bio.value = data.bio;
        }

      } catch (err) {
        console.error("Unexpected error while fetching user data:", err);
      }
    };

    const saveInfo = async () => {
      try {
        const updates = {
          fullname: full_name.value,
          phone_number: phone.value,
          address: address.value,
          bio: bio.value,
        };

        const { data, error } = await supabase
          .from("users")
          .update(updates)
          .eq("id", supabase.auth.user().id);

        if (error) {
          console.error("Error updating user data:", error.message);
          return;
        }

        if (data) {
          // console.log("User data updated successfully:", data);
          Object.assign(full_name, { value: data[0].fullname });
          Object.assign(phone, { value: data[0].phone_number });
          Object.assign(address, { value: data[0].address });
          Object.assign(bio, { value: data[0].bio });

          notification.value = true;
          notificationMessage.value = "Updated successfully";
          typeNotification.value = "success";
          fetchData();
          setTimeout(() => {
            notification.value = false;
          }, 2000);
        }

      } catch (err) {
        console.error("Unexpected error while updating user data:", err);
      }
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
        fetchAllOrders();
      } else if (activeTab.value === 2) {
        fetchWishlist();
        fetchWishlistProduct();
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
    //console the filter procduct
    // console.log("filteredProducts" + filteredProducts.value);

    const setActiveCategory = (category) => {
      activeCategory.value = category;
    };

    onMounted(() => {
      fetchData();
      fetchAllOrders();
      initializeCheckoutInfo();
      if (activeTab.value === 1) {
        if (supabase.auth.user()) {
          fetchOrders();
        }
      }

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
      Allorders,
      orders,
      fetchWishlist,
      wishlist,
      handleClick,
      handleDoubleClick,
      notification,
      initializeCheckoutInfo,
      full_name,
      bio,
      phone,
      address,
      saveInfo,
      notificationMessage,
      typeNotification,
    };
  },
};
</script>

<template>
  <div>
    <div class="mx-auto">
      <Navbar />
      <Notification v-if="notification" :value="notificationMessage" :typeNotification="typeNotification" />
      <div class="relative mx-auto my-3 mt-20 max-w-2xl">
        <!-- ------------------------------ -->

        <!-- top header -->
        <div class="my-5 flex flex-col items-center justify-center">
          <img
            :src="users?.meta?.avatar_url ? decodeURIComponent(users.meta.avatar_url) : 'https://st.depositphotos.com/1779253/5140/v/450/depositphotos_51405259-stock-illustration-male-avatar-profile-picture-use.jpg'"
            alt="User Avatar" class="h-16 w-16 rounded-md bg-cover bg-center bg-no-repeat" />
          <span class="my-3">@{{ users?.fullname || 'Unknown' }}</span>

          <div class="flex gap-10 text-sm">
            <div class="flex flex-col items-center">
              <span class="font-bold">10</span>
              <span>Following </span>
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
          <button v-if="users?.role === 'seller'" class="px-4 py-2 text-sm font-medium" :class="[
            activeTab === 0
              ? 'border-b-2 border-blue-500 text-blue-500'
              : 'text-gray-500',
          ]" @click="setActiveTab(0)">
            <i class="fa-solid fa-bag-shopping h-6 w-6"></i>
          </button>
          <!-- Icon Tab 2 -->
          <button class="px-4 py-2 text-sm font-medium" :class="[
            activeTab === 1
              ? 'border-b-2 border-blue-500 text-blue-500'
              : 'text-gray-500',
          ]" @click="setActiveTab(1)">
            <!-- <i class="fa-solid fa-cart-arrow-down"></i> -->
            <i class="fa-solid fa-cart-arrow-down"></i>
          </button>
          <!-- Icon Tab 3 -->
          <button class="px-4 py-2 text-sm font-medium" :class="[
            activeTab === 2
              ? 'border-b-2 border-blue-500 text-blue-500'
              : 'text-gray-500',
          ]" @click="setActiveTab(2)">
            <!-- <i class="fa-solid fa-heart"></i> -->
            <i class="fa-solid fa-heart"></i>
          </button>
          <!-- Icon Tab 4 -->
          <button class="px-4 py-2 text-sm font-medium" :class="[
            activeTab === 3
              ? 'border-b-2 border-blue-500 text-blue-500'
              : 'text-gray-500',
          ]" @click="setActiveTab(3)">
            <i class="fa-solid fa-user"></i>
          </button>
        </div>
        <!-- middle navigation end -->
      </div>
      <!-- start product list  -->
      <div id="app" v-if="users?.role === 'seller'" :class="{ hidden: activeTab !== 0 }"
        class="mx-auto grid min-h-screen max-w-screen-md grid-cols-12 place-content-center items-center gap-x-3 px-5 py-10">
        <div class="col-span-12 justify-self-start md:col-span-6">
          <form class="col-span-12 mb-5 md:col-span-6">
            <label for="default-search" class="dark:text-gray-300 sr-only mb-2 text-sm font-medium text-gray-900">
              Search
            </label>
            <div class="relative">
              <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <i class="fa-solid fa-magnifying-glass"></i>
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
        </div>
        <h2 class="col-span-10 my-12 text-xl font-bold text-indigo-600"
          v-if="!loading && filteredProducts.length === 0">
          No products found!
        </h2>

        <div class="col-span-12 mt-12 grid grid-cols-12 gap-5 mb-48">
          <!-- Skeleton Loader -->
          <div v-if="loading"
            class="col-span-12 h-full gap-5 rounded-lg bg-white p-5 sm:flex md:col-span-6 lg:col-span-4">
            <SkeletonProduct />
            <SkeletonProduct />
            <SkeletonProduct />
          </div>
          <!-- Render products when not loading -->
          <div v-for="(product, index) in filteredProducts" :key="index" v-else
            class="col-span-12 h-full cursor-pointer flex-col gap-5 rounded-lg border border-transparent bg-indigo-50 p-2 md:p-3 lg:p-5 hover:border-indigo-300 hover:shadow-lg sm:flex col-span-6 md:col-span-6 lg:col-span-4"
            @click="handleClick(product)" @dblclick="handleDoubleClick(product)">
            <div class="relative">
              <img :src="product.image" :alt="product.name" class=" md:h-58 h-58 w-full rounded-lg object-cover" />
              <div class="flex justify-end absolute bottom-2 right-2 lg:bottom-5 lg:right-5">
                <i class="fa-regular fa-heart" :class="wishlist.includes(product)
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
                    ${{ product.price - product.discount }}
                  </p>
                  <del v-if="product.discount">
                    <p class="ml-2 cursor-auto text-xs md:text-sm lg:text-base text-gray-600">
                      ${{ product.price.toFixed(2) }}
                    </p>
                  </del>
                </div>
                <div>
                  <span class="text-xs md:text-sm lg:text-base text-cyan-600">Sold </span>
                  <span class="text-xs md:text-sm lg:text-base text-gray-600"> {{ Allorders.filter(order =>
                    order.product_id === product.id).length }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- end product list  -->
      <!-- start order list -->
      <div :class="{ hidden: activeTab !== 1 }">
        <div class="mx-auto max-w-4xl p-6 text-left">
          <div class="mb-4 flex items-center justify-between">
            <h2 class="text-lg font-semibold">Order List</h2>
            <button class="rounded-lg border border-gray-300 px-3 py-1 text-sm text-gray-600">
              Filter by: Latest
            </button>
          </div>
          <div class="rounded-lg border border-gray-200 shadow">
            <div v-for="(order, index) in orders" :key="order?.order_id"
              class="flex items-center justify-between border-b bg-indigo-100 p-4 last:border-none hover:shadow-lg hover:bg-indigo-200">
              <router-link :to="`/product/${order?.product_id}`" class="flex justify-between w-full hover:text-indigo-600">
                <div class="flex items-center gap-4">
                  <img :src="order.product_thumbnail" alt="Product Thumbnail" class="h-10 w-10 rounded" />
                  <div>
                    <h3 class="font-medium hover:underline">{{ order.product_title }}</h3>
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
                    ${{ order.total_price }} * {{ order.quantity }}
                  </p>
                  <span class="text-sm text-right" :class="{
                    ' text-green-600':
                      order.order_status === 'shipped',
                    'text-yellow-600':
                      order.order_status === 'pending',
                    'text-red-600':
                      order.order_status === 'canceled',
                  }">
                    {{ order.order_status }}
                  </span>
                </div>
              </router-link>
            </div>
            <div v-if="!orders || orders.length === 0">
              <div class="p-4 text-center text-gray-500">
                <i class="fa-regular fa-face-frown text-6xl"></i>
                <p>
                  Empty order list
                  <br />
                  Once user's placed an order, it will appear here.
                </p>
                <router-link to="/"
                  class="mt-4 inline-block rounded-lg bg-indigo-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-800 focus:outline-none focus:ring-4 focus:ring-indigo-300">
                  Start Shopping
                </router-link>
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- end order list -->
      <!-- start wishlist list -->
      <div :class="{ hidden: activeTab !== 2 }" class="mx-auto flex max-w-4xl p-6 text-left gap-5 flex-wrap">

        <div class="col-span-12 mt-12 grid grid-cols-12 gap-5 mb-48">
          <!-- Skeleton Loader -->
          <div v-if="loading"
            class="col-span-12 h-full gap-5 rounded-lg bg-white p-5 sm:flex md:col-span-6 lg:col-span-4">
            <SkeletonProduct />
            <SkeletonProduct />
            <SkeletonProduct />
          </div>
          <!-- Render products when not loading -->
          <div v-if="wishlist.length > 0" v-for="(product, index) in wishlist" :key="index"
            class="col-span-12 h-full cursor-pointer flex-col gap-5 rounded-lg border border-transparent bg-indigo-50 p-2 md:p-3 lg:p-5 hover:border-indigo-300 hover:shadow-lg sm:flex col-span-6 md:col-span-6 lg:col-span-4"
            @click="handleClick(product)" @dblclick="handleDoubleClick(product)">
            <div class="relative">
              <img :src="product.image" :alt="product.name" class=" md:h-58 h-58 w-full rounded-lg object-cover" />
              <div class="flex justify-end absolute bottom-2 right-2 lg:bottom-5 lg:right-5">
                <i class="fa-regular fa-heart" :class="wishlist.includes(product)
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
                    ${{ product.price - product.discount }}
                  </p>
                  <del v-if="product.discount">
                    <p class="ml-2 cursor-auto text-xs md:text-sm lg:text-base text-gray-600">
                      ${{ product.price.toFixed(2) }}
                    </p>
                  </del>
                </div>
                <div>
                  <span class="text-xs md:text-sm lg:text-base text-cyan-600">Sold </span>
                  <span class="text-xs md:text-sm lg:text-base text-gray-600"> {{ Allorders.filter(order =>
                    order.product_id === product.id).length }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Empty Wishlist State -->
          <div v-else class="col-span-12 lg:ml-56 h-full">
            <div class="p-4 text-center text-gray-500">
              <i class="fa-regular fa-heart text-6xl"></i>
              <p>
                Empty Wishlist
                <br />
                Add some products to wishlist to see them here.
              </p>

              <router-link to="/"
                class="mt-4 inline-block rounded-lg bg-indigo-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-800 focus:outline-none focus:ring-4 focus:ring-indigo-300">
                Start Shopping
              </router-link>
            </div>
          </div>
        </div>

      </div>

      <!-- end wishlist list -->
      <!-- start user info profile list  -->
      <div :class="{ hidden: activeTab !== 3 }"
        class="mt-10 text-left gap-5 flex-wrap flex items-center justify-center">
        <form v-show="full_name.replace(/\s+/g, '-') === $route.params.id">
          <div class="grid gap-6 mb-6 md:grid-cols-2">
            <div>
              <label for="your_name" class="dark:text-white mb-2 block text-sm font-medium text-gray-900">
                គោត្ដនាម, នាម
              </label>
              <input type="text" id="your_name" v-model="full_name"
                class=" dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-primary-500 dark:focus:ring-primary-500 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-primary-500"
                placeholder="John Doe" required />
            </div>
            <div>
              <label for="your_name" class="dark:text-white mb-2 block text-sm font-medium text-gray-900">
                ប្រវត្ដិសង្ខេប
              </label>
              <input type="text" id="your_name" v-model="bio"
                class="dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-primary-500 dark:focus:ring-primary-500 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-primary-500"
                placeholder="John Doe" required />
            </div>
            <div>
              <label for="phone-input-3" class="dark:text-white mb-2 block text-sm font-medium text-gray-900">
                លេខទំនាក់ទំនង *
              </label>
              <div class="flex items-center">
                <button id="dropdown-phone-button-3" data-dropdown-toggle="dropdown-phone-3"
                  class="dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 dark:focus:ring-gray-700 z-10 inline-flex shrink-0 items-center rounded-s-lg border border-gray-300 bg-gray-100 px-4 py-2.5 text-center text-sm font-medium text-gray-900 hover:bg-gray-200 focus:outline-none focus:ring-4 focus:ring-gray-100"
                  type="button">
                  <img class="me-2 h-4 w-6" src="/images/Flag_of_Cambodia.svg" alt="" />
                  +855
                  <svg class="-me-0.5 ms-2 h-4 w-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24"
                    height="24" fill="none" viewBox="0 0 24 24">
                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="m19 9-7 7-7-7" />
                  </svg>
                </button>
                <div class="relative w-full">
                  <input type="text" id="phone-input" v-model="phone"
                    class="dark:border-gray-600 dark:border-s-gray-700 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-primary-500 z-20 block w-full rounded-e-lg border border-s-0 border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-primary-500"
                    pattern="(0?[0-9]{2}[0-9]{3}[0-9]{4})" placeholder="964074300" required />
                </div>
              </div>
            </div>
            <div>
              <label for="Address" class="dark:text-white mb-2 block text-sm font-medium text-gray-900">
                ទីតាំង *</label>
              <input type="text" id="Address" v-model="address"
                class="dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-primary-500 dark:focus:ring-primary-500 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-primary-500"
                placeholder="ផ្លូវ, ភូមិ, ឃុំ, ស្រុក, ក្រុង, ខេត្ត" required />
            </div>
          </div>
          <button type="button" @click="saveInfo()"
            class="text-gray-900 bg-gradient-to-r from-lime-200 via-lime-400 to-lime-500 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-lime-300 dark:focus:ring-lime-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2">Save
            Info</button>
        </form>

        <div v-if="full_name.replace(/\s+/g, '-') !== $route.params.id"
          class="bg-orange-100 border-l-4 border-orange-500 text-orange-700 p-4 mb-4" role="alert">
          <p class="font-bold">Access denied</p>
          <p>You don't have permission to access this user's information. Please go to your own profile and update your
            information.</p>
        </div>


      </div>
      <!-- end user info profile list  -->


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
