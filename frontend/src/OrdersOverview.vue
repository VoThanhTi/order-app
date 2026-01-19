<!-- src/OrdersOverview.vue -->
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
              <td>{{ order.interne_referentie ?? "-" }}</td>
              <td>{{ klantNaam(order.klant_id) }}</td>
              <td>{{ order.klant_order_nummer ?? "-" }}</td>
              <td>{{ order.klant_artikel_nummer ?? "-" }}</td>
              <td>{{ order.product_naam ?? "-" }}</td>
              <td>{{ order.formaat ?? "-" }}</td>
              <td>{{ formatDate(order.order_datum) }}</td>
              <td>{{ formatDate(order.geplande_lever_datum) }}</td>

              <!-- leverstatus badge -->
              <td>
                <span :class="['status-pill', getDeliveryClass(order)]">
                  {{ getDeliveryLabel(order) }}
                </span>
              </td>

              <!-- dozen geproduceerd: inline +/- -->
              <td class="produced-cell" @click.stop>
                <button class="circle-btn" type="button" @click.stop="changeProducedBoxes(order, -1)">–</button>
                <span class="produced-text">{{ getProducedBoxesText(order) }}</span>
                <button class="circle-btn" type="button" @click.stop="changeProducedBoxes(order, +1)">+</button>
              </td>

              <!-- status: inline select -->
              <td class="status-cell" @click.stop>
                <select
                  class="status-select"
                  :value="normalizedStatus(order.status)"
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
import type { Order, Klant, OrderStatus } from "./services/db";
import { getOrders, getKlanten, updateOrder } from "./services/db";

const emit = defineEmits<{
  (e: "open-order", order: Order): void;
}>();

const orders = ref<Order[]>([]);
const klanten = ref<Klant[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

/* ===== UTIL ===== */
function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  const parts = value.split("-");
  if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
  return value;
}

function klantNaam(id: number | null) {
  if (!id) return "-";
  const k = klanten.value.find((x) => x.klant_id === id);
  return k ? k.naam : `#${id}`;
}

function selectOrder(order: Order) {
  emit("open-order", order);
}

/* ===== STATUS NORMALIZE ===== */
/** jouw Order.status is: OrderStatus | string | null */
function normalizedStatus(status: Order["status"]): OrderStatus {
  if (status === "OPEN" || status === "IN_PRODUCTIE" || status === "KLAAR" || status === "GEANNULEERD") {
    return status;
  }
  return "OPEN";
}

/* ===== LEVERSTATUS ===== */
function stripTime(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function workingDaysUntil(delivery: Date): number {
  const today = stripTime(new Date());
  const end = stripTime(delivery);

  if (end < today) return -1;

  let days = 0;
  const d = new Date(today);

  while (d <= end) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) days++;
    d.setDate(d.getDate() + 1);
  }

  return days;
}

function getDeliveryClass(order: Order): string {
  const st = normalizedStatus(order.status);
  if (st === "KLAAR") return "status-done";
  if (st === "GEANNULEERD") return "status-cancelled";

  const delivery = new Date(order.geplande_lever_datum || "");
  if (isNaN(delivery.getTime())) return "status-neutral";

  const today = stripTime(new Date());
  const end = stripTime(delivery);

  if (end < today) return "status-red";

  const workdays = workingDaysUntil(delivery);
  if (workdays >= 5) return "status-green";
  if (workdays >= 3) return "status-yellow";
  return "status-orange";
}

function getDeliveryLabel(order: Order): string {
  const st = normalizedStatus(order.status);
  if (st === "KLAAR") return "Klaar";
  if (st === "GEANNULEERD") return "Geannuleerd";

  const delivery = new Date(order.geplande_lever_datum || "");
  if (isNaN(delivery.getTime())) return "Geen datum";

  const today = stripTime(new Date());
  const end = stripTime(delivery);

  if (end < today) return "Te laat";

  const workdays = workingDaysUntil(delivery);
  if (workdays === 1) return "1 werkdag";
  if (workdays === 2) return "2 werkdagen";
  if (workdays === 3) return "3 werkdagen";
  if (workdays === 4) return "4 werkdagen";
  if (workdays >= 5) return `${workdays} werkdagen`;

  return "Vandaag";
}

/* ===== DOZEN ===== */
function totalBoxes(order: Order): number | null {
  if (order.stuks_per_doos == null || order.totaal_aantal_stuks == null) return null;
  if (order.stuks_per_doos <= 0 || order.totaal_aantal_stuks <= 0) return null;
  return Math.ceil(order.totaal_aantal_stuks / order.stuks_per_doos);
}

function getProducedBoxesText(order: Order): string {
  const total = totalBoxes(order);
  const produced = order.geproduceerde_dozen ?? 0;
  return total == null ? produced.toString() : `${produced} / ${total}`;
}

async function changeProducedBoxes(order: Order, delta: number) {
  const index = orders.value.findIndex((o) => o.order_id === order.order_id);
  if (index === -1) return;

  const current = orders.value[index];
  if (!current) return;

  const produced = current.geproduceerde_dozen ?? 0;
  const total = totalBoxes(current);

  let newValue = produced + delta;
  if (newValue < 0) newValue = 0;
  if (total != null && newValue > total) newValue = total;

  // optimistic
  orders.value.splice(index, 1, { ...current, geproduceerde_dozen: newValue });

  try {
    const updated = await updateOrder(order.order_id, { geproduceerde_dozen: newValue });
    orders.value.splice(index, 1, updated);
  } catch (e) {
    // revert
    orders.value.splice(index, 1, current);
    console.warn(e);
  }
}

async function changeStatus(order: Order, newStatus: OrderStatus) {
  const index = orders.value.findIndex((o) => o.order_id === order.order_id);
  if (index === -1) return;

  const current = orders.value[index];
  if (!current) return;

  const curStatus = normalizedStatus(current.status);
  if (curStatus === newStatus) return;

  // optimistic
  orders.value.splice(index, 1, { ...current, status: newStatus });

  try {
    const updated = await updateOrder(order.order_id, { status: newStatus });
    orders.value.splice(index, 1, updated);
  } catch (e) {
    // revert
    orders.value.splice(index, 1, current);
    console.warn(e);
  }
}

function onStatusSelect(order: Order, event: Event) {
  const target = event.target as HTMLSelectElement | null;
  if (!target) return;
  changeStatus(order, target.value as OrderStatus);
}

/* ===== LOAD ===== */
async function loadData() {
  loading.value = true;
  error.value = null;

  try {
    const [o, k] = await Promise.all([getOrders(), getKlanten()]);
    orders.value = o;
    klanten.value = k;
  } catch (e: any) {
    console.error(e);
    error.value = e?.message ?? "Kon data niet laden";
  } finally {
    loading.value = false;
  }
}

onMounted(loadData);

function getRowClass(order: Order): string {
  const st = normalizedStatus(order.status);
  if (st === "KLAAR") return "row-done";
  if (st === "GEANNULEERD") return "row-cancelled";
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

.row-done {
  background: #dcfce7;
}
.row-done:hover {
  background: #bbf7d0;
}

.row-cancelled {
  background: #fee2e2;
}
.row-cancelled:hover {
  background: #fecaca;
}

.status-done {
  background: #dbeafe;
  color: #1d4ed8;
}

.status-cancelled {
  background: #e5e7eb;
  color: #6b7280;
}

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
