import { defineStore } from "pinia";
import { ref, onMounted } from "vue";
import { supabase } from "@/services/supabase";
import { User } from "@supabase/supabase-js";

interface CartItem {
  cart_id: string;
  product_id: string;
  title: string;
  price: number;
  thumbnail: string;
  quantity: number;
  seller_id: string;
}

export const useCartStore = defineStore("cart", () => {
  const user = ref<User | null>(null);
  const metadata = ref<Record<string, any>>({});
  const avatarUrl = ref<string>(
    "https://media.istockphoto.com/id/1327592449/vector/default-avatar-photo-placeholder-icon-grey-profile-picture-business-man.jpg?s=612x612&w=0&k=20&c=yqoos7g9jmufJhfkbQsk-mdhKEsih6Di4WZ66t_ib7I="
  );
  const cartItems = ref<CartItem[]>([]);
  const isCartVisible = ref<boolean>(false);
  const sellerId = ref<string>("");

  onMounted(() => {
    const currentUser = supabase.auth.user() as User;
    if (currentUser) {
      user.value = currentUser;
      metadata.value = currentUser.user_metadata || {};
      avatarUrl.value = metadata.value.avatar_url || avatarUrl.value;
    }
  });

  const setSellerId = (id: string) => {
    sellerId.value = id;
  };

  const addItem = async (item: CartItem) => {
    if (!user.value) return;

    const { error } = await supabase.from("cart").upsert({
      user_id: user.value.id,
      product_id: item.product_id,
      quantity: item.quantity,
    });

    if (error) {
      console.error("Error adding item to cart:", error);
    } else {
      await loadCartFromSupabase();
    }
  };

  const removeItem = async (id: string) => {
    if (!user.value) return;

    const { error } = await supabase
      .from("cart")
      .delete()
      .eq("user_id", user.value.id)
      .eq("cart_id", id);

    if (error) {
      console.error("Error removing item from cart:", error);
    } else {
      await loadCartFromSupabase();
    }
  };

  const loadCartFromSupabase = async () => {
    if (!user.value) return;

    const { data, error } = await supabase
      .from("cart")
      .select(`cart_id, product_id, quantity, product:product_id (title, price, thumbnail, seller_id)`)
      .eq("user_id", user.value.id);

    if (error) {
      console.error("Error loading cart:", error);
      return;
    }

    cartItems.value = (data || [])
      .map((item: any) => item.product && {
        cart_id: item.cart_id,
        product_id: item.product_id,
        title: item.product.title,
        price: parseFloat(item.product.price),
        thumbnail: item.product.thumbnail,
        quantity: item.quantity,
        seller_id: item.product.seller_id,
      })
      .filter(Boolean) as CartItem[];
  };

  const checkout = async () => {
    if (!user.value || !user.value.id) {
      console.error("User is not logged in");
      return; // Early return if the user is not logged in
    }
  
    try {
      console.log("checkout, user:", user.value);
      console.log("checkout, cartItems:", cartItems.value);
  
      const { data: addressData, error: addressError } = await supabase
        .from("user_address")
        .select("*")
        .eq("user_id", user.value.id)
        .single();
  
      if (addressError) throw new Error(`Failed to fetch address: ${addressError.message}`);
      const shippingAddress = addressData
        ? Object.values(addressData).join(", ")
        : "No address provided";
  
      const totalPrice = cartItems.value.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
  
      console.log("totalPrice:", totalPrice);
      console.log("order_date:", new Date());
      console.log("address:", shippingAddress);
      console.log("order_status:", "pending");
      console.log("user_id:", user.value.id);
      console.log("product_id:", cartItems.value.map((item) => item.product_id));
  
      // Insert all cart items into the order table
      const orderRecords = cartItems.value.map((item) => ({
        user_id: user.value.id,
        product_id: item.product_id,
        // title: item.title,
        price: item.price,
        quantity: item.quantity,
        total_price: item.price * item.quantity, // Assuming total price for each item
        order_status: "pending",
        order_date: new Date(),
        address: shippingAddress,
        // seller_id: item.seller_id,
        // thumbnail: item.thumbnail,
      }));
  
      console.log("orderRecords:", orderRecords);
  
      // Insert all the cart items as separate orders
      const { data: orderData, error: orderError } = await supabase
        .from("order")
        .insert(orderRecords);
  
      console.log("orderData:", orderData);
      console.log("orderError:", orderError);
  
      if (orderError || !orderData) throw new Error(`Failed to create orders: ${orderError?.message}`);
  
      // After inserting the orders, delete the cart items
      const { error: clearCartError } = await supabase
        .from("cart")
        .delete()
        .eq("user_id", user.value.id);
  
      if (clearCartError) throw new Error(`Failed to clear cart: ${clearCartError.message}`);
  
      cartItems.value = []; // Clear cart items locally
      console.log("Checkout successful!");
    } catch (error) {
      console.error("Error during checkout:", error);
    }
  };
  

  const toggleCartVisibility = () => {
    isCartVisible.value = !isCartVisible.value;
  };

  return {
    user,
    avatarUrl,
    cartItems,
    isCartVisible,
    setSellerId,
    addItem,
    removeItem,
    loadCartFromSupabase,
    toggleCartVisibility,
    checkout,
  };
});
