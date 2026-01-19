<script setup lang="ts">
import { ref, computed } from "vue";
import KlantenPage from "./KlantenPage.vue";
import OrdersNewPage from "./OrdersNewPage.vue";
import OrdersOverview, { type Order } from "./OrdersOverview.vue";
import OrderDetailPage from "./OrderDetailPage.vue";
import PakbonPage from "./PakbonPage.vue";
import EtikettenPage from "./EtikettenPage.vue";

type Page = "klanten" | "order-nieuw" | "orders" | "pakbon" | "order-detail"  | "etiketten";

const currentPage = ref<Page>("klanten");
const menuOpen = ref(false);
const selectedOrder = ref<Order | null>(null);

function goTo(page: Page) {
  currentPage.value = page;
  menuOpen.value = false;
}

function openOrderDetail(order: Order) {
  selectedOrder.value = order;
  currentPage.value = "order-detail";
  menuOpen.value = false;
}

const pageTitle = computed(() => {
  switch (currentPage.value) {
    case "klanten":
      return "Klanten";
    case "order-nieuw":
      return "Nieuwe order";
    case "orders":
      return "Orders overzicht";
    case "pakbon":
      return "Pakbon maken";
    case "order-detail":
      return "Orderdetails";
    case "etiketten":
      return "Etiketten";
    default:
      return "";
  }
});


function handleOrderUpdated(order: Order) {
  selectedOrder.value = order;
}

function handleOrderDeleted() {
  selectedOrder.value = null;
  currentPage.value = "orders";
}

</script>

<template>
  <div class="app-shell">
    <!-- Topbar -->
    <header class="topbar">
      <div class="topbar-inner">
        <!-- links: hamburger -->
        <button class="hamburger" @click="menuOpen = !menuOpen">
          <span></span>
          <span></span>
          <span></span>
        </button>

        <!-- midden: logo / appnaam -->
        <div class="logo">
          Orderprogramma
        </div>

        <!-- rechts: huidige pagina -->
        <div class="current-page">
          {{ pageTitle }}
        </div>
      </div>
    </header>

    <!-- Overlay achter het menu -->
    <div
      v-if="menuOpen"
      class="overlay"
      @click="menuOpen = false"
    ></div>

    <!-- Zijmenu (detail staat NIET in menu) -->
    <nav class="side-menu" :class="{ open: menuOpen }">
      <h3>Menu</h3>
      <button
        class="menu-item"
        :class="{ active: currentPage === 'klanten' }"
        @click="goTo('klanten')"
      >
        Klanten
      </button>
      <button
        class="menu-item"
        :class="{ active: currentPage === 'order-nieuw' }"
        @click="goTo('order-nieuw')"
      >
        Nieuwe order
      </button>
      <button
        class="menu-item"
        :class="{ active: currentPage === 'orders' }"
        @click="goTo('orders')"
      >
        Orders overzicht
      </button>
      <button
        class="menu-item"
        :class="{ active: currentPage === 'pakbon' }"
        @click="goTo('pakbon')"
      >
        Pakbon
      </button>
      <button
      class="menu-item"
      :class="{ active: currentPage === 'etiketten' }"
      @click="goTo('etiketten')"
      >
        Etiketten
      </button>
    </nav>

    <!-- Inhoud -->
        <main class="main-content">
      <KlantenPage v-if="currentPage === 'klanten'" />
      <OrdersNewPage v-else-if="currentPage === 'order-nieuw'" />
      <OrdersOverview
        v-else-if="currentPage === 'orders'"
        @open-order="openOrderDetail"
      />
      <PakbonPage v-else-if="currentPage === 'pakbon'" />
      <EtikettenPage v-else-if="currentPage === 'etiketten'" />
      <OrderDetailPage
        v-else-if="currentPage === 'order-detail'"
        :order="selectedOrder"
        @back="goTo('orders')"
        @updated="handleOrderUpdated"
        @deleted="handleOrderDeleted"
      />
    </main>
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  background: #020617;
  color: #f9fafb;
  border-radius: 4%;
}

/* TOPBAR */

.topbar {
  background: #020617;
  border-bottom: 1px solid #0f172a;
}

.topbar-inner {
  max-width: 90vw;          /* zelfde “breedte” als .page */
  margin: 0 auto;
  padding: 0.6rem 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.logo {
  font-weight: 600;
  letter-spacing: 0.03em;
  font-size: 0.95rem;
}

.current-page {
  font-size: 0.9rem;
  opacity: 0.8;
}

/* Hamburger knop */
.hamburger {
  width: 32px;
  height: 32px;
  border-radius: 999px;
  border: 1px solid #374151;
  background: transparent;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
  padding: 0;
  cursor: pointer;
}

.hamburger span {
  display: block;
  height: 2px;
  width: 16px;
  margin: 0 auto;
  background: #e5e7eb;
  border-radius: 999px;
}

/* Overlay achter menu */
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
  z-index: 15;
}

/* Zijmenu */
.side-menu {
  position: fixed;
  top: 0;
  left: -260px;
  width: 220px;
  height: 100vh;
  background: #020617;
  border-right: 1px solid #111827;
  padding: 1rem;
  box-shadow: 10px 0 25px rgba(0, 0, 0, 0.4);
  z-index: 20;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  transition: left 0.18s ease-out;
}

.side-menu.open {
  left: 0;
}

.side-menu h3 {
  margin-top: 0;
  margin-bottom: 0.75rem;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #9ca3af;
}

.menu-item {
  text-align: left;
  font-size: 0.9rem;
  padding: 0.45rem 0.8rem;
  border-radius: 0.5rem;
  border: 1px solid transparent;
  background: #020617;
  color: #e5e7eb;
  cursor: pointer;
}

.menu-item:hover {
  background: #111827;
}

.menu-item.active {
  background: #2563eb;
  border-color: #2563eb;
}

/* Main content */
.main-content {
  padding-top: 0.5rem;
}
</style>
