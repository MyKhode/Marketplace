<script setup>
import { ref, onMounted, watch, computed } from "vue";
import { useRoute } from "vue-router";
import { supabase } from "@/services/supabase";
import lightbox from "./lightbox.vue";
import Navbar from "./Navbar.vue";
import AppFooter from "./AppFooter.vue";
import { useCartStore } from "@/stores/cartStore";

const route = useRoute();
const product = ref({});
const seller = ref("Unknown Seller");
const images = ref([]);
const quantity = ref(1);
const comments = ref([]);
const newComment = ref("");
const newReply = ref("");
const isLoading = ref(true);
const product_options = ref([]);
const selectedOption = ref("1");

const cartStore = useCartStore();

// Fetch product details
async function fetchProductDetails() {
  try {
    isLoading.value = true;
    const { data: productData, error: productError } = await supabase
      .from("product")
      .select("*")
      .eq("product_id", parseInt(route.params.id))
      .single();

    if (productError) throw productError;
    product.value = productData;

    const { data: sellerData, error: sellerError } = await supabase
      .from("users")
      .select("fullname")
      .eq("id", productData.seller_id)
      .single();

    if (sellerError) throw sellerError;
    seller.value = sellerData?.fullname || "Unknown Seller";

    const { data: imagesData, error: imagesError } = await supabase
      .from("product_image_overview")
      .select("image1, image2, image3, image4")
      .eq("id", productData.image_overview_id);

    if (imagesError) throw imagesError;
    images.value = Object.values(imagesData[0]).filter(Boolean); // Store all images
    isLoading.value = false;
  } catch (error) {
    console.error("Error fetching product details:", error);
  }
}

const fetchProductOptions = async () => {
  try {
    const { data: optionsData, error: optionsError } = await supabase
      .from("product_options")
      .select("*")
      .eq("product_id", parseInt(route.params.id));
    if (optionsError) throw optionsError;
    product_options.value = optionsData || [];
    console.log("Product options:", product_options.value);
  } catch (error) {
    console.error("Error fetching product options:", error);
  } finally {
    isLoading.value = false;
    if (product.value && product.value.title) {
      fetchComments();
    }
  }
}

const computedPrice = computed(() => {
  const selectedOptionData = product_options.value.find(
    (option) => option.id === selectedOption.value
  );
  if (selectedOptionData) {
    return selectedOptionData.price - product.value.discount;
  }
  if (product_options.value.length > 0) {
    return product_options.value[0].price - product.value.discount; // Default to the first product option's price
  }
  return product.value.price;
});

// Fetch comments
const fetchComments = async () => {
  try {
    const { data: commentsData, error: commentsError } = await supabase
      .from("comments")
      .select("*, users(fullname, meta)") // Join users table to get fullname
      .eq("product_id", parseInt(route.params.id))
      .order("created_at", { ascending: false });

    if (commentsError) throw commentsError;
    comments.value = commentsData || [];
  } catch (error) {
    console.error("Error fetching comments:", error);
  }
};


const postComment = async () => {
  if (!newComment.value.trim()) {
    alert("Comment cannot be empty");
    return;
  }

  try {
    const user = supabase.auth.user();
    const userName = user?.user_metadata?.full_name || "Unknown User";
    const productName = product.value?.title || "Unknown Product";

    console.log("Comment:", newComment.value, "User ID:", user.id);

    const { error } = await supabase
      .from("comments")
      .insert([
        {
          product_id: parseInt(route.params.id),
          user_id: user.id,
          message: newComment.value,
          created_at: new Date().toLocaleString('en-US', { timeZone: 'Asia/Phnom_Penh', hour12: true }),
        },
      ]);

    if (error) throw error;

    // Format and send the new comment to Telegram (without time)
    const message = `🔶 [New Comment on ${productName}](https://tinh25.com/product/${route.params.id})\n\n🎭 ${userName}\n👋 ${newComment.value}`;
    await sendToTelegram(message);

    newComment.value = ""; // Reset input field
    fetchComments(); // Refresh comments
  } catch (error) {
    console.error("Error posting comment:", error);
  }
};


