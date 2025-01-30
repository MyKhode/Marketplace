<script lang="ts" setup>
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const router = useRouter();
const { supabase } = useAuthStore();

onMounted(() => {
  if (supabase.auth.user()) {
    router.replace("/");
  }
});
</script>
<template>
  <LoadingIcon class="mx-auto w-16" />
</template>