<template>
  <div class="page">
    <h1>Pakbon maken</h1>

    <!-- ORDER KIEZEN -->
    <section class="card">
      <h2>Kies een order</h2>

      <div v-if="loading">Laden...</div>
      <div v-else-if="orders.length === 0">Nog geen orders.</div>
      <div v-else class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Ref</th>
              <th>Klant</th>
              <th>Product</th>
              <th>Formaat</th>
              <th>Leverdatum</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="order in orders"
              :key="order.order_id"
              :class="{ selected: selectedOrder && selectedOrder.order_id === order.order_id }"
              @click="selectOrder(order)"
            >
              <td>{{ order.order_id }}</td>
              <td>{{ order.interne_referentie }}</td>
              <td>{{ klantNaam(order.klant_id) }}</td>
              <td>{{ order.product_naam }}</td>
              <td>{{ order.formaat }}</td>
              <td>{{ formatDate(order.geplande_lever_datum) }}</td>
              <td>{{ order.status }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p v-if="error" class="error">{{ error }}</p>
    </section>

    <!-- PAKBON + PALLETBON PREVIEW -->
    <section class="card">
      <h2>Pakbon</h2>

      <div v-if="selectedOrder">
        <PakbonPreview
          :order="selectedOrder"
          :klant="selectedKlant"
        />

        <div class="actions no-print">
          <button class="primary" @click="printPakbon">
            Print pakbon & palletbon
          </button>
        </div>
      </div>
      <div v-else>
        <p>Kies hierboven eerst een order om de pakbon te zien.</p>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import PakbonPreview from "./PakbonPreview.vue";
import type { Order } from "./OrdersOverview.vue";

const API_BASE = "http://localhost:3000";
const STORAGE_ORDERS_KEY = "orderapp_orders";
const STORAGE_KLANTEN_KEY = "orderapp_klanten";

export interface Klant {
  klant_id: number;
  naam: string;
  btw_nummer?: string;
  kvk_nummer?: string;
  straat?: string;
  huisnummer?: string;
  postcode?: string;
  plaats?: string;
  land?: string;
  contactpersoon?: string;
  email?: string;
  telefoon?: string;
  notities?: string;
}

const orders = ref<Order[]>(loadOrdersFromStorage());
const klanten = ref<Klant[]>(loadKlantenFromStorage());
const loading = ref(false);
const error = ref<string | null>(null);

const selectedOrder = ref<Order | null>(null);

function formatDate(value: string) {
  if (!value) return "-";
  // komt in principe al als "YYYY-MM-DD" uit backend
  return value.split("-").reverse().join("-"); // 2026-01-23 -> 23-01-2026
}

function klantNaam(id: number) {
  const k = klanten.value.find((klant) => klant.klant_id === id);
  return k ? k.naam : `#${id}`;
}

const selectedKlant = computed<Klant | null>(() => {
  if (!selectedOrder.value) return null;
  return klanten.value.find(
    (k) => k.klant_id === selectedOrder.value!.klant_id
  ) ?? null;
});

function selectOrder(order: Order) {
  selectedOrder.value = order;
}

function printPakbon() {
  window.print();
}

/* ===== DATA LADEN (backend + fallback op localStorage) ===== */

async function loadData() {
  loading.value = true;
  error.value = null;

  try {
    const [ordersRes, klantenRes] = await Promise.all([
      fetch(`${API_BASE}/orders`),
      fetch(`${API_BASE}/klanten`),
    ]);

    if (!ordersRes.ok) throw new Error("Kon orders niet laden");
    if (!klantenRes.ok) throw new Error("Kon klanten niet laden");

    const ordersData: Order[] = await ordersRes.json();
    const klantenData: Klant[] = await klantenRes.json();

    orders.value = ordersData;
    klanten.value = klantenData;

    saveOrdersToStorage(orders.value);
    saveKlantenToStorage(klanten.value);
  } catch (e: any) {
    console.warn("Backend niet bereikbaar, gebruik localStorage-data", e);
    error.value = null; // stil houden, we hebben al data lokaal
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadData();
});

/* ===== localStorage helpers ===== */

function loadOrdersFromStorage(): Order[] {
  try {
    const raw = localStorage.getItem(STORAGE_ORDERS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Order[];
  } catch {
    return [];
  }
}

function saveOrdersToStorage(list: Order[]) {
  try {
    localStorage.setItem(STORAGE_ORDERS_KEY, JSON.stringify(list));
  } catch (err) {
    console.error("Kon orders niet in localStorage opslaan", err);
  }
}

function loadKlantenFromStorage(): Klant[] {
  try {
    const raw = localStorage.getItem(STORAGE_KLANTEN_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Klant[];
  } catch {
    return [];
  }
}

function saveKlantenToStorage(list: Klant[]) {
  try {
    localStorage.setItem(STORAGE_KLANTEN_KEY, JSON.stringify(list));
  } catch (err) {
    console.error("Kon klanten niet in localStorage opslaan", err);
  }
}
</script>

<style scoped>
.page {
  max-width: 1100px;
  margin: 2rem auto 3rem;
  padding: 0 1rem;
}

h1 {
  font-size: 1.8rem;
  margin-bottom: 1.5rem;
  color: #f9fafb;
}

.card {
  background: #ffffff;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.06);
  border: 1px solid #e5e7eb;
  color: #111827;
}

h2 {
  font-size: 1.2rem;
  margin-bottom: 1rem;
}

.table-wrapper {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

th,
td {
  padding: 0.5rem 0.6rem;
  border-bottom: 1px solid #e5e7eb;
  text-align: left;
}

th {
  background: #f9fafb;
  font-weight: 600;
}

tr {
  cursor: pointer;
}

tr:hover {
  background: #f3f4f6;
}

tr.selected {
  background: #e0f2fe;
}

.actions {
  margin-top: 1rem;
}

button.primary {
  background: #2563eb;
  color: white;
  border-radius: 999px;
  border: none;
  padding: 0.5rem 1.1rem;
  font-size: 0.9rem;
  cursor: pointer;
}

button.primary:hover {
  background: #1d4ed8;
}

.error {
  margin-top: 0.5rem;
  color: #b91c1c;
  font-size: 0.85rem;
}

/* print: geen blauwe knoppen tonen */
@media print {
  .no-print {
    display: none !important;
  }
}
</style>
