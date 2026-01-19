<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { supabase } from "./lib/supabase";
import LoginPage from "./LoginPage.vue";

import KlantenPage from "./KlantenPage.vue";
import OrdersNewPage from "./OrdersNewPage.vue";
import OrdersOverview from "./OrdersOverview.vue";
import OrderDetailPage from "./OrderDetailPage.vue";
import PakbonPage from "./PakbonPage.vue";
import EtikettenPage from "./EtikettenPage.vue";
import type { Order } from "./services/db";

type Page =
  | "orders"
  | "order-nieuw"
  | "klanten"
  | "etiketten"
  | "pakbon"
  | "order-detail";

type Role = "owner" | "admin" | "user" | string;

const session = ref<any>(null);
const role = ref<Role | null>(null);
const checkingRole = ref(false);

const currentPage = ref<Page>("orders");
const menuOpen = ref(false);
const selectedOrder = ref<Order | null>(null);

const isAdminOrOwner = computed(() => role.value === "owner" || role.value === "admin");

const pageTitle = computed(() => {
  switch (currentPage.value) {
    case "orders": return "Orders overzicht";
    case "order-nieuw": return "Nieuwe order";
    case "klanten": return "Klanten";
    case "etiketten": return "Etiketten";
    case "pakbon": return "Pakbon maken";
    case "order-detail": return "Orderdetails";
    default: return "";
  }
});

function goTo(page: Page) {
  currentPage.value = page;
  menuOpen.value = false;
}

function openOrderDetail(order: Order) {
  selectedOrder.value = order;
  goTo("order-detail");
}

function handleOrderUpdated(order: Order) {
  selectedOrder.value = order;
}

function handleOrderDeleted() {
  selectedOrder.value = null;
  goTo("orders");
}

async function fetchRole() {
  if (!session.value?.user?.id) {
    role.value = null;
    return;
  }

  checkingRole.value = true;
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.value.user.id)
      .maybeSingle();

    if (error) throw error;
    role.value = (data?.role as Role) ?? null;
  } finally {
    checkingRole.value = false;
  }
}

async function logout() {
  await supabase.auth.signOut();
  menuOpen.value = false;
  selectedOrder.value = null;
  currentPage.value = "orders";
}

let authUnsub: { unsubscribe: () => void } | null = null;

onMounted(async () => {
  const { data } = await supabase.auth.getSession();
  session.value = data.session;

  if (session.value) await fetchRole();

  const { data: sub } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
    session.value = newSession;
    role.value = null;

    // reset UI bij in/uitloggen
    menuOpen.value = false;
    selectedOrder.value = null;
    currentPage.value = "orders";

    if (session.value) await fetchRole();
  });

  authUnsub = sub?.subscription ?? null;
});

onUnmounted(() => {
  authUnsub?.unsubscribe?.();
});
</script>

<template>
  <LoginPage v-if="!session" />

  <div v-else class="gate">
    <div v-if="checkingRole" class="gate-status">Role check...</div>

    <div v-else-if="!isAdminOrOwner" class="gate-status">
      <p>Geen toegang (alleen admin/owner).</p>
      <button class="btn" @click="logout">Uitloggen</button>
    </div>

    <div v-else class="app-shell">
      <!-- TOPBAR -->
      <header class="topbar">
        <div class="topbar-inner">
          <button class="hamburger" @click="menuOpen = !menuOpen" aria-label="Menu">
            <span></span><span></span><span></span>
          </button>

          <div class="brand">
            <div class="logo">Orderprogramma</div>
            <div class="subtitle">{{ pageTitle }}</div>
          </div>

          <div class="top-actions">
            <button class="btn ghost" @click="logout">Uitloggen</button>
          </div>
        </div>
      </header>

      <!-- Overlay -->
      <div v-if="menuOpen" class="overlay" @click="menuOpen = false"></div>

      <!-- SIDE MENU -->
      <nav class="side-menu" :class="{ open: menuOpen }" aria-label="Navigatie">
        <div class="menu-head">
          <div class="menu-title">Menu</div>
          <button class="icon-btn" @click="menuOpen = false" aria-label="Sluiten">✕</button>
        </div>

        <button class="menu-item" :class="{ active: currentPage === 'orders' }" @click="goTo('orders')">
          Orders
        </button>
        <button class="menu-item" :class="{ active: currentPage === 'order-nieuw' }" @click="goTo('order-nieuw')">
          Nieuwe order
        </button>
        <button class="menu-item" :class="{ active: currentPage === 'klanten' }" @click="goTo('klanten')">
          Klanten
        </button>
        <button class="menu-item" :class="{ active: currentPage === 'etiketten' }" @click="goTo('etiketten')">
          Etiketten
        </button>
        <button class="menu-item" :class="{ active: currentPage === 'pakbon' }" @click="goTo('pakbon')">
          Pakbon
        </button>

        <div class="menu-sep"></div>

        <button class="menu-item danger" @click="logout">Uitloggen</button>
      </nav>

      <!-- CONTENT -->
      <main class="main-content">
        <OrdersOverview
          v-if="currentPage === 'orders'"
          @open-order="openOrderDetail"
        />

        <OrdersNewPage v-else-if="currentPage === 'order-nieuw'" />
        <KlantenPage v-else-if="currentPage === 'klanten'" />
        <EtikettenPage v-else-if="currentPage === 'etiketten'" />
        <PakbonPage v-else-if="currentPage === 'pakbon'" />

        <OrderDetailPage
          v-else-if="currentPage === 'order-detail'"
          :order="selectedOrder"
          @back="goTo('orders')"
          @updated="handleOrderUpdated"
          @deleted="handleOrderDeleted"
        />
      </main>
    </div>
  </div>
