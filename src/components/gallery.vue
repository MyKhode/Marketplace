<script setup>
import { ref, onMounted, watch } from "vue";
import { useRoute } from "vue-router";
import { supabase } from "@/services/supabase";
import { useCartStore } from "@/stores/cartStore";
import lightbox from "./lightbox.vue";
import Navbar from "./Navbar.vue";
import AppFooter from "./AppFooter.vue";

const route = useRoute();
const product = ref({});
const seller = ref("Unknown Seller");
const images = ref([]);
const quantity = ref(0);
const cartStore = useCartStore();

async function fetchProductDetails() {
  try {
    const { data: productData, error: productError } = await supabase
      .from("product")
      .select("product_id, title, price, discount, stock, content, seller_id, image_overview_id")
      .eq("product_id", route.params.id)
      .single();

    if (productError) throw productError;
    product.value = productData;

    const { data: sellerData, error: sellerError } = await supabase
      .from("users")
      .select("fullname")
      .eq("id", productData.seller_id)
      .single();

    const { data: cartData, error: cartError } = await supabase
      .from("cart")
      .select("*")
      .eq("user_id", supabase.auth.user().id)
      .eq("seller_id", productData.seller_id);

    if (sellerError) throw sellerError;
    seller.value = sellerData?.fullname || "Unknown Seller";

    cartStore.setSellerId(productData.seller_id);
    cartStore.loadCartFromSupabase(productData.seller_id);

    const { data: imagesData, error: imagesError } = await supabase
      .from("product_image_overview")
      .select("image1, image2, image3, image4")
      .eq("id", productData.image_overview_id);

    if (imagesError) throw imagesError;
    const { image1, image2, image3, image4 } = imagesData[0];
    images.value = [image1, image2, image3, image4]; // Store all images
  } catch (error) {
    console.error("Error fetching product details:", error);
  }
}

// Watch for route changes and refetch product details
watch(() => route.params.id, fetchProductDetails, { immediate: true });

function addCartButton() {
  if (quantity.value > 0) {
    const item = {
      product_id: product.value.product_id,
      title: product.value.title,
      price: product.value.price,
      thumbnail: product.value.thumbnail,
      quantity: quantity.value,
    };
    cartStore.addItem(item);
    console.log("Item added to cart:", item);
  }
}


onMounted(() => {
  fetchProductDetails();
});
</script>


<template>
  <Navbar />
  <div class="lg:flex lg:justify-center gap-28 lg:items-center mx-auto lg:mt-0 mt-10 h-full w-1/2">
    <lightbox :images="images" />
    <div class="text-left">
      <h1 class="text-[#ff7d1a] font-bold uppercase tracking-wide text-sm mb-2 ">
        {{ seller }}
      </h1>
      <h2 class="text-2xl font-bold w-90 mb-3 lg:mb-6">
        {{ product.title }}
      </h2>
      <p class="text-[#a1a1a1] max-w-96 mb-5">
        {{ product.content }}
      </p>
      <div class="flex justify-between">
        <div class="flex justify-between mb-6 lg:flex-col">
          <div class="flex items-center">
            <p class="text-2xl font-bold me-3">${{ product.price - product.discount }}</p>
            <a v-if="product.discount" class="bg-[#ff7d1a33] text-sm px-2 rounded-md">{{ (((product.price -
              (product.price - product.discount)) / product.price) * 100).toFixed(2) }}%</a>
          </div>
          <del v-if="product.discount" class="text-[#a1a1a1] "> ${{ product.price.toFixed(2) }}</del>
        </div>
        <div class="text-left mt-5"><span class="text-sm text-green-600">Stock</span> <span class="text-md text-gray-600"> {{
          product.stock }}</span></div>
      </div>
      <div class="lg:flex lg:justify-between">
        <div
          class="quantity flex w-full h-12 lg:w-32 bg-[var(--color-background-mute)] rounded-md justify-between items-center mb-3">
          <button @click="quantity > 0 && quantity < product.stock ? quantity-- : quantity = 0">
            -
          </button>
          <p>{{ quantity }}</p>
          <button @click="quantity < product.stock ? quantity++ : quantity = product.stock">
            +
          </button>
        </div>
        <button @click="addCartButton"
          class="w-50 shadow-2xl lg:w-60 h-12 w-full flex justify-center items-center bg-[#ff7d1a] text-white rounded-md ml-10 hover:bg-[#ff7d1a80]">
          <p class="m-3 text-lg">
            <i class="fa-solid fa-cart-plus"></i> Add to cart
          </p>
        </button>
      </div>
    </div>
  </div>
  <AppFooter />
</template>

<style scoped></style>