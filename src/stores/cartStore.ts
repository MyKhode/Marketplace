import { defineStore } from "pinia";
import { ref, onMounted } from "vue";
import { supabase } from "@/services/supabase";
import cart from "./cart.vue";
import { User } from "@supabase/supabase-js";

interface CartItem {
  cart_id: string;
  product_id: string;
  title: string;
  meta_title: string;
  price: number;
  discount: number;
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
  const cartRef = ref(null);
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
      // console.error("Error adding item to cart:", error);
      console.error("Error adding item to cart:");
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
      // console.error("Error removing item from cart:", error);
      console.error("Error removing item from cart:");
    } else {
      await loadCartFromSupabase();
    }
  };

  const loadCartFromSupabase = async () => {
    if (!user.value) return;

    const { data, error } = await supabase
      .from("cart")
      .select(
        `cart_id, product_id, quantity, product:product_id (title, price, discount, meta_title, thumbnail, seller_id)`
      )
      .eq("user_id", user.value.id);

    if (error) {
      // console.error("Error loading cart:", error);
      console.error("Error loading cart:");
      return;
    }

    cartItems.value = (data || [])
      .map(
        (item: any) =>
          item.product && {
            cart_id: item.cart_id,
            product_id: item.product_id,
            title: item.product.title,
            meta_title: item.product.meta_title,
            price: item.product.price - item.product.discount,
            discount: item.product.discount,
            thumbnail: item.product.thumbnail,
            quantity: item.quantity,
            seller_id: item.product.seller_id,
          }
      )
      .filter(Boolean) as CartItem[];
    // console.log("cartItems -- :", cartItems.value);
  };
  // console.log("value price:", cartItems.value[0].price);

  const checkout = async () => {
    if (!user.value || !user.value.id) {
      console.error("User is not logged in");
      return; // Early return if the user is not logged in
    }

    try {
      // console.log("checkout, user:", user.value);
      // console.log("checkout, cartItems:", cartItems.value);

      const { data: addressData, error: addressError } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.value.id)
        .single();

      const { data: productData, error: ProductError } = await supabase
        .from("product")
        .select("*")
        .in("product_id", cartItems.value.map((item) => item.product_id));
      const products = productData || [];
      if (ProductError)
        throw new Error(`Failed to fetch products: ${ProductError.message}`);
      if (addressError)
        throw new Error(`Failed to fetch address: ${addressError.message}`);
      // const shippingAddress = addressData
      //   ? Object.values(addressData).join(", ")
      //   : "No address provided";

      const shippingAddress = addressData?.address || "No address provided";
      const phone_number =
        addressData?.phone_number || "No phone number provided";
      const full_name = addressData?.fullname || "No name provided";
      const totalPrice = cartItems.value.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
      // Insert all cart items into the order table
      const orderRecords = cartItems.value.map((item) => ({
        user_id: user?.value?.id,
        product_id: item.product_id,
        // title: item.title,
        price: item.price,
        quantity: item.quantity,
        total_price: item.price * item.quantity, // Assuming total price for each item
        order_status: "pending",
        order_date: new Date(),
        address: shippingAddress,
        phone_number: phone_number,
        full_name: full_name,
        // seller_id: item.seller_id,
        // thumbnail: item.thumbnail,
      }));

      console.log("orderRecords:", orderRecords);

      // Insert all the cart items as separate orders
      const { data: orderData, error: orderError } = await supabase
        .from("order")
        .insert(orderRecords);

      // console.log("orderData:", orderData);
      // console.log("orderError:", orderError);

      if (orderError || !orderData)
        throw new Error(`Failed to create orders: ${orderError?.message}`);

      // After inserting the orders, delete the cart items
      const { error: clearCartError } = await supabase
        .from("cart")
        .delete()
        .eq("user_id", user.value.id);

      if (clearCartError)
        throw new Error(`Failed to clear cart: ${clearCartError.message}`);

      // Construct message for Telegram
      let message = `🚀 *New Order Received* 🚀\n\n`;
      message += `👤 *Customer Name:* ${full_name}\n📞 *Phone:* ${phone_number}\n📍 *Address:* ${shippingAddress}\n\n`;
      message += `🛒 *Order Details:*\n`;
      cartItems.value.forEach((item) => {
        message += `  • ${item.title} - ${item.quantity} x $${item.price}\n`;
      });
      cartItems.value.forEach((item, index) => {
        message += `#${index + 1} *${item.title}* - ${item.quantity} x $${
          item.price
        }\n`;
      });
      message += `\n💰 *Total Price:* $${totalPrice}\n🕒 *Order Time:* ${new Date().toLocaleString()}`;

      // Send order details to Telegram
      await sendToTelegram(message);

      cartItems.value = []; // Clear cart items locally

      console.log("Checkout successful!");
    } catch (error) {
      console.error("Error during checkout:", error);
    }
  };

  const sendToTelegram = async (message: string) => {
    const BOT_TOKEN = "7641689712:AAHTuJHvk-5f5hpSu1MXBWG5O9m3WYHMS5c"; // Replace with your Telegram bot token
    const CHAT_ID = "-1002423725086"; // Replace with your Telegram group chat ID
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
    cartRef,
  };
});
