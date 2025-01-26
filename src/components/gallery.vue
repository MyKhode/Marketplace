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
      .eq("product_id", parseInt(route.params.id))
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
      .eq("user_id", supabase.auth.user().id);
      // .eq("seller_id", productData.seller_id);

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
      discount: product.value.discount,
      thumbnail: product.value.thumbnail,
      quantity: quantity.value,
    };
    cartStore.addItem(item);
  }
}


onMounted(() => {
  fetchProductDetails();
});
</script>


<template>
  <div>
    <Navbar />
    <div class="lg:flex lg:justify-center gap-28 lg:items-center mx-auto lg:mt-28 h-full lg:w-1/2">
      <lightbox :images="images" />
      <div class="text-left lg:mt-0 mt-5 px-5">
        <router-link :to="`/profile/${seller.replace(/\s+/g, '-')}`"
          class="text-[#ff7d1a] font-bold uppercase tracking-wide text-sm mb-2">
          {{ seller }}
        </router-link>
        <h2 class="text-2xl font-bold w-90 mb-3 lg:mb-6">
          {{ product.title }}
        </h2>
        <p class="text-[#a1a1a1] max-w-96 mb-5">
          {{ product.content }}
        </p>
        <div class="flex justify-between items-center">
          <div class="flex justify-between mb-6 lg:flex-col md:items-left ">
            <div class="flex items-center">
              <p class="text-2xl font-bold me-3">${{ product.price - product.discount }}</p>
              <a v-if="product.discount" class="bg-[#ff7d1a33] text-sm px-2 rounded-md">{{ (((product.price -
                (product.price - product.discount)) / product.price) * 100).toFixed(2) }}%</a>
            </div>
            <del v-if="product.discount" class="text-[#a1a1a1] mt-1 md:ml-0 ml-3"> ${{ product.price.toFixed(2) }}</del>
          </div>
          <div class="text-left mb-5"><span class="text-sm text-green-600">Stock</span> <span
              class="text-md text-gray-600"> {{
                product.stock }}</span></div>
        </div>
        <div class="lg:flex lg:justify-between md:w-full w-1/2">
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
            class="flex justify-center items-center rounded-md shadow-2xl md:w-60 h-12 md:h-auto ml-0 md:text-base text-sm bg-[#ff7d1a] text-white hover:bg-[#ff7d1a80] md:px-10 px-5 md:py-3 py-2 md:ml-10 ml-5">
            <i class="fa-solid fa-cart-plus md:mr-3 mr-1"></i>
            <p class="md:m-0 m-1">
              Add to cart
            </p>
          </button>
        </div>
      </div>
    </div>
    <AppFooter />
  </div>
</template>

<style scoped></style>