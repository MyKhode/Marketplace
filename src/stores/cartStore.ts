import { defineStore } from "pinia";
import { ref, onMounted } from "vue";

// Define a type for cart items
interface CartItem {
  id: number | string;
  name: string;
  price: number;
  quantity: number;
  [key: string]: any; // Allow for additional properties
}

export const useCartStore = defineStore("cart", () => {
  const cartItems = ref<CartItem[]>([]);
  const toggleCart = ref<boolean>(false);

  // Add item to cart
  function addItem(item: CartItem): void {
    const existingItem = cartItems.value.find((i) => i.id === item.id);
    if (existingItem) {
      existingItem.quantity += item.quantity;
    } else {
      cartItems.value.push({ ...item });
    }
    saveCartToLocalStorage();
  }

  // Remove item from cart
  function removeItem(id: number | string): void {
    cartItems.value = cartItems.value.filter((item) => item.id !== id);
    saveCartToLocalStorage();
  }

  // Clear the entire cart
  function clearCart(): void {
    cartItems.value = [];
    saveCartToLocalStorage();
  }

  // Toggle cart visibility
  function toggleCartVisibility(): void {
    toggleCart.value = !toggleCart.value;
    console.log(toggleCart.value);
  }

  // Save cart to localStorage
  function saveCartToLocalStorage(): void {
    localStorage.setItem("cart", JSON.stringify(cartItems.value));
  }

  // Load cart from localStorage
  function loadCartFromLocalStorage(): void {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      try {
        cartItems.value = JSON.parse(savedCart) as CartItem[];
      } catch (error) {
        console.error("Failed to parse cart data from localStorage:", error);
      }
    }
  }

  // Automatically load cart from localStorage when the store is initialized
  onMounted(() => {
    loadCartFromLocalStorage();
  });

  return {
    cartItems,
    toggleCart,
    addItem,
    removeItem,
    clearCart,
    toggleCartVisibility,
    saveCartToLocalStorage,
    loadCartFromLocalStorage,
  };
});
