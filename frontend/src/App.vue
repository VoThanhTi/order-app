<template>
  <LoginPage v-if="!session" />

  <div v-else>
    <div v-if="checkingRole">Role check...</div>

    <div v-else-if="!isAdminOrOwner">
      <p>Geen toegang (alleen admin/owner).</p>
      <button @click="logout">Uitloggen</button>
    </div>

    <div v-else>
      <!-- JOUW APP CONTENT -->
      <nav>
        <button @click="page = 'orders'">Orders</button>
        <button @click="page = 'new'">Nieuwe order</button>
        <button @click="page = 'klanten'">Klanten</button>
        <button @click="page = 'etiketten'">Etiketten</button>
        <button @click="page = 'pakbon'">Pakbon</button>
        <button @click="logout">Uitloggen</button>
      </nav>

      <OrdersOverview v-if="page === 'orders'" />
      <OrdersNewPage v-else-if="page === 'new'" />
      <KlantenPage v-else-if="page === 'klanten'" />
      <EtikettenPage v-else-if="page === 'etiketten'" />
      <PakbonPage v-else-if="page === 'pakbon'" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { supabase } from "./lib/supabase";
import LoginPage from "./LoginPage.vue";

import OrdersOverview from "./OrdersOverview.vue";
import OrdersNewPage from "./OrdersNewPage.vue";
import KlantenPage from "./KlantenPage.vue";
import EtikettenPage from "./EtikettenPage.vue";
import PakbonPage from "./PakbonPage.vue";

type Role = "owner" | "admin" | "user" | string;

const session = ref<any>(null);
const role = ref<Role | null>(null);
const checkingRole = ref(false);

const page = ref<"orders" | "new" | "klanten" | "etiketten" | "pakbon">("orders");

const isAdminOrOwner = (() => {
  const r = role.value;
  return r === "owner" || r === "admin";
});

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
      .single();

    if (error) throw error;
    role.value = data?.role ?? null;
  } finally {
    checkingRole.value = false;
  }
}

async function logout() {
  await supabase.auth.signOut();
}

onMounted(async () => {
  const { data } = await supabase.auth.getSession();
  session.value = data.session;

  if (session.value) await fetchRole();

  supabase.auth.onAuthStateChange(async (_event, newSession) => {
    session.value = newSession;
    role.value = null;
    if (session.value) await fetchRole();
  });
});
</script>


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
