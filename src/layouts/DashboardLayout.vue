<script lang="ts" setup>
import { breakpointsTailwind } from "@vueuse/core";
import { useRoute } from "vue-router";
import GridContent from "@/components/GridContent.vue";
import ProfileView from "@/views/ProfileView.vue";

/* after navigation on small screens, close the nav drawer */
const breakpoints = useBreakpoints(breakpointsTailwind);
const lgAndLarger = breakpoints.greater("lg");
const open = ref(false);
const route = useRoute();
watch(route, () => {
  if (!lgAndLarger.value) open.value = false;
});

onMounted(() => {
  if (lgAndLarger.value) open.value = true;
});
</script>

<template>
  <div>
    <Navbar/>
    <GridContent v-if="route.name === 'home'" />
    <!-- <ProfileView v-if="route.name === 'profile'" /> -->
    <!-- <Gallery v-if="route.name === 'product'" /> -->
    <AppFooter />
  </div>

  <!-- <div class="flex h-full w-full max-w-full transition-colors">
    <NavDrawer v-model="open" />
    <div
      class="flex h-full max-h-full max-w-full flex-grow flex-col bg-zinc-100 text-zinc-900 transition-all dark:bg-zinc-900 dark:text-zinc-100"
      :class="{ 'lg:pl-64': open }"
    >
      <AppTopBar v-model="open" />
      <main class="flex-grow overflow-auto px-4 py-2">
        <router-view />
      </main>
      <AppFooter />
    </div>
  </div> -->
</template>
