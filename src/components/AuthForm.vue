<script lang="ts" setup>
import { useAuthStore } from "@/stores/auth";
import { Ref } from "vue";
import { UserCredentials } from "@supabase/supabase-js";

const props = defineProps<{
  signUp: boolean;
  title: string;
  subtitle: string;
  emailPlaceholder: string;
  passwordPlaceholder: string;
}>();

const credentials: Ref<UserCredentials> = ref({
  email: "",
  password: "",
});

const router = useRouter();

const emailLoading = ref(false);
async function emailAuth() {
  emailLoading.value = true;
  const { supabase } = useAuthStore();
  const { user, error } = props.signUp
    ? await supabase.auth.signUp(credentials.value)
    : await supabase.auth.signIn(credentials.value);
  if (user) router.push("/");
  else if (error) {
    alert(error.message);
    emailLoading.value = false;
  }
}

const gitHubLoading = ref(false);
async function gitHubAuth() {
  gitHubLoading.value = true;
  const { supabase } = useAuthStore();
  const { user, error } = await supabase.auth.signIn(
    { provider: "github" },
    {
      redirectTo: `${window.location.origin}/callback`,
    }
  );
  if (user) router.push("/");
  else if (error) {
    alert(error.message);
    gitHubLoading.value = false;
  }
}

const googleLoading = ref(false);
async function googleAuth() {
  googleLoading.value = true;
  const { supabase } = useAuthStore();
  const { user, error } = await supabase.auth.signIn(
    { provider: "google" },
    {
      redirectTo: `${window.location.origin}/callback`,
    }
  );
  if (user) router.push("/");
  else if (error) {
    alert(error.message);
    googleLoading.value = false;
  }
}

const twitterLoading = ref(false);
async function twitterAuth() {
  twitterLoading.value = true;
  const { supabase } = useAuthStore();
  const { user, error } = await supabase.auth.signIn(
    { provider: "twitter" },
    {
      redirectTo: `${window.location.origin}/callback`,
    }
  );
  if (user) router.push("/");
  else if (error) {
    alert(error.message);
    twitterLoading.value = false;
  }
}

const facebookLoading = ref(false);
async function facebookAuth() {
  facebookLoading.value = true;
  const { supabase } = useAuthStore();
  const { user, error } = await supabase.auth.signIn(
    { provider: "facebook" },
    {
      redirectTo: `${window.location.origin}/callback`,
    }
  );
  if (user) router.push("/");
  else if (error) {
    alert(error.message);
    facebookLoading.value = false;
  }
}

