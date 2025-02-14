<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { supabase } from "@/services/supabase";
import { useCartStore } from "@/stores/cartStore";
import { User } from "@supabase/supabase-js";
import { useRouter } from "vue-router";
import cart from "./cart.vue";
import router from "@/router";

const user = supabase.auth.user() as User | null;
const metadata = ref(user?.user_metadata || {});

const cartStore = useCartStore();
const abaPayUrl = ref<string | null>(null);
const trxId = ref("");
const isTrxIdUsed = ref<boolean>(false);
const isValidTransaction = ref<boolean>(false);
const isValidTransactionFailed = ref<boolean>(false);

const full_name = ref("");
const phone = ref("");
const address = ref("");

const notification = ref(false);
const notificationMessage = ref("");
const typeNotification = ref("");

const setNotification = (message: string, type: string) => {
  notificationMessage.value = message;
  typeNotification.value = type;
  notification.value = true;

  if (type === "success") {
    isValidTransactionFailed.value = false;
  }

  if (type === "error") {
    isValidTransactionFailed.value = true;
  }

  setTimeout(() => {
    notification.value = false;
    isValidTransactionFailed.value = false;
  }, 3000);
};

const abaPayUrlFetch = async () => {
  try {
    const totalPrice = cartStore.cartItems
      .reduce((total, product) => total + product.price * product.quantity, 0)
      .toFixed(2);

    const { data: PaymentData, error: PaymentError } = await supabase
      .from("aba_payway")
      .select("aba_url")
      .eq("price", totalPrice);

    if (PaymentError) return;

    if (PaymentData && PaymentData.length > 0) {
      abaPayUrl.value = PaymentData[0].aba_url;
    }
  } catch (error) {
    setNotification("Unexpected error during fetch", "error");
  }
};

const validateTransaction = async () => {
  const totalPrice = cartStore.cartItems
    .reduce((total, product) => total + product.price * product.quantity, 0)
    .toFixed(2);

  try {
    const { data: transactionData, error } = await supabase
      .from("transections")
      .select("purchase_id, purchase_price, is_used")
      .eq("purchase_id", trxId.value)
      .single();

    if (error || !transactionData) {
      setNotification("Transaction not found or invalid!", "error");
      return;
    }

    if (transactionData.is_used) {
      setNotification("This transaction ID has already been used!", "warning");
      isTrxIdUsed.value = true;
      return;
    }

    if (parseFloat(transactionData.purchase_price) === parseFloat(totalPrice)) {
      setNotification("Transaction validated successfully!", "success");
      isValidTransaction.value = true;
    } else {
      setNotification("Transaction amount does not match total price!", "error");
      isValidTransaction.value = false;
    }
  } catch (err) {
    setNotification("An error occurred during validation!", "error");
  }
};

const markTransactionAsUsed = async () => {
  try {
    const { error } = await supabase
      .from("transections")
      .update({ is_used: true })
      .eq("purchase_id", trxId.value);

    if (error) {
      setNotification("Failed to mark transaction as used!", "error");
      return;
    }
    setNotification("Transaction successfully marked as used!", "success");
    isTrxIdUsed.value = true;
  } catch (err) {
    setNotification("An error occurred while updating transaction!", "error");
  }
};

const initializeCheckoutInfo = async () => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("fullname, phone_number, address")
      .eq("id", user?.id)
      .single();

    if (error) return;

    if (data) {
      full_name.value = data.fullname;
      phone.value = data.phone_number;
      address.value = data.address;
    }
  } catch (err) {
    setNotification("Unexpected error while fetching user data!", "error");
  }
};
const UpdateUserInfo = async () => {
  try {
    const { error } = await supabase
      .from("users")
      .update({ phone_number: phone.value, address: address.value })
      .eq("id", supabase.auth.user()?.id);

    if (error) {  
      setNotification("Failed to update user information!", "error");
      return;
    }
  } catch (err) {
    setNotification("An error occurred while updating user information!", "error");
  }
};

const TransectionValidate = async () => {
  if (!full_name.value || !phone.value || !address.value) {
    setNotification("Please fill in all required fields!", "warning");
    return;
  }
  UpdateUserInfo();
  if (!trxId.value) {
    setNotification("Please enter a valid transaction ID!", "warning");
    return;
  }
  validateTransaction();
};

const OpenAbaPay = () => {
  if (abaPayUrl.value) {
    window.open(abaPayUrl.value, "_blank");
  }
};

const ProceedToCheckout = async () => {
  if (!isValidTransaction.value) return;

  try {
    await cartStore.checkout();
    await markTransactionAsUsed();
    router.push(`/profile/${user?.user_metadata?.full_name.replace(/\s+/g, '-')}`);
  } catch (error) {
    setNotification("Error during checkout process!", "error");
  }
};

onMounted(async () => {
  try {
    await initializeCheckoutInfo();
    await cartStore.loadCartFromSupabase();
    await abaPayUrlFetch();
  } catch (error) {
    setNotification("Error during setup!", "error");
  }
});

