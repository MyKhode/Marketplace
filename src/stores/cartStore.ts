import { defineStore } from "pinia";
import { ref, onMounted } from "vue";
import cart from "./cart.vue";
import { supabase } from "@/services/supabase";
import { User } from "@supabase/supabase-js";

const user = ref<User | null>(null);
const metadata = ref(user.value?.user_metadata || {});
const avatar_url = ref(metadata.value?.avatar_url || 'https://media.istockphoto.com/id/1327592449/vector/default-avatar-photo-placeholder-icon-grey-profile-picture-business-man.jpg?s=612x612&w=0&k=20&c=yqoos7g9jmufJhfkbQsk-mdhKEsih6Di4WZ66t_ib7I=');

interface CartItem {
  cart_id: string;
  product_id: string;
  title: string;
  price: number;
  thumbnail: string;
  quantity: number;
  // seller_id: string; // We will fetch this via product_id
}

export const useCartStore = defineStore("cart", () => {
  const cartItems = ref<CartItem[]>([]);
  const toggleCart = ref<boolean>(false);
  const seller_id = ref<string>(""); // Define seller_id as a ref

  // Initialize user on mounted (get session once)
  onMounted(() => {
    const currentUser = supabase.auth.user();
    if (currentUser) {
      user.value = currentUser;
      metadata.value = currentUser.user_metadata;
      avatar_url.value = metadata.value?.avatar_url || avatar_url.value;
    }
  });

  // Set seller_id dynamically from another script
  function setSellerId(id: string) {
    seller_id.value = id;
  }

  // Add item to the cart in Supabase
  async function addItem(item: CartItem) {
    if (!user.value) return;

    const { error } = await supabase
      .from("cart")
      .upsert({
        user_id: user.value.id,
        product_id: item.product_id,
        quantity: item.quantity,
      });

    if (error) {
      console.error("Error adding item to cart:", error);
    } else {
      await loadCartFromSupabase(seller_id.value); // Pass the seller_id dynamically
    }
  }

  // Remove item from the cart in Supabase
  async function removeItem(id: string) {
    if (!user.value) return;
  
    const { error } = await supabase
      .from("cart")
      .delete()
      .eq("user_id", user.value.id)
      .eq("cart_id", id); // Use the unique `id` to delete the specific item
  
    if (error) {
      console.error("Error removing item from cart:", error);
    } else {
      await loadCartFromSupabase(seller_id.value);
    }
  }
  

  // Load cart items from Supabase and fetch seller_id via product_id
  async function loadCartFromSupabase(sellerId: string) {
    if (!user.value || !sellerId) return;
  
    const { data, error } = await supabase
      .from("cart")
      .select(`cart_id, product_id, quantity, product:product_id (title, price, thumbnail, seller_id)`)
      .eq("user_id", user.value.id)
      .eq("product.seller_id", sellerId); // Filter by seller_id
    
    if (error) {
      console.error("Error loading cart:", error);
    } else {
      cartItems.value = data.map((item: any) => {
        // Check if the product data is available before accessing properties
        const product = item.product;
        if (product) {
          return {
            cart_id: item.cart_id,
            product_id: item.product_id,
            title: product.title,
            price: parseFloat(product.price),
            thumbnail: product.thumbnail,
            quantity: item.quantity,
            seller_id: product.seller_id,
          };
        } else {
          // If no product found, you can return an empty object or skip adding it
          return null; // Skip this cart item if product data is missing
        }
      }).filter((item: null) => item !== null); // Remove any null entries
    }
  }
  

  // Toggle the cart's visibility
  function toggleCartVisibility() {
    toggleCart.value = !toggleCart.value;
  }

  return {
    user,
    avatar_url,
    cartItems,
    toggleCart,
    setSellerId, // Expose the function to set the seller_id
    addItem,
    removeItem,
    loadCartFromSupabase,
    toggleCartVisibility,
  };
});