const loading = computed(
  () =>
    gitHubLoading.value ||
    emailLoading.value ||
    googleLoading.value ||
    twitterLoading.value ||
    facebookLoading.value
);
</script>
<template>
  <div class="flex flex-col items-center">
    <h2 class="mb- text-2xl font-bold">
      {{ title }}
    </h2>
    <p class="mb-4 text-sm text-slate-500">
      {{ subtitle }}
    </p>
    <!-- <form class="flex w-full flex-col items-start" @submit.prevent="emailAuth">
      <VLabel for="email">Email</VLabel>
      <VInput required :disabled="loading" class="w-full" name="email" id="email" type="email"
        :placeholder="emailPlaceholder" v-model="(credentials.email as string)" />
      <VLabel for="password">Password</VLabel>
      <VPasswordInput :disabled="loading" class="mb-4 w-full" name="password" id="password"
        :placeholder="passwordPlaceholder" v-model="(credentials.password as string)" />

      <router-link v-if="!signUp" to="/forgotpassword" class="mb-4 text-sm font-bold">Forgot your
        password?</router-link>

      <VButton :loading="emailLoading" :disabled="loading" type="submit" class="bg-teal-700">{{ signUp ? "Sign Up" :
        "Sign In" }}</VButton>
    </form> -->
    <button type="button" :loading="googleLoading" :disabled="loading" @click="googleAuth"
      class="text-white bg-[#4285F4] hover:bg-[#4285F4]/90 focus:ring-4 focus:outline-none focus:ring-[#4285F4]/50 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center dark:focus:ring-[#4285F4]/55 me-2 mb-2">
      <svg class="w-4 h-4 me-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor"
        viewBox="0 0 18 19">
        <path fill-rule="evenodd"
          d="M8.842 18.083a8.8 8.8 0 0 1-8.65-8.948 8.841 8.841 0 0 1 8.8-8.652h.153a8.464 8.464 0 0 1 5.7 2.257l-2.193 2.038A5.27 5.27 0 0 0 9.09 3.4a5.882 5.882 0 0 0-.2 11.76h.124a5.091 5.091 0 0 0 5.248-4.057L14.3 11H9V8h8.34c.066.543.095 1.09.088 1.636-.086 5.053-3.463 8.449-8.4 8.449l-.186-.002Z"
          clip-rule="evenodd" />
      </svg>
      Sign in with Google
    </button>
    <button type="button" :loading="gitHubLoading" :disabled="loading" @click="gitHubAuth"
      class="text-white bg-[#24292F] hover:bg-[#24292F]/90 focus:ring-4 focus:outline-none focus:ring-[#24292F]/50 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center dark:focus:ring-gray-500 dark:hover:bg-[#050708]/30 me-2 mb-2">
      <svg class="w-4 h-4 me-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor"
        viewBox="0 0 20 20">
        <path fill-rule="evenodd"
          d="M10 .333A9.911 9.911 0 0 0 6.866 19.65c.5.092.678-.215.678-.477 0-.237-.01-1.017-.014-1.845-2.757.6-3.338-1.169-3.338-1.169a2.627 2.627 0 0 0-1.1-1.451c-.9-.615.07-.6.07-.6a2.084 2.084 0 0 1 1.518 1.021 2.11 2.11 0 0 0 2.884.823c.044-.503.268-.973.63-1.325-2.2-.25-4.516-1.1-4.516-4.9A3.832 3.832 0 0 1 4.7 7.068a3.56 3.56 0 0 1 .095-2.623s.832-.266 2.726 1.016a9.409 9.409 0 0 1 4.962 0c1.89-1.282 2.717-1.016 2.717-1.016.366.83.402 1.768.1 2.623a3.827 3.827 0 0 1 1.02 2.659c0 3.807-2.319 4.644-4.525 4.889a2.366 2.366 0 0 1 .673 1.834c0 1.326-.012 2.394-.012 2.72 0 .263.18.572.681.475A9.911 9.911 0 0 0 10 .333Z"
          clip-rule="evenodd" />
      </svg>
      Sign in with Github
    </button>
    <!-- <button type="button"
      class="text-white bg-[#3b5998] hover:bg-[#3b5998]/90 focus:ring-4 focus:outline-none focus:ring-[#3b5998]/50 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center dark:focus:ring-[#3b5998]/55 me-2 mb-2">
      <svg class="w-4 h-4 me-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor"
        viewBox="0 0 8 19">
        <path fill-rule="evenodd"
          d="M6.135 3H8V0H6.135a4.147 4.147 0 0 0-4.142 4.142V6H0v3h2v9.938h3V9h2.021l.592-3H5V3.591A.6.6 0 0 1 5.592 3h.543Z"
          clip-rule="evenodd" />
      </svg>
      Sign in with Facebook
    </button> -->
    <!-- <div class="flex space-x-2">
      <VButton :loading="gitHubLoading" :disabled="loading" type="button"
        class="flex items-center justify-center bg-black" @click="gitHubAuth">
        <i-mdi-github class="h-5 w-5" />
      </VButton>
      <VButton :loading="googleLoading" :disabled="loading" type="button"
        class="flex items-center justify-center bg-[#EA4335]" @click="googleAuth">
        <i-mdi-google class="h-5 w-5" />
      </VButton>
      <VButton :loading="twitterLoading" :disabled="loading" type="button"
        class="flex items-center justify-center bg-[#1DA1F2]" @click="twitterAuth">
        <i-mdi-twitter class="h-5 w-5" />
      </VButton>
      <VButton :loading="facebookLoading" :disabled="loading" type="button"
        class="flex items-center justify-center bg-[#425F9C]" @click="facebookAuth">
        <i-mdi-facebook class="h-5 w-5" />
      </VButton>
    </div> -->

    <slot name="actions" />
  </div>
</template>