</template>

<style scoped>
:global(html, body) {
  margin: 0;
  padding: 0;
  background: #020617;
}

.gate {
  min-height: 100vh;
}

.gate-status {
  min-height: 100vh;
  display: grid;
  place-items: center;
  color: #e5e7eb;
  gap: 0.75rem;
  text-align: center;
}

.app-shell {
  min-height: 100vh;
  background: radial-gradient(900px 500px at 30% 0%, rgba(37, 99, 235, 0.18), transparent 60%),
              radial-gradient(900px 500px at 70% 10%, rgba(14, 165, 233, 0.10), transparent 60%),
              #020617;
  color: #f9fafb;
}

/* TOPBAR */
.topbar {
  position: sticky;
  top: 0;
  z-index: 30;
  background: rgba(2, 6, 23, 0.78);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(15, 23, 42, 0.9);
}

.topbar-inner {
  max-width: 100vw;
  margin: 0 auto;
  padding: 0.75rem 1rem;
  display: grid;
  grid-template-columns: 40px 1fr auto;
  align-items: center;
  gap: 0.75rem;
}

.brand {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
}

.logo {
  font-weight: 700;
  letter-spacing: 0.02em;
  font-size: 0.98rem;
}

.subtitle {
  font-size: 0.85rem;
  color: #9ca3af;
  margin-top: 0.15rem;
}

.top-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Hamburger */
.hamburger {
  width: 36px;
  height: 36px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.25);
  background: rgba(15, 23, 42, 0.35);
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

/* Overlay */
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(2, 6, 23, 0.55);
  z-index: 25;
}

/* Side menu */
.side-menu {
  position: fixed;
  top: 0;
  left: -280px;
  width: 250px;
  height: 100vh;
  z-index: 40;
  background: rgba(2, 6, 23, 0.92);
  backdrop-filter: blur(12px);
  border-right: 1px solid rgba(148, 163, 184, 0.16);
  padding: 0.9rem;
  box-shadow: 12px 0 30px rgba(0, 0, 0, 0.45);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  transition: left 0.18s ease-out;
}

.side-menu.open {
  left: 0;
}

.menu-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.25rem;
}

.menu-title {
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #9ca3af;
}

.icon-btn {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: rgba(15, 23, 42, 0.35);
  color: #e5e7eb;
  cursor: pointer;
}

.menu-item {
  text-align: left;
  font-size: 0.95rem;
  padding: 0.55rem 0.8rem;
  border-radius: 0.7rem;
  border: 1px solid transparent;
  background: transparent;
  color: #e5e7eb;
  cursor: pointer;
}

.menu-item:hover {
  background: rgba(17, 24, 39, 0.55);
}

.menu-item.active {
  background: rgba(37, 99, 235, 0.22);
  border-color: rgba(37, 99, 235, 0.55);
}

.menu-item.danger {
  color: #fecaca;
}

.menu-sep {
  height: 1px;
  background: rgba(148, 163, 184, 0.14);
  margin: 0.5rem 0;
}

/* Content */
.main-content {
  max-width: 100vw;
  margin: 0 auto;
  padding: 1.25rem 1rem 3rem;
}

/* Buttons */
.btn {
  border: 0;
  border-radius: 999px;
  padding: 0.5rem 0.9rem;
  cursor: pointer;
  font-weight: 600;
  background: #2563eb;
  color: #fff;
}

.btn.ghost {
  background: rgba(15, 23, 42, 0.35);
  border: 1px solid rgba(148, 163, 184, 0.22);
}

.btn:hover {
  filter: brightness(1.05);
}
</style>
