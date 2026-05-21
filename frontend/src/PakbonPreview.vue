<template>
  <div class="pakbon-wrapper">
    <div class="pakbon-actions no-print">
      <!-- ✅ nieuw: aparte knoppen + pallets input -->
      <button @click="doPrint('pakbon')">Print pakbon</button>
        <button class="primary" @click="doPrint('palletbon')">Print palletbon</button>

      <div class="pallet-input">
        <label>Aantal pallets</label>
        <input
          type="number"
          min="1"
          v-model.number="palletTotal"
          @input="palletTotalTouched = true"
        />
      </div>
    </div>

    <div class="print-root pakbon-print">
      <!-- ✅ PAKBON (alleen niet bij palletbon-only print) -->
      <section class="doc-page doc-pakbon" v-if="printTarget !== 'palletbon'">
        <div class="pakbon-card">
          <header class="pakbon-header">
            <div class="pakbon-company">
              <h1>PETERS VERPAKKINGEN B.V.</h1>
              <p>Groothandelsmarkt 5, 1681 NS Zwaagdijk-Oost</p>
              <p>tel. 072-5612404 · E-mail: info@thermobag.com</p>
            </div>
          </header>

          <section class="pakbon-section">
            <div class="col">
              <h3>Afleveradres</h3>
              <p>{{ klant?.naam || "-" }}</p>
              <p v-if="klantAdres">{{ klantAdres }}</p>
              <p v-if="klant?.land">{{ klant.land }}</p>
            </div>

            <div class="col">
              <table class="small-table">
                <tbody>
                  <tr>
                    <td>Uw order</td>
                    <td>:</td>
                    <td>{{ order.klant_order_nummer || "-" }}</td>
                  </tr>
                  <tr>
                    <td>Onze ref.</td>
                    <td>:</td>
                    <td>{{ order.interne_referentie || "-" }}</td>
                  </tr>
                  <tr>
                    <td>Levering</td>
                    <td>:</td>
                    <td>franco</td>
                  </tr>
                  <tr>
                    <td>Leverdatum</td>
                    <td>:</td>
                    <td>{{ formatDate(order.geplande_lever_datum) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <h2 class="pakbon-title">PAKBON</h2>

          <table class="pakbon-table">
            <thead>
              <tr>
                <th>Ons art.nr.</th>
                <th>Omschrijving</th>
                <th>Aantal</th>
                <th>Leverdatum</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{{ onsArtNr }}</td>
                <td class="omschrijving">
                  <div>{{ order.product_naam || "-" }}</div>
                  <div>Formaat: {{ order.formaat || "-" }}</div>
                  <div v-if="order.materiaal">Materiaal: {{ order.materiaal }}</div>
                  <div v-if="order.perforatie_type">Perforatie: {{ order.perforatie_type }}</div>
                  <div v-if="palletText">{{ palletText }}</div>
                </td>
                <td>
                  <div v-if="order.totaal_aantal_stuks != null">
                    {{ order.totaal_aantal_stuks.toLocaleString("nl-NL") }} aantal dozen
                  </div>
                  <div v-if="totaalDozenText">{{ totaalDozenText }}</div>
                </td>
                <td>{{ formatDate(order.geplande_lever_datum) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- ✅ PALLETBON(NEN) (alleen niet bij pakbon-only print) -->
      <template v-if="printTarget !== 'pakbon'">
        <section
          v-for="i in palletTotal"
          :key="`palletbon-${i}`"
          class="doc-page doc-palletbon"
        >
          <PalletbonPreview
            :order="order"
            :klant="klant"
            :onsArtNr="onsArtNr"
            :palletIndex="i"
            :palletTotal="palletTotal"
          />
        </section>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, nextTick, watchEffect } from "vue";
import type { Order, Klant } from "./services/db";
import PalletbonPreview from "./PalletbonPreview.vue";

const props = defineProps<{
  order: Order;
  klant: Klant | null;
}>();

/** ✅ print target */
const printTarget = ref<null | "pakbon" | "palletbon" | "both">(null);

async function doPrint(kind: "pakbon" | "palletbon" | "both") {
  printTarget.value = kind;
  await nextTick();
  window.print();
  setTimeout(() => (printTarget.value = null), 300);
}

/** ✅ pallets input */
const palletTotal = ref<number>(1);
const palletTotalTouched = ref(false);

const klantAdres = computed(() => {
  if (!props.klant) return "";
  const parts = [
    props.klant.straat && props.klant.huisnummer
      ? `${props.klant.straat} ${props.klant.huisnummer}`
      : null,
    props.klant.postcode && props.klant.plaats
      ? `${props.klant.postcode} ${props.klant.plaats}`
      : null,
  ].filter(Boolean) as string[];

  return parts.join(", ");
});

const onsArtNr = computed(() => {
  return props.order.klant_artikel_nummer || props.order.interne_referentie || "-";
});

const totalBoxes = computed(() => {
  if (!props.order.stuks_per_doos || !props.order.totaal_aantal_stuks) return null;
  return Math.ceil(props.order.totaal_aantal_stuks / props.order.stuks_per_doos);
});

const totaalDozenText = computed(() => {
  if (totalBoxes.value == null || !props.order.stuks_per_doos) return "";
  return `${totalBoxes.value} dozen à ${props.order.stuks_per_doos} stuks`;
});

const computedPallets = computed(() => {
  if (totalBoxes.value == null) return 1;
  const dozenPerPallet = props.order.totaal_per_pallet || 36;
  return Math.max(1, Math.ceil(totalBoxes.value / dozenPerPallet));
});

/** ✅ default pallets = berekend, maar NIET overschrijven als jij handmatig aanpast */
watchEffect(() => {
  if (!palletTotalTouched.value) {
    palletTotal.value = computedPallets.value || 1;
  }
});

const palletText = computed(() => {
  if (totalBoxes.value == null) return "";
  const dozenPerPallet = props.order.totaal_per_pallet || 36;
  return `${palletTotal.value} pallet(en) · ca. ${dozenPerPallet} dozen per pallet`;
});

function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  const [y, m, d] = value.split("-");
  if (!y || !m || !d) return value;
  return `${d}-${m}-${y}`;
}
</script>

<style>
.pakbon-wrapper {
  margin-top: 0.5rem;
}

.print-root {
  display: block;
}

.pakbon-card {
  color: #000000;
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid #4b5563;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.pakbon-header {
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
}

.pakbon-company h1 {
  font-size: 1.1rem;
  margin: 0 0 0.25rem;
  text-transform: uppercase;
  text-align: center;
}

.pakbon-company p {
  margin: 0;
  font-size: 0.8rem;
  text-align: center;
}

.pakbon-section {
  display: flex;
  justify-content: space-between;
  gap: 2rem;
  margin-bottom: 1rem;
  font-size: 0.85rem;
}

.pakbon-section .col {
  flex: 1;
}

.pakbon-section h3 {
  margin: 0 0 0.25rem;
  font-size: 0.9rem;
}

.small-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8rem;
}

.small-table td:first-child {
  white-space: nowrap;
}

.pakbon-title {
  text-align: center;
  margin: 0.5rem 0 0.75rem;
  font-size: 0.9rem;
  letter-spacing: 0.1em;
}

.pakbon-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8rem;
}

