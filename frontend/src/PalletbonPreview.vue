<template>
  <div class="palletbon-card">
    <header class="palletbon-header">
      <div class="palletbon-company">
        <h1>PETERS VERPAKKINGEN B.V.</h1>
        <p>Groothandelsmarkt 5, 1681 NS Zwaagdijk-Oost</p>
        <p>tel. 072-5612404 · E-mail: info@thermobag.com</p>
      </div>
    </header>

    <h2 class="palletbon-title">PALLETBON</h2>

    <!-- 1) Afleveradres + pallet info zoals pakbon tabel -->
    <table class="pakbon-table">
      <thead>
        <tr>
          <th style="width:50%">Afleveradres</th>
          <th style="width:50%">Palletgegevens</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="cell">
            <div>{{ klant?.naam || "-" }}</div>
            <div v-if="klantAdres">{{ klantAdres }}</div>
            <div v-if="klant?.land">{{ klant.land }}</div>
          </td>
          <td class="cell">
            <div><strong>Pallet 1</strong></div>
            <div>Per pallet aantal dozen: {{ dozenPerPallet }}</div>
            <div>Totaal aantal dozen: {{ totalBoxes ?? "-" }}</div>
            <div>Art.nr.: {{ onsArtNr }}</div>
            <div>Onze ref.: {{ order.interne_referentie }}</div>
            <div>Uw order: {{ order.klant_order_nummer || "-" }}</div>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- 2) AFZ onderaan -->
    <table class="pakbon-table afz-table">
      <thead>
        <tr><th>AFZ</th></tr>
      </thead>
      <tbody>
        <tr>
          <td class="cell">
            <div><strong>PETERS VERPAKKINGEN B.V.</strong></div>
            <div>Groothandelsmarkt 5</div>
            <div>1681 NS Zwaagdijk</div>
            <div>THE NETHERLANDS</div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { Order } from "./OrdersOverview.vue";

interface Klant {
  klant_id: number;
  naam: string;
  straat?: string;
  huisnummer?: string;
  postcode?: string;
  plaats?: string;
  land?: string;
}

const props = defineProps<{
  order: Order;
  klant: Klant | null;
  onsArtNr: string;
}>();

const klantAdres = computed(() => {
  if (!props.klant) return "";
  const parts = [
    props.klant.straat && props.klant.huisnummer
      ? `${props.klant.straat} ${props.klant.huisnummer}`
      : null,
    props.klant.postcode && props.klant.plaats
      ? `${props.klant.postcode} ${props.klant.plaats}`
      : null,
  ].filter(Boolean);
  return parts.join(", ");
});

const totalBoxes = computed(() => {
  if (!props.order.stuks_per_doos || !props.order.totaal_aantal_stuks) return null;
  return Math.ceil(props.order.totaal_aantal_stuks / props.order.stuks_per_doos);
});

const dozenPerPallet = computed(() => props.order.totaal_per_pallet || 36);
</script>

<style>
.palletbon-card {
  background: #111827;
  color: #f9fafb;
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid #4b5563;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  page-break-inside: avoid;
}

.palletbon-header {
  display: flex;
  justify-content: center;
  margin-bottom: 0.9rem;
}

.palletbon-company h1 {
  font-size: 1.1rem;
  margin: 0 0 0.25rem;
  text-transform: uppercase;
  text-align: center;
}

.palletbon-company p {
  margin: 0;
  font-size: 0.8rem;
  text-align: center;
}

.palletbon-title {
  text-align: center;
  margin: 0.4rem 0 0.8rem;
  font-size: 0.9rem;
  letter-spacing: 0.1em;
}

/* hergebruik dezelfde table stijl als pakbon */
.pakbon-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8rem;
  margin-bottom: 0.9rem;
}

.pakbon-table th,
.pakbon-table td {
  border: 1px solid #4b5563;
  padding: 0.4rem 0.5rem;
  vertical-align: top;
}

.pakbon-table th {
  background: #1f2937;
  font-weight: 600;
  text-align: left;
}

.cell div {
  margin-bottom: 0.15rem;
}

.afz-table {
  margin-bottom: 0;
}
</style>