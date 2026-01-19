<template>
  <div class="page">
    <h1>Orders & productoverzicht</h1>

    <section class="card">
      <h2>Overzicht</h2>

      <div v-if="loading">Laden...</div>
      <div v-else-if="orders.length === 0">Nog geen orders.</div>
      <div v-else class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Ref</th>
              <th>Klant</th>
              <th>Klant ordernr</th>
              <th>Artikelnr klant</th>
              <th>Productnaam</th>
              <th>Formaat</th>
              <th>Orderdatum</th>
              <th>Leverdatum</th>
              <th>Leverstatus</th>
              <th>Dozen geproduceerd</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
              <tr
                v-for="order in orders"
                :key="order.order_id"
                :class="getRowClass(order)"
                @click="selectOrder(order)"
              >

              <td>{{ order.order_id }}</td>
              <td>{{ order.interne_referentie }}</td>
              <td>{{ klantNaam(order.klant_id) }}</td>
              <td>{{ order.klant_order_nummer || "-" }}</td>
              <td>{{ order.klant_artikel_nummer || "-" }}</td>
              <td>{{ order.product_naam }}</td>
              <td>{{ order.formaat }}</td>
              <td>{{ formatDate(order.order_datum) }}</td>
              <td>{{ formatDate(order.geplande_lever_datum) }}</td>

              <!-- leverstatus badge -->
              <td>
                <span
                  :class="['status-pill', getDeliveryClass(order)]"
                >
                  {{ getDeliveryLabel(order) }}
                </span>
              </td>

              <!-- dozen geproduceerd: inline +/- -->
              <td class="produced-cell" @click.stop>
                <button
                  class="circle-btn"
                  type="button"
                  @click.stop="changeProducedBoxes(order, -1)"
                >
                  –
                </button>
                <span class="produced-text">
                  {{ getProducedBoxesText(order) }}
                </span>
                <button
                  class="circle-btn"
                  type="button"
                  @click.stop="changeProducedBoxes(order, +1)"
                >
                  +
                </button>
              </td>

              <!-- status: inline select -->
              <td class="status-cell" @click.stop>
                <select
                  class="status-select"
                  :value="order.status"
                  @change="onStatusSelect(order, $event)"
                >
                  <option value="OPEN">OPEN</option>
                  <option value="IN_PRODUCTIE">IN PRODUCTIE</option>
                  <option value="KLAAR">KLAAR</option>
                  <option value="GEANNULEERD">GEANNULEERD</option>
                </select>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p v-if="error" class="error">{{ error }}</p>
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";

const API_BASE = "http://localhost:3000";
const STORAGE_ORDERS_KEY = "orderapp_orders";

export type OrderStatus = "OPEN" | "IN_PRODUCTIE" | "KLAAR" | "GEANNULEERD";

export interface Order {
  order_id: number;
  interne_referentie: string;
  klant_order_nummer: string;
  klant_artikel_nummer: string;
  klant_id: number;
  order_datum: string;
  geplande_lever_datum: string;
  product_naam: string;
  formaat: string;
  status: OrderStatus;

  // dozen / voortgang
  stuks_per_doos?: number;
  totaal_aantal_stuks?: number;
  geproduceerde_dozen?: number;

  // extra velden (voor detailpagina)
  totaal_aantal_meters?: number;
  materiaal?: string;
  dikte_micron?: number;
  bedrukking?: string;
  beugel_maat?: string;
  beugel_vorm?: string;
  perforatie_type?: string;
  pallet_type?: string;
  totaal_per_pallet?: number;
  rollen_gewicht_gram?: number;
  rows_per_rol?: number;
  etiket_format?: string;
  rol_lengte?: number;
  notities?: string;
}

interface Klant {
  klant_id: number;
  naam: string;
}

const emit = defineEmits<{
  (e: "open-order", order: Order): void;
}>();

