<template>
    <Navbar/>
    <div class="min-h-screen max-w-screen-lg mx-auto p-5">
      <h1 class="text-3xl font-bold mb-5">Product Details</h1>
      <div v-if="product" class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <img
          :src="product.image"
          :alt="product.name"
          class="rounded-lg w-full h-96 object-cover"
        />
        <div>
          <h2 class="text-2xl font-semibold">{{ product.name }}</h2>
          <p class="text-gray-500 text-lg capitalize my-2">
            Category: {{ product.category }}
          </p>
          <p class="text-lg font-bold text-indigo-600 my-3">
            Price: ${{ product.price }}
          </p>
          <del v-if="product.oldPrice" class="text-gray-400">
            Old Price: ${{ product.oldPrice }}
          </del>
          <p class="mt-5">{{ product.description || "No description available." }}</p>
        </div>
      </div>
      <router-link to="/" class="mt-10 inline-block text-indigo-600 hover:underline">
        ← Back to Home
      </router-link>
    </div>
  </template>
  
  <script>
  import { ref, onMounted } from "vue";
  
  export default {
    props: ["id"], // Receive the id as a prop
    setup(props) {
      const product = ref(null);
  
      // Mock fetching product details
      const products = [
        {
          id: 1,
          name: "Wireless Headphones",
          category: "electronics",
          price: 99.99,
          oldPrice: 129.99,
          image: "https://d2v5dzhdg4zhx3.cloudfront.net/web-assets/images/storypages/primary/ProductShowcasesampleimages/JPEG/Product+Showcase-1.jpg",
          description: "High-quality wireless headphones.",
        },
        {
          id: 2,
          name: "Wireless Headphones",
          category: "electronics",
          price: 99.99,
          oldPrice: 129.99,
          image: "https://d2v5dzhdg4zhx3.cloudfront.net/web-assets/images/storypages/primary/ProductShowcasesampleimages/JPEG/Product+Showcase-1.jpg",
          description: "High-quality wireless headphones.",
        },
        {
          id: 3,
          name: "Wireless Headphones",
          category: "electronics",
          price: 99.99,
          oldPrice: 129.99,
          image: "https://d2v5dzhdg4zhx3.cloudfront.net/web-assets/images/storypages/primary/ProductShowcasesampleimages/JPEG/Product+Showcase-1.jpg",
          description: "High-quality wireless headphones.",
        },
        {
          id: 4,
          name: "Wireless Headphones",
          category: "electronics",
          price: 99.99,
          oldPrice: 129.99,
          image: "https://d2v5dzhdg4zhx3.cloudfront.net/web-assets/images/storypages/primary/ProductShowcasesampleimages/JPEG/Product+Showcase-1.jpg",
          description: "High-quality wireless headphones.",
        },
        // Add other products as needed
      ];
  
      onMounted(() => {
        // Find product by id
        product.value = products.find((p) => p.id === Number(props.id));
      });
  
      return { product };
    },
  };
  </script>
  
  <style scoped>
  h1 {
    color: #2c3e50;
  }
  </style>
  