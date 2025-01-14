import { defineStore } from "pinia";
import { ref, onMounted } from "vue";
import Cookies from "js-cookie";

export const useCartStore = defineStore("cart", () => {
  const cartItems = ref([]);
  const toggleCart = ref(false);

  // Add item to cart
  function addItem(item) {
    const existingItem = cartItems.value.find((i) => i.id === item.id);
    if (existingItem) {
      existingItem.quantity += item.quantity;
    } else {
      cartItems.value.push({ ...item });
    }
    saveCartToCookie(); // Save to cookie
  }

  // Remove item from cart
  function removeItem(id) {
    cartItems.value = cartItems.value.filter((item) => item.id !== id);
    saveCartToCookie(); // Save to cookie
  }

  // Clear the entire cart
  function clearCart() {
    cartItems.value = [];
    saveCartToCookie(); // Save to cookie
  }

  // Toggle cart visibility
  function toggleCartVisibility() {
    toggleCart.value = !toggleCart.value;
    console.log(toggleCart.value);
  }

  // Save cart to cookie
  function saveCartToCookie() {
    Cookies.set("cart", JSON.stringify(cartItems.value), { expires: 7 }); // Save cart with 7-day expiry
  }

  // Load cart from cookie
  function loadCartFromCookie() {
    const savedCart = Cookies.get("cart");
    if (savedCart) {
      cartItems.value = JSON.parse(savedCart);
    }
  }

  // Automatically load cart from cookie when the store is initialized
  onMounted(() => {
    loadCartFromCookie();
  });

  return {
    cartItems,
    toggleCart,
    addItem,
    removeItem,
    clearCart,
    toggleCartVisibility,
    saveCartToCookie,
    loadCartFromCookie,
  };
});
