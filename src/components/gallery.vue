<script setup>
import { ref, onMounted, watch } from "vue";
import { useRoute } from "vue-router";
import { supabase } from "@/services/supabase";
import lightbox from "./lightbox.vue";
import Navbar from "./Navbar.vue";
import AppFooter from "./AppFooter.vue";

const route = useRoute();
const product = ref({});
const seller = ref("Unknown Seller");
const images = ref([]);
const quantity = ref(0);
const comments = ref([]);
const newComment = ref("");
const editingCommentId = ref(null);
const editedCommentContent = ref("");
const newReply = ref("");
const isLoading = ref(true);

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


// Post a new comment
const postComment = async () => {
  try {
    // const { data: user, error: userError } = await supabase.auth.user();
    // if (userError || !user) throw userError;
    console.log("Comment:", newComment.value, "User ID:", supabase.auth.user().id);

    const { error } = await supabase
      .from("comments")
      .insert([
        {
          product_id: parseInt(route.params.id),
          user_id: supabase.auth.user().id,
          message: newComment.value,
          created_at: new Date().toLocaleString('en-US', { timeZone: 'Asia/Phnom_Penh', hour12: true }),
        },
      ]);

    if (error) throw error;
    newComment.value = ""; // Reset input field
    fetchComments(); // Refresh comments
  } catch (error) {
    console.error("Error posting comment:", error);
  }
};

const replyCommentPost = async (commentId) => {
  try {
    const { error } = await supabase
      .from("comments")
      .insert([
        {
          parent_id: commentId,
          product_id: parseInt(route.params.id),
          user_id: supabase.auth.user().id,
          message: newReply.value,
          created_at: new Date().toLocaleString('en-US', { timeZone: 'Asia/Phnom_Penh', hour12: true }),
        },
      ]);

    if (error) throw error;
    newComment.value = ""; // Reset input field
    newReply.value = "";
    fetchComments(); // Refresh comments
  } catch (error) {
    console.error("Error posting comment:", error);
  }
}

// Edit a comment
const editComment = async (commentId, newContent) => {
  try {
    const { error } = await supabase
      .from("comments")
      .update({ content: newContent })
      .eq("id", commentId);

    if (error) throw error;
    fetchComments(); // Refresh comments
    editingCommentId.value = null; // Reset editing state
  } catch (error) {
    console.error("Error updating comment:", error);
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

onMounted(() => {
  fetchProductDetails();
  fetchComments();
});
</script>

<template>
  <div>
    <Navbar />
    <div class="lg:flex lg:justify-center gap-28 lg:items-center mx-auto lg:mt-28 mt-11 h-full lg:w-1/2">

      <lightbox :images="images"  v-show="!isLoading"/>
      <div class=" mt-16" v-if="isLoading" >
        <SkeletonProduct />
      </div>

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
                <router-link :to="`/profile/${comment.users.fullname.replace(/\s+/g, '-')}`">
                  <div class="flex items-center">
                    <p class="inline-flex items-center mr-3 text-sm font-semibold text-gray-900 dark:text-white">
                      <img class="mr-2 w-6 h-6 rounded-full" :src="comment.users.meta.avatar_url" alt="User Avatar">
                      <p class="truncate">{{ comment.users.fullname }}</p>
                    </p>
                    <p class="text-sm text-gray-600 dark:text-gray-400">
                      <time :datetime="comment.created_at">{{ new Date(comment.created_at).toLocaleString('en-US', {
                        year:
                          'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      }) }}</time>
                    </p>
                  </div>
                </router-link>
                <button v-show="supabase.auth.user().id === comment.user_id" @click="deleteComment(comment.id)"
                  class="text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700 p-2 text-sm rounded-lg focus:outline-none">
                  <i class="fa-solid fa-trash"></i><span class="hidden md:inline"> &nbsp; Delete</span>
                </button>
              </footer>
              <p class="text-gray-500 dark:text-gray-400">{{ comment.message }}</p>

              <!-- Reply Form -->
              <div class="flex items-center mt-4 space-x-4">
                <form>
                  <div class="flex items-center px-3 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg">
                    <router-link :to="`/profile/${supabase.auth.user().user_metadata.full_name.replace(/\s+/g, '-')}`"
                      class="inline-flex lg:w-2/4 w-1/5 items-center mr-3 text-sm font-semibold text-gray-900 dark:text-white">
                      <img class="mr-2 w-6 h-6 rounded-full"
                        :src="supabase.auth.user()?.user_metadata?.avatar_url" alt="User Avatar">
                      <span class="truncate hidden inline-block md:inline">{{ supabase.auth.user().user_metadata.full_name }}</span>
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
                    <router-link :to="`/profile/${reply.users.fullname.replace(/\s+/g, '-')}`">
                      <p class="inline-flex items-center mr-3 text-sm font-semibold text-gray-900 dark:text-white">
                        <img class="mr-2 w-6 h-6 rounded-full" :src="reply.users.meta.avatar_url" alt="User Avatar">
                        <span class="truncate whitespace-nowrap">{{ reply.users.fullname }}</span>
                      </p>
                    </router-link>
                    <p class="text-sm text-gray-600 dark:text-gray-400">
                      <time :datetime="reply.created_at">{{ new Date(reply.created_at).toLocaleString('en-US', {
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