const replyCommentPost = async (commentId) => {
  if (!newReply.value.trim()) {
    alert("Reply cannot be empty");
    return;
  }

  try {
    const user = supabase.auth.user();
    const userName = user?.user_metadata?.full_name || "Unknown User";
    const productName = product.value?.title || "Unknown Product";
    const parentComment = comments.value.find(comment => comment.id === commentId)?.message || "Unknown Comment";
    const parentUser = comments.value.find(comment => comment.id === commentId)?.users?.fullname || "Unknown User";

    const { error } = await supabase
      .from("comments")
      .insert([
        {
          parent_id: commentId,
          product_id: parseInt(route.params.id),
          user_id: user.id,
          message: newReply.value,
          created_at: new Date().toLocaleString('en-US', { timeZone: 'Asia/Phnom_Penh', hour12: true }),
        },
      ]);

    if (error) throw error;

    // Format and send the reply to Telegram
    const message = `🔶 [New Comment on ${productName}](https://tinh25.com/product/${route.params.id})\n\n🎭 *${parentUser}*\n👋 ${parentComment}\n\n       ↪️ *${userName}*\n       👋 ${newReply.value}`;

    fetchComments(); // Refresh comments
    await sendToTelegram(message);

    newReply.value = "";
  } catch (error) {
    console.error("Error posting reply:", error);
  }
};


const sendToTelegram = async (message) => {
  const BOT_TOKEN = "7641689712:AAHTuJHvk-5f5hpSu1MXBWG5O9m3WYHMS5c"; // Replace with your Telegram bot token
  const CHAT_ID = "-4729045567"; // Replace with your Telegram group chat ID
  const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

  try {
    await fetch(TELEGRAM_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message,
        parse_mode: "Markdown",
      }),
    });
  } catch (error) {
    console.error("Error sending message to Telegram:", error);
  }
};

// Delete a comment
const deleteComment = async (commentId) => {
  try {
    const { error } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId);

    if (error) throw error;
    fetchComments(); // Refresh comments
  } catch (error) {
    console.error("Error deleting comment:", error);
  }
};

// Watch for route changes and refetch product details
watch(() => route.params.id, fetchProductDetails, { immediate: true });

function addCartButton() {
  // console.log("computedPrice:", computedPrice.value);
  if (quantity.value > 0) {
    const selectedOptionData = product_options.value.find(
      (option) => option.id === selectedOption.value
    );
    const item = {
      product_id: product.value.product_id,
      title: product.value.title,
      price: selectedOptionData
        ? selectedOptionData.price - product.value.discount
        : product.value.price - product.value.discount,
      discount: product.value.discount,
      thumbnail: product.value.thumbnail,
      quantity: quantity.value,
      options: product_options.value && selectedOptionData
        ? selectedOptionData.name
        : product_options.value.length > 0 ? product_options.value[0].name : null
    };
    console.log("item:", item);
    cartStore.addItem(item);
  }
}


onMounted(() => {
  fetchProductDetails();
  fetchComments();
  fetchProductOptions();
  cartStore.loadCartFromSupabase();
});
</script>