const orders = ref<Order[]>(loadOrdersFromStorage());
const klanten = ref<Klant[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

/* ===== UTIL ===== */

function formatDate(value: string) {
  if (!value) return "-";
  // later kun je dit netjes naar NL-formaat omzetten
  return value;
}

function klantNaam(id: number) {
  const k = klanten.value.find((klant) => klant.klant_id === id);
  return k ? k.naam : `#${id}`;
}

function selectOrder(order: Order) {
  emit("open-order", order);
}

/* ===== LEVERSTATUS (kleur op basis van vandaag) ===== */

function stripTime(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

// werkdagen (ma–vr) van vandaag t/m leverdatum
function workingDaysUntil(delivery: Date): number {
  const today = stripTime(new Date());
  const end = stripTime(delivery);

  if (end < today) return -1; // te laat

  let days = 0;
  const d = new Date(today);

  while (d <= end) {
    const day = d.getDay(); // 0 = zo, 6 = za
    if (day !== 0 && day !== 6) {
      days++;
    }
    d.setDate(d.getDate() + 1);
  }

  return days;
}

function getDeliveryClass(order: Order): string {
  // speciale kleuren voor klaar / geannuleerd
  if (order.status === "KLAAR") return "status-done";
  if (order.status === "GEANNULEERD") return "status-cancelled";

  const delivery = new Date(order.geplande_lever_datum);
  if (isNaN(delivery.getTime())) return "status-neutral";

  const today = stripTime(new Date());
  const end = stripTime(delivery);

  if (end < today) {
    return "status-red";
  }

  const workdays = workingDaysUntil(delivery);

  if (workdays >= 5) return "status-green";
  if (workdays >= 3) return "status-yellow";
  return "status-orange"; // 1–2 werkdagen
}

function getDeliveryLabel(order: Order): string {
  if (order.status === "KLAAR") return "Klaar";
  if (order.status === "GEANNULEERD") return "Geannuleerd";

  const delivery = new Date(order.geplande_lever_datum);
  if (isNaN(delivery.getTime())) return "Geen datum";

  const today = stripTime(new Date());
  const end = stripTime(delivery);

  if (end < today) {
    return "Te laat";
  }

  const workdays = workingDaysUntil(delivery);

  if (workdays === 1) return "1 werkdag";
  if (workdays === 2) return "2 werkdagen";
  if (workdays === 3) return "3 werkdagen";
  if (workdays === 4) return "4 werkdagen";
  if (workdays >= 5) return `${workdays} werkdagen`;

  return "Vandaag";
}

/* ===== DOZEN GEPRODUCEERD ===== */

function totalBoxes(order: Order): number | null {
  if (!order.stuks_per_doos || !order.totaal_aantal_stuks) return null;
  return Math.ceil(order.totaal_aantal_stuks / order.stuks_per_doos);
}

function getProducedBoxesText(order: Order): string {
  const total = totalBoxes(order);
  const produced = order.geproduceerde_dozen ?? 0;

  if (total == null) {
    return produced.toString();
  }

  return `${produced} / ${total}`;
}

async function changeProducedBoxes(order: Order, delta: number) {
  const index = orders.value.findIndex((o) => o.order_id === order.order_id);
  if (index === -1) return;

  // expliciet checken → daarna is current een echte Order
  const current = orders.value[index];
  if (!current) return;

  const produced = current.geproduceerde_dozen ?? 0;
  const total = totalBoxes(current);

  let newValue = produced + delta;
  if (newValue < 0) newValue = 0;
  if (total != null && newValue > total) newValue = total;

  const updated: Order = {
    ...(current as Order),      // cast zodat spread niet “partial” wordt
    geproduceerde_dozen: newValue,
  };

  // optimistische update + localStorage
  orders.value.splice(index, 1, updated);
  saveOrdersToStorage(orders.value);

  try {
    const res = await fetch(`${API_BASE}/orders/${order.order_id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ geproduceerde_dozen: newValue }),
    });
    if (!res.ok) {
      console.warn("Backend update failed voor geproduceerde_dozen");
    }
  } catch (e) {
    console.warn("Backend niet bereikbaar bij update geproduceerde_dozen", e);
  }
}

async function changeStatus(order: Order, newStatus: OrderStatus) {
  const index = orders.value.findIndex((o) => o.order_id === order.order_id);
  if (index === -1) return;

  const current = orders.value[index];
  if (!current) return; // zelfde narrowing

  if (current.status === newStatus) return;

  const updated: Order = {
    ...(current as Order),
    status: newStatus,
  };

  orders.value.splice(index, 1, updated);
  saveOrdersToStorage(orders.value);

  try {
    const res = await fetch(`${API_BASE}/orders/${order.order_id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (!res.ok) {
      console.warn("Backend update failed voor status");
    }
  } catch (e) {
    console.warn("Backend niet bereikbaar bij update status", e);
  }
}

function onStatusSelect(order: Order, event: Event) {
  const target = event.target as HTMLSelectElement | null;
  if (!target) return;

  const value = target.value as OrderStatus;
  changeStatus(order, value);
}


/* ===== DATA LADEN + LOCALSTORAGE ===== */

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

async function loadData() {
  loading.value = true;
  error.value = null;

  try {
    const [ordersRes, klantenRes] = await Promise.all([
      fetch(`${API_BASE}/orders`),
      fetch(`${API_BASE}/klanten`),
    ]);

    if (ordersRes.ok) {
      const data: Order[] = await ordersRes.json();
      orders.value = data;
      saveOrdersToStorage(orders.value);
    }

    if (klantenRes.ok) {
      klanten.value = await klantenRes.json();
    }
  } catch (e: any) {
    console.warn("Backend niet bereikbaar, gebruik localStorage-data", e);
    error.value = null; // we hebben al localStorage, dus geen harde error tonen
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadData();
});

function getRowClass(order: Order): string {
  if (order.status === "KLAAR") {
    return "row-done";
  }
  if (order.status === "GEANNULEERD") {
    return "row-cancelled";
  }
  return "";
}

</script>

<style scoped>
.page {
  max-width: 90vw;
  margin: 2rem auto;
  padding: 0 1rem 3rem;
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
  color: #111827;
}

th {
  background: #f9fafb;
  font-weight: 600;
}

tr {
  cursor: pointer;
}

/* Hele rij kleur voor KLAAR / GEANNULEERD */

.row-done {
  background: #dcfce7; /* licht groen */
}

.row-done:hover {
  background: #bbf7d0; /* iets donkerder groen bij hover */
}

.row-cancelled {
  background: #fee2e2; /* licht rood */
}

.row-cancelled:hover {
  background: #fecaca; /* iets donkerder rood bij hover */
}

.status-done {
  background: #dbeafe;  /* licht blauw */
  color: #1d4ed8;       /* blauw tekst */
}

.status-cancelled {
  background: #e5e7eb;  /* licht grijs */
  color: #6b7280;       /* donker grijs */
}

/* leverstatus badge */
.status-pill {
  display: inline-block;
  padding: 0.15rem 0.6rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.status-green {
  background: #dcfce7;
  color: #166534;
}

.status-yellow {
  background: #fef9c3;
  color: #854d0e;
}

.status-orange {
  background: #ffedd5;
  color: #9a3412;
}

.status-red {
  background: #fee2e2;
  color: #b91c1c;
}

.status-neutral {
  background: #e5e7eb;
  color: #374151;
}

/* dozen-quick-edit */

.produced-cell {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.circle-btn {
  width: 24px;
  height: 24px;
  border-radius: 999px;
  border: 1px solid #d1d5db;
  background: #2b6198;
  font-size: 0.9rem;
  line-height: 1;
  padding: 0;
  cursor: pointer;
}

.circle-btn:hover {
  background: #196b1d;
}

.produced-text {
  min-width: 60px;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

/* status select */

.status-cell {
  min-width: 140px;
}

.status-select {
  width: 100%;
  border-radius: 999px;
  border: 1px solid #d1d5db;
  padding: 0.2rem 0.6rem;
  font-size: 0.8rem;
  background: #f9fafb;
}

.error {
  margin-top: 0.5rem;
  color: #b91c1c;
  font-size: 0.85rem;
}
</style>