watch(
  () => cartStore.cartItems,
  async () => {
    await abaPayUrlFetch();
  }
);
</script>


<template>
  <Navbar />
  <Notification v-if="notification" :value="notificationMessage" :typeNotification="typeNotification" />
  <section class="dark:bg-gray-900 mt-0 bg-white py-8 antialiased md:mt-16 mt-10 md:py-16">
    <form action="#" class="mx-auto max-w-screen-xl px-4 text-left 2xl:px-0">
      <ol
        class="dark:text-gray-400 flex w-full max-w-2xl items-center text-center text-sm font-medium text-gray-500 sm:text-base">
        <li
          class="after:border-1 dark:text-primary-500 dark:after:border-gray-700 flex items-center text-primary-700 after:mx-6 after:hidden after:h-1 after:w-full after:border-b after:border-gray-200 sm:after:inline-block sm:after:content-[''] md:w-full xl:after:mx-10">
          <span
            class="dark:after:text-gray-500 flex items-center after:mx-2 after:text-gray-200 after:content-['/'] sm:after:hidden">
            <i class="fa-regular fa-circle-check mr-2"></i>
            Cart
          </span>
        </li>

        <li
          class="after:border-1 dark:text-primary-500 dark:after:border-gray-700 flex items-center text-primary-700 after:mx-6 after:hidden after:h-1 after:w-full after:border-b after:border-gray-200 sm:after:inline-block sm:after:content-[''] md:w-full xl:after:mx-10">
          <span
            class="dark:after:text-gray-500 flex items-center after:mx-2 after:text-gray-200 after:content-['/'] sm:after:hidden">
            <i class="fa-regular fa-circle-check mr-2"></i>
            Fill_Form
          </span>
        </li>

        <li :class="{ 'text-primary-700': isValidTransaction }" class="flex shrink-0 items-center ">
          <i class="fa-regular fa-circle-check mr-2"></i>
          Proceed Checkout
        </li>
      </ol>

      <div class="mt-6 sm:mt-8 lg:flex lg:items-start lg:gap-12 xl:gap-16">
        <div class="min-w-0 flex-1 space-y-8">
          <div class="space-y-4">
            <h2 class="dark:text-white text-xl font-semibold text-gray-900">
              Delivery Details
            </h2>

            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label for="your_name" class="dark:text-white mb-2 block text-sm font-medium text-gray-900">
                  គោត្ដនាម, នាម
                </label>
                <input type="text" id="your_name" v-model="full_name"
                  class="dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-primary-500 dark:focus:ring-primary-500 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-primary-500"
                  placeholder="John Doe" required />
              </div>

              <div>
                <label for="phone-input-3" class="dark:text-white mb-2 block text-sm font-medium text-gray-900">
                  លេខទំនាក់ទំនង *
                </label>
                <div class="flex items-center">
                  <button id="dropdown-phone-button-3" data-dropdown-toggle="dropdown-phone-3"
                    class="dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 dark:focus:ring-gray-700 z-10 inline-flex shrink-0 items-center rounded-s-lg border border-gray-300 bg-gray-100 px-4 py-2.5 text-center text-sm font-medium text-gray-900 hover:bg-gray-200 focus:outline-none focus:ring-4 focus:ring-gray-100"
                    type="button">
                    <img class="me-2 h-4 w-6" src="/images/Flag_of_Cambodia.svg" alt="" />
                    +855
                    <svg class="-me-0.5 ms-2 h-4 w-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24"
                      height="24" fill="none" viewBox="0 0 24 24">
                      <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="m19 9-7 7-7-7" />
                    </svg>
                  </button>
                  <div class="relative w-full">
                    <input type="text" id="phone-input" v-model="phone"
                      class="dark:border-gray-600 dark:border-s-gray-700 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-primary-500 z-20 block w-full rounded-e-lg border border-s-0 border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-primary-500"
                      pattern="(0?[0-9]{2}[0-9]{3}[0-9]{4})" placeholder="964074300" required />
                  </div>
                </div>
              </div>

              <div>
                <label for="Address" class="dark:text-white mb-2 block text-sm font-medium text-gray-900">
                  ទីតាំង *</label>
                <input type="text" id="Address" v-model="address"
                  class="dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-primary-500 dark:focus:ring-primary-500 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-primary-500"
                  placeholder="ផ្លូវ, ភូមិ, ឃុំ, ស្រុក, ក្រុង, ខេត្ត" required />
              </div>

              <!-- <div>
              <label for="vat_number" class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"> VAT number </label>
              <input type="text" id="vat_number" class="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-primary-500 dark:focus:ring-primary-500" placeholder="DE42313253" required />
            </div> -->
            </div>
          </div>
          <h2 class="dark:text-white text-xl font-semibold text-gray-900">
            Payment Method
          </h2>
          <button @click="OpenAbaPay()" type="button"
            class="dark:focus:ring-gray-800 dark:bg-white dark:border-gray-700 dark:text-gray-900 dark:hover:bg-gray-200 mb-2 mr-2 inline-flex items-center rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-center text-sm font-medium text-gray-900 hover:bg-gray-100 focus:ring-4 focus:ring-gray-100">
            <img class="mr-3 w-12 rounded" src="/images/abapay.png" alt="aba payway in tinh25 store" />
            Pay with ABA
          </button>
          <div>
            <label for="voucher" class="dark:text-white mb-2 block text-left text-sm font-medium text-gray-900">
              Enter your ABA transectin id, to claim your product
            </label>
            <div class="flex max-w-md items-center gap-4">
              <input v-model="trxId" type="text" id="voucher" :class="{
                'border-green-500 dark:border-green-500 text-green-500': isValidTransaction,
                'border-red-500 dark:border-red-500 text-red-500': isValidTransactionFailed,
                'border-gray-300 dark:border-gray-600': !(isValidTransaction || isValidTransactionFailed)
              }"
                class="text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-primary-500 dark:focus:ring-primary-500 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-primary-500"
                placeholder="Trx. ID: 173692706018179" required />
              <button @click="TransectionValidate" v-if="isValidTransaction == false" type="button"
                class="dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800 flex items-center justify-center rounded-lg bg-primary-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-800 focus:outline-none focus:ring-4 focus:ring-primary-300">
                Claim
              </button>
            </div>
          </div>
        </div>

        <div class="mt-6 w-full space-y-6 sm:mt-8 lg:mt-0 lg:max-w-xs xl:max-w-md">
          <div class="flow-root">
            <div class="dark:divide-gray-800 -my-3 divide-y divide-gray-200">
              <h1 class="text-left font-bold"></h1>
              <dl v-for="product in cartStore.cartItems" :key="product.title"
                class="flex items-center justify-between gap-4 py-3">
                <dt class="dark:text-gray-400 text-base font-normal text-gray-500">
                  <div class="text-lg font-semibold text-gray-900">
                    {{ product.title }}
                  </div>
                  <div class="text-sm text-gray-500">Options Type: {{ product.options ? product.options : 'default' }}</div>
                </dt>
                <div>
                  <dd class="dark:text-white truncate text-right text-base font-medium text-gray-900">
                    $ {{ product.price.toFixed(2) }} * {{ product.quantity }}
                  </dd>
                  <del v-if="product.discount">
                    <p class="ml-2 cursor-auto text-sm text-gray-600">
                      $ {{ (product.discount + product.price).toFixed(2) }}
                    </p>
                  </del>
                </div>
              </dl>

              <!-- <dl class="flex items-center justify-between gap-4 py-3">
                <dt class="dark:text-gray-400 text-base font-normal text-gray-500">
                  Tax
                </dt>
                <dd class="dark:text-white text-base font-medium text-gray-900">
                  $0.00 FREE
                </dd>
              </dl> -->
              <dl class="flex items-center justify-between gap-4 py-3">
                <dt class="dark:text-gray-400 text-base font-normal text-gray-500">
                  Save
                </dt>
                <dd class="dark:text-white text-base font-medium text-gray-900">
                  ${{
                    cartStore.cartItems
                      .reduce((total, product) => total + product.discount, 0)
                      .toFixed(2)
                  }}
                </dd>
              </dl>

              <dl class="flex items-center justify-between gap-4 py-3">
                <dt class="dark:text-white text-base font-bold text-gray-900">
                  Total
                </dt>
                <dd class="dark:text-white text-base font-bold text-gray-900">
                  $
                  {{
                    cartStore.cartItems
                      .reduce((total, product) => total + product.price * product.quantity, 0)
                      .toFixed(2)
                  }}
                </dd>
              </dl>
            </div>
          </div>

          <div class="space-y-3">
            <button v-if="isValidTransaction == false"
              class="dark:bg-gray-600 cursor-not-allowed dark:hover:bg-gray-700 dark:focus:ring-gray-800 flex w-full items-center justify-center rounded-lg bg-gray-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-600 focus:outline-none focus:ring-4 focus:ring-gray-300"
              disabled>
              Proceed to Checkout
            </button>
            <button v-else type="button" @click="ProceedToCheckout"
              class="dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800 flex w-full items-center justify-center rounded-lg bg-primary-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-800 focus:outline-none focus:ring-4 focus:ring-primary-300">
              Proceed to Checkout
            </button>

            <p class="dark:text-gray-400 text-sm font-normal text-gray-500">
              Please carefully verify your information before proceeding to
              checkout.
              <a href="#" title=""
                class="dark:text-primary-500 font-medium text-primary-700 underline hover:no-underline">Learn more about
                our checkout process.</a>.
            </p>
          </div>
        </div>
      </div>
    </form>
  </section>
</template>