<template>
  <div>
    <Navbar />
    <div
      class="mx-auto max-w-6xl px-4 mt-16 sm:px-6 lg:px-8 lg:py-24 grid grid-cols-1 gap-0 lg:grid-cols-2 lg:gap-16 xl:gap-0">

      <lightbox :images="images" v-show="!isLoading" />
      <div class=" mt-16" v-if="isLoading">
        <SkeletonProduct />
      </div>
      <LoadingIcon class="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30 w-20"
        v-if="isLoading" />

      <div class="text-left mt-10 lg:mx-0 mx-auto mt-5 px-0">
        <router-link :to="`/profile/${seller?.replace(/\s+/g, '-') ?? 'unknown-seller'}`">
          {{ seller ?? "Unknown Seller" }}
        </router-link>
        <h2 class="text-2xl font-bold w-90 mb-3 lg:mb-6">
          {{ product.title }}
        </h2>
        <p class="text-[#a1a1a1] max-w-96 mb-5" v-html="product?.content ?? 'No description'">
        </p>
        <!-- Options -->
        <div class="flex flex-col gap-2">
          <p class="text-sm font-medium">Options</p>
          <div class="grid grid-cols-2 gap-2">
            <div v-for="option in product_options" :key="option.id" class="flex items-center">
              <input type="radio" :id="option?.id" :value="option?.id" v-model="selectedOption" name="option"
                class="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded">
              <label :for="option?.id" class="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {{ option?.name }}
              </label>
            </div>
          </div>
        </div>
        <!-- Price and Stock  -->
        <div class="flex justify-between items-center mt-7">
          <div class="flex justify-between mb-6 lg:flex-col md:items-left ">
            <div class="flex items-center">
              <p class="text-2xl font-bold me-3">${{ product_options.length === 0 ? (product.price - product.discount) :
                computedPrice }}</p>

              <a v-if="product.discount" class="bg-[#ff7d1a33] text-sm px-2 rounded-md">{{ (((product.price -
                (computedPrice)) / product.price) * 100).toFixed(2) }}%</a>
            </div>
            <del v-if="product.discount" class="text-[#a1a1a1] mt-1 md:ml-0 ml-3"> ${{ computedPrice + product.discount
              }}</del>
          </div>
          <div class="text-left mb-5"><span class="text-sm text-green-600">Stock</span> <span
              class="text-md text-gray-600"> {{
                product.stock }}</span></div>
        </div>
        <div class="flex flex-col lg:flex-row lg:justify-between w-full lg:w-auto space-y-4 lg:space-y-0">
          <div
            class="flex items-center justify-between w-full lg:w-32 h-12 bg-gray-100 dark:bg-gray-800 rounded-md p-2 shadow-sm">
            <button @click="quantity > 1 && quantity < product.stock ? quantity-- : quantity = 1"
              class="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 text-black hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600">
              <i class="fa-solid fa-minus"></i>
            </button>
            <p class="text-lg font-semibold text-gray-800 dark:text-gray-100">{{ quantity }}</p>
            <button @click="quantity < product.stock ? quantity++ : quantity = product.stock"
              class="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 text-black hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600">
              <i class="fa-solid fa-plus"></i>
            </button>
          </div>
          <button @click="addCartButton"
            class="flex items-center justify-center w-full lg:w-auto h-12 px-6 py-3 bg-orange-500 text-white rounded-md shadow-lg hover:bg-orange-600 transition duration-300 ease-in-out transform hover:scale-105">
            <i class="fa-solid fa-cart-plus mr-2"></i>
            <span class="font-medium text-sm lg:text-base">Add to cart</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Comment Section -->
    <section class="bg-white dark:bg-gray-900 py-8 lg:py-16 antialiased text-left">
      <div class="lg:max-w-screen-lg max-w-2xl mx-auto px-4">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-lg lg:text-2xl font-bold text-gray-900 dark:text-white">Discussion ({{ comments.length }})
          </h2>
        </div>

        <!-- Comment Form -->
        <form class="mb-6">
          <div class="py-2 px-4 mb-4 bg-white rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
            <label for="comment" class="sr-only">Your comment</label>
            <textarea id="comment" rows="6" v-model="newComment"
              class="w-full text-sm text-gray-900 border-0 focus:ring-0 dark:text-white dark:placeholder-gray-400 dark:bg-gray-800"
              placeholder="Write a comment..." required></textarea>
          </div>
          <button type="button" @click="postComment"
            class="inline-flex items-center py-2.5 px-4 text-xs font-medium text-white bg-primary-700 rounded-lg hover:bg-primary-800 focus:ring-4 focus:ring-primary-200 dark:focus:ring-primary-900">
            Post comment
          </button>
        </form>

        <!-- Comments List -->
        <div v-for="comment in comments" :key="comment.id" class="mb-2">
          <div v-show="!comment.parent_id" class=" bg-gray-200 dark:bg-gray-800 rounded-lg p-4">
            <article class="p-6 text-base rounded-lg dark:bg-gray-900">
              <footer class="flex justify-between items-center mb-2">
                <router-link :to="`/profile/${comment.users?.fullname?.replace(/\s+/g, '-') ?? 'unknown-user'} `">
                  <div class="flex items-center">
                    <p class="inline-flex items-center mr-3 text-sm font-semibold text-gray-900 dark:text-white">
                      <img class="mr-2 w-6 h-6 rounded-full" :src="comment.users?.meta?.avatar_url" alt="User Avatar">
                    <p class="truncate">{{ comment?.users?.fullname ?? "Unknown User" }}</p>
                    </p>
                    <p class="text-sm text-gray-600 dark:text-gray-400">
                      <time :datetime="comment.created_at">{{ new Date(comment.created_at).toLocaleString('en-US', {
                        year:
                          'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      }) }}</time>
                    </p>
                  </div>
                </router-link>
                <button v-show="supabase.auth.user().id === comment?.user_id" @click="deleteComment(comment.id)"
                  class="text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700 p-2 text-sm rounded-lg focus:outline-none">
                  <i class="fa-solid fa-trash"></i><span class="hidden md:inline"> &nbsp; Delete</span>
                </button>
              </footer>
              <p class="text-gray-500 dark:text-gray-400">{{ comment.message }}</p>

              <!-- Reply Form -->
              <div class="flex items-center mt-4 space-x-4">
                <form>
                  <div class="flex items-center px-3 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg">
                    <router-link
                      :to="`/profile/${supabase.auth.user().user_metadata?.full_name?.replace(/\s+/g, '-') ?? 'unknown-user'} `"
                      class="inline-flex lg:w-2/4 w-1/5 items-center mr-3 text-sm font-semibold text-gray-900 dark:text-white">
                      <img class="mr-2 w-6 h-6 rounded-full" :src="supabase.auth.user()?.user_metadata?.avatar_url"
                        alt="User Avatar">
                      <span class="truncate hidden inline-block md:inline">{{
                        supabase.auth.user().user_metadata?.full_name }}</span>
                    </router-link>
                    <textarea id="chat" rows="1" v-model="newReply"
                      class="w-full p-2.5 mr-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                      placeholder="reply..."></textarea>
                    <button type="button" @click="replyCommentPost(comment.id)"
                      class="px-5 py-1.5 text-gray-600 rounded-sm hover:bg-gray-300 dark:hover:bg-gray-600">
                      <i class="fa-solid fa-reply-all"></i>
                    </button>
                  </div>
                </form>
              </div>
            </article>

            <!-- Replies Section -->
            <div v-for="reply in comments" :key="reply.id" v-show="reply.parent_id === comment.id"
              class="ml-6 lg:ml-12">
              <article class="p-6 mb-1 text-base bg-gray-100 rounded-lg dark:bg-gray-900">
                <footer class="flex justify-between items-center mb-2">
                  <div class="flex items-center">
                    <router-link :to="`/profile/${reply?.users?.fullname?.replace(/\s+/g, '-') ?? 'unknown-user'}`">
                      <p class="inline-flex items-center mr-3 text-sm font-semibold text-gray-900 dark:text-white">
                        <img class="mr-2 w-6 h-6 rounded-full" :src="reply.users?.meta?.avatar_url" alt="User Avatar">
                        <span class="truncate whitespace-nowrap">{{ reply?.users?.fullname }}</span>
                      </p>
                    </router-link>
                    <p class="text-sm text-gray-600 dark:text-gray-400">
                      <time :datetime="reply.created_at">{{ new Date(reply?.created_at).toLocaleString('en-US', {
                        year:
                          'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      }) }}</time>
                    </p>
                  </div>

                </footer>
                <div class="justify-between items-start flex">
                  <p class="text-gray-500 dark:text-gray-400">{{ reply.message }}</p>
                  <button v-show="supabase.auth.user().id === reply.user_id" @click="deleteComment(reply.id)"
                    class="lg:pr-2 pr-0 mt-0 p-2 text-red-500 lg:bg-white rounded-lg hover:bg-gray-100 focus:ring-4 focus:ring-red-200 dark:bg-gray-900 dark:hover:bg-gray-700 flex items-center whitespace-nowrap">
                    <i class="fa-solid fa-trash mr-1"></i><span class="hidden md:inline">Delete</span>
                  </button>
                </div>
              </article>
            </div>
          </div>
        </div>
      </div>
    </section>

    <AppFooter />
  </div>
</template>

<style scoped></style>