.pakbon-table th,
.pakbon-table td {
  border: 1px solid #4b5563;
  padding: 0.4rem 0.5rem;
  vertical-align: top;
}

.pakbon-table th {
  background: #00000045;
  font-weight: 600;
}

.pakbon-table .omschrijving div {
  margin-bottom: 0.15rem;
}

.pakbon-actions {
  margin-bottom: 0.75rem;
  display: flex;
  justify-content: flex-end;
  gap: .6rem;
  align-items: center;
}

.pakbon-actions button {
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 999px;
  padding: 0.4rem 1rem;
  font-size: 0.85rem;
  cursor: pointer;
}

.pakbon-actions button.primary {
  background: #111827;
}

.pakbon-actions button.secondary {
  background: #e5e7eb;
  color: #111827;
}

.pallet-input {
  display: flex;
  align-items: center;
  gap: .45rem;
  padding: .25rem .6rem;
  border: 1px solid #e5e7eb;
  border-radius: 999px;
  background: #fff;
}

.pallet-input label {
  font-size: .85rem;
  font-weight: 600;
  color: #111827;
}

.pallet-input input {
  width: 70px;
  border-radius: 999px;
  border: 1px solid #d1d5db;
  padding: .3rem .55rem;
}

.no-print {
  display: block;
}

/* PRINT */
@media print {
  @page { margin: 10mm; size: A4; }

  body * { visibility: hidden; }
  .pakbon-print, .pakbon-print * { visibility: visible; }

  .no-print { display: none !important; }

  .pakbon-print {
    position: absolute;
    inset: 0;
    margin: 0 !important;
    padding: 0 !important;
  }

  .doc-page {
    break-after: page;
    page-break-after: always;
    break-inside: avoid;
    page-break-inside: avoid;
  }

  /* laatste pagina: geen extra lege pagina */
  .doc-page:last-child {
    break-after: auto;
    page-break-after: auto;
  }

  .pakbon-card {
    border-radius: 0 !important;
    margin: 0 !important;
    border: none;
  }
}
</style>