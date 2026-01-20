<!-- src/EtikettenPage.vue -->
<template>
  <div class="page">
    <h1 class="no-print">Etiketten</h1>

    <!-- Instellingen -->
    <section class="card no-print">
      <h2>Instellingen</h2>

      <div class="settings">
        <div class="setting">
          <label>Template</label>
          <select v-model="template">
            <option value="2">2 etiketten (A4) — Lufthansa (vast)</option>
            <option value="8">8 etiketten (A4)</option>
            <option value="16">16 etiketten (A4) — Avery 3484 (105×37mm)</option>
          </select>

          <p class="hint" v-if="template === '16'">Avery 3484 is 16 stuks: 2×8, 105×37mm.</p>
          <p class="hint" v-if="template === '2'">
            Template “2” is <strong>altijd Lufthansa</strong>. Alleen <strong>datum</strong> is aanpasbaar.
          </p>
        </div>

        <!-- Lufthansa datum -->
        <div class="setting" v-if="template === '2'">
          <label>Datum (Date of Production)</label>
          <input class="input" type="date" v-model="lufthansaIsoDate" />
          <p class="hint">Wordt geprint als: <strong>{{ lufthansaDateDots }}</strong></p>
        </div>

        <!-- Normale templates -->
        <div class="setting" v-else>
          <label>Wat komt op het etiket?</label>

          <div class="chips">
            <!-- basis -->
            <label class="chip"><input type="checkbox" v-model="fields.klant" />Klantnaam</label>
            <label class="chip"><input type="checkbox" v-model="fields.orderRef" />Order + Ref</label>
            <label class="chip"><input type="checkbox" v-model="fields.product" />Product</label>
            <label class="chip"><input type="checkbox" v-model="fields.formaat" />Formaat</label>
            <label class="chip"><input type="checkbox" v-model="fields.leverdatum" />Leverdatum</label>
            <label class="chip"><input type="checkbox" v-model="fields.artikel" />Artikelnummer</label>
            <label class="chip"><input type="checkbox" v-model="fields.status" />Status</label>
            <label class="chip"><input type="checkbox" v-model="fields.datum" />Datum (vandaag)</label>
            <label class="chip"><input type="checkbox" v-model="fields.doosnummer" />Doosnummer (auto)</label>

            <!-- extra (alles) -->
            <label class="chip"><input type="checkbox" v-model="fields.materiaal" />Materiaal</label>
            <label class="chip"><input type="checkbox" v-model="fields.dikte" />Dikte</label>
            <label class="chip"><input type="checkbox" v-model="fields.perforatie" />Perforatie</label>
            <label class="chip"><input type="checkbox" v-model="fields.stuksDoos" />Stuks/doos</label>
            <label class="chip"><input type="checkbox" v-model="fields.totaalStuks" />Totaal stuks</label>
            <label class="chip"><input type="checkbox" v-model="fields.dozenTotaal" />Totaal dozen</label>
            <label class="chip"><input type="checkbox" v-model="fields.beugel" />Beugel (maat/vorm)</label>
          </div>

          <div class="doos-settings" v-if="fields.doosnummer && (template === '8' || template === '16')">
            <div class="doos-row">
              <label>Start doosnummer</label>
              <input class="input" type="number" min="1" v-model.number="doosStart" />
            </div>
            <p class="hint">
              Voorbeeld: start = <strong>1</strong> → 1-{{ slotsCount }} |
              start = <strong>17</strong> → 17-{{ doosStart + slotsCount - 1 }}
            </p>
          </div>

          <!-- ✅ vrije tekst -->
          <div class="setting">
            <label>Extra tekst (optioneel)</label>
            <input
              class="input"
              type="text"
              v-model="extraText"
              placeholder="Bijv: LET OP: spoed / speciale instructie / batch..."
            />
            <p class="hint">Deze tekst komt onderaan op elk gevuld etiket.</p>
          </div>

          <p class="hint">Max ~5 regels. Bij template 16 wordt font automatisch kleiner als je veel aanzet.</p>
        </div>
      </div>
    </section>

    <!-- Orders kiezen -->
    <section class="card no-print" v-if="template !== '2'">
      <h2>Kies orders (klik om te vullen)</h2>

      <div v-if="loading">Laden...</div>
      <div v-else-if="orders.length === 0">Nog geen orders.</div>

      <div v-else class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Order</th>
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
              v-for="o in orders"
              :key="o.order_id"
              class="clickable"
              @click="addToNextSlot(o)"
              title="Klik om op het volgende etiket te zetten"
            >
              <td>{{ o.order_id }}</td>
              <td>{{ o.interne_referentie ?? "-" }}</td>
              <td>{{ klantNaam(o.klant_id) }}</td>
              <td>{{ o.product_naam ?? "-" }}</td>
              <td>{{ o.formaat ?? "-" }}</td>
              <td>{{ formatDate(o.geplande_lever_datum) }}</td>
              <td>{{ o.status ?? "-" }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p class="hint">Tip: klik op een etiket in de preview om ‘m leeg te maken.</p>
    </section>

    <!-- Preview / print -->
    <section class="card print-card">
      <h2 class="no-print">Preview</h2>

      <div class="preview-wrap">
        <div class="sheet print-area" :class="[`sheet-t${template}`]" :style="sheetStyle">
          <div class="label-grid" :class="gridClass">
            <div
              v-for="(_, idx) in slotsCount"
              :key="idx"
              class="label"
              :class="[fontClass, template === '2' ? 'label-plain' : '']"
              @click="template !== '2' ? removeSlot(idx) : undefined"
            >
              <!-- Lufthansa -->
              <template v-if="template === '2'">
                <div class="luf">
                  <div class="luf-head">
                    <div class="luf-title">Lufthansa</div>
                    <div class="luf-sub">Supplied by De Ster GmbH</div>
                  </div>

                  <div class="luf-body">
                    <div class="luf-left"></div>
                    <div class="luf-right">
                      <div class="luf-row">
                        <div class="luf-big">Bakingbag for rolls large</div>
                        <div class="luf-small">Article</div>
                      </div>

                      <div class="luf-row luf-split">
                        <div class="luf-col">
                          <div class="luf-big">1 000 pieces</div>
                          <div class="luf-small">Quantity</div>
                        </div>
                        <div class="luf-col">
                          <div class="luf-big">&nbsp;</div>
                          <div class="luf-small">Charge-Nr.</div>
                        </div>
                      </div>

                      <div class="luf-row">
                        <div class="luf-big">350 × 550 mm</div>
                        <div class="luf-small">Dimensions of Article (mm)</div>
                      </div>

                      <div class="luf-row luf-split">
                        <div class="luf-col">
                          <div class="luf-mid">0,0064 kg</div>
                          <div class="luf-small">Weight <span class="luf-light">per piece</span></div>
                        </div>
                        <div class="luf-col">
                          <div class="luf-mid">6,40 kg</div>
                          <div class="luf-small"><span class="luf-light">per box</span></div>
                        </div>
                      </div>

                      <div class="luf-row luf-split">
                        <div class="luf-col">
                          <div class="luf-mid">{{ lufthansaDateDots }}</div>
                          <div class="luf-small">Date of Production</div>
                        </div>
                        <div class="luf-col">
                          <div class="luf-mid">not applicable</div>
                          <div class="luf-small">To be used before</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="luf-foot">
                    <div class="luf-foot-left">
                      <div class="luf-mid2">Handle with care / Dry storage</div>
                      <div class="luf-small2">Handling Instructions</div>
                      <div class="luf-recycle">
                        <div class="luf-recycle-mark">♻</div>
                        <div class="luf-recycle-code">1042</div>
                      </div>
                    </div>
                    <div class="luf-foot-right">
                      <div class="luf-ster">De Ster 363 0023</div>
                      <div class="luf-small2">De Ster-Art.-Nr.</div>
                    </div>
                  </div>
                </div>
              </template>

              <!-- Normale labels -->
              <template v-else>
                <template v-if="slots[idx]">
                  <div class="label-body">
                    <div 
                      v-for="(line, i) in buildLines(slots[idx]!, idx)" 
                      :key="i" 
                      class="line"
                      :class="{ 'full-width': i < 3 || i === buildLines(slots[idx]!, idx).length - 1 }"
                    >
                      {{ line }}
                    </div>
                  </div>
                </template>
                <template v-else>
                  <div class="empty">—</div>
                </template>
              </template>
            </div>
          </div>
        </div>
      </div>

      <div class="toolbar no-print">
        <button @click="clearSlots">Leeg maken</button>
        <button class="primary" @click="printSheet">Print / PDF</button>
      </div>

      <p class="hint no-print">Print tip: Chrome → Margins: None, Scale: 100%, Headers/Footers: uit, Background graphics: aan.</p>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import type { Order, Klant } from "./services/db";
import { getOrders, getKlanten } from "./services/db";

const orders = ref<Order[]>([]);
const klanten = ref<Klant[]>([]);
const loading = ref(false);

type Template = "2" | "8" | "16";
const template = ref<Template>("16");

type LabelSlot = null | {
  orderId: number;
  ref: string;
  klant: string;
  product: string;
  formaat: string;
  leverdatum: string;
  artikel: string;
  status: string;
};

const fields = reactive({
  // basis
  klant: true,
  orderRef: true,
  product: true,
  formaat: false,
  leverdatum: true,
  artikel: false,
  status: false,
  datum: false,
  doosnummer: false,

  // extra (alles)
  materiaal: false,
  dikte: false,
  perforatie: false,
  stuksDoos: false,
  totaalStuks: false,
  dozenTotaal: false,
  beugel: false,
});

const extraText = ref<string>("");

const doosStart = ref<number>(1);

const lufthansaIsoDate = ref<string>(new Date().toISOString().slice(0, 10));
const lufthansaDateDots = computed(() => formatDateDots(lufthansaIsoDate.value));

const todayText = computed(() => {
  const iso = new Date().toISOString().slice(0, 10);
  return formatDate(iso);
});

function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  const [y, m, d] = value.split("-");
  if (!y || !m || !d) return value;
  return `${d}-${m}-${y}`;
}

function formatDateDots(value: string | null | undefined) {
  if (!value) return "-";
  const [y, m, d] = value.split("-");
  if (!y || !m || !d) return value;
  return `${d}.${m}.${y}`;
}

function klantNaam(id: number | null) {
  if (!id) return "-";
  const k = klanten.value.find((x) => x.klant_id === id);
  return k ? k.naam : `#${id}`;
}

async function loadData() {
  loading.value = true;
  try {
    const [o, k] = await Promise.all([getOrders(), getKlanten()]);
    orders.value = o;
    klanten.value = k;
  } catch (e) {
    console.warn(e);
    orders.value = [];
    klanten.value = [];
  } finally {
    loading.value = false;
  }
}

onMounted(loadData);

const slotsCount = computed(() => {
  if (template.value === "2") return 2;
  if (template.value === "8") return 8;
  return 16;
});

const slots = ref<LabelSlot[]>([]);
function resetSlotsForTemplate() {
  slots.value = Array.from({ length: slotsCount.value }, () => null);
}
watch(template, () => resetSlotsForTemplate(), { immediate: true });

function addToNextSlot(o: Order) {
  const i = slots.value.findIndex((s) => s === null);
  if (i === -1) return;

  const slot: LabelSlot = {
    orderId: o.order_id,
    ref: o.interne_referentie ?? "-",
    klant: klantNaam(o.klant_id),
    product: o.product_naam ?? "-",
    formaat: o.formaat ?? "-",
    leverdatum: formatDate(o.geplande_lever_datum),
    artikel: o.klant_artikel_nummer ?? "-",
    status: String(o.status ?? "-"),
  };

  slots.value[i] = slot;
}

function removeSlot(index: number) {
  slots.value[index] = null;
}

function clearSlots() {
  resetSlotsForTemplate();
}

function printSheet() {
  window.print();
}

const selectedFieldCount = computed(() => Object.values(fields).filter(Boolean).length);

const fontClass = computed(() => {
  if (template.value === "8") return "f-normal";
  if (template.value === "2") return "f-normal";

  if (selectedFieldCount.value <= 5) return "f-normal";
  if (selectedFieldCount.value <= 8) return "f-small";
  return "f-tiny";
});

const gridClass = computed(() => {
  if (template.value === "2") return "grid-2";
  if (template.value === "8") return "grid-8";
  return "grid-16";
});

const printScale = computed(() => {
  if (template.value === "16") return "0.985";
  if (template.value === "2") return "0.99";
  return "1";
});

const sheetStyle = computed(() => ({ "--printScale": printScale.value }) as Record<string, string>);

type FilledSlot = Exclude<LabelSlot, null>;

function buildLines(slot: FilledSlot, idx: number) {
  const lines: string[] = [];

  if (fields.klant) lines.push(slot.klant);
  if (fields.orderRef) lines.push(`Order ${slot.orderId} · Ref ${slot.ref}`);
  if (fields.product) lines.push(slot.product);
  if (fields.formaat) lines.push(`Formaat: ${slot.formaat}`);
  if (fields.leverdatum) lines.push(`Leverdatum: ${slot.leverdatum}`);
  if (fields.artikel) lines.push(`Art.nr: ${slot.artikel}`);
  if (fields.status) lines.push(`Status: ${slot.status}`);
  if (fields.datum) lines.push(`Datum: ${todayText.value}`);

  // ✅ extra velden (uit orders_api), alleen als aanwezig
  const order = orders.value.find((o) => o.order_id === slot.orderId);

  if (order) {
    if (fields.materiaal && order.materiaal) lines.push(`Materiaal: ${order.materiaal}`);
    if (fields.dikte && order.dikte_micron != null) lines.push(`Dikte: ${order.dikte_micron} µm`);
    if (fields.perforatie && order.perforatie_type) lines.push(`Perforatie: ${order.perforatie_type}`);
    if (fields.stuksDoos && order.stuks_per_doos != null) lines.push(`Stuks/doos: ${order.stuks_per_doos}`);
    if (fields.totaalStuks && order.totaal_aantal_stuks != null) lines.push(`Totaal stuks: ${order.totaal_aantal_stuks}`);

    if (fields.dozenTotaal && order.stuks_per_doos && order.totaal_aantal_stuks) {
      const totalBoxes = Math.ceil(order.totaal_aantal_stuks / order.stuks_per_doos);
      lines.push(`Dozen: ${totalBoxes}`);
    }

    if (fields.beugel && (order.beugel_maat || order.beugel_vorm)) {
      lines.push(`Beugel: ${order.beugel_maat ?? "-"} / ${order.beugel_vorm ?? "-"}`);
    }
  }

  if (fields.doosnummer && (template.value === "8" || template.value === "16")) {
    const doosNr = (doosStart.value || 1) + idx;
    lines.push(`Doos: ${doosNr}`);
  }

  // ✅ vrije tekst onderaan
  const extra = extraText.value.trim();
  if (extra) lines.push(extra);

  return lines;
}
</script>

<style scoped>
.page{
  max-width:1100px;
  margin:2rem auto;
  padding:0 1rem 3rem;
  color:#f9fafb;
}

h1{font-size:1.8rem;margin-bottom:1.2rem;}
h2{font-size:1.1rem;margin-bottom:.75rem;}

.card{
  background:#fff;
  border-radius:12px;
  padding:1.5rem;
  margin-bottom:1.5rem;
  border:1px solid #e5e7eb;
  color:#111827;
}

.settings{
  display:grid;
  grid-template-columns:1fr;
  gap:1rem;
}

@media (min-width:900px){
  .settings{
    grid-template-columns:360px 1fr;
    align-items:start;
  }
}

.setting label{
  font-weight:600;
  display:block;
  margin-bottom:.4rem;
}

select,.input{
  width:100%;
  border-radius:10px;
  border:1px solid #d1d5db;
  padding:.5rem .6rem;
  background:#f3f4f6;
}

.chips{display:flex;flex-wrap:wrap;gap:.5rem;}

.chip{
  display:inline-flex;
  align-items:center;
  gap:.45rem;
  background:#f3f4f6;
  border:1px solid #e5e7eb;
  border-radius:999px;
  padding:.35rem .6rem;
  font-size:.9rem;
}

.doos-settings{
  margin-top:.8rem;
  background:#f9fafb;
  border:1px solid #e5e7eb;
  border-radius:12px;
  padding:.8rem;
}

.doos-row{
  display:grid;
  grid-template-columns:160px 1fr;
  gap:.8rem;
  align-items:center;
}

.table-wrapper{overflow-x:auto;}

table{
  width:100%;
  border-collapse:collapse;
  font-size:.9rem;
}

th,td{
  padding:.55rem .6rem;
  border-bottom:1px solid #e5e7eb;
  text-align:left;
}

th{background:#f9fafb;font-weight:600;}

.clickable{cursor:pointer;}
.clickable:hover{background:#f3f4f6;}

.toolbar{
  margin-top:.9rem;
  display:flex;
  gap:.6rem;
  justify-content:flex-end;
}

button{
  border:none;
  border-radius:999px;
  padding:.45rem 1rem;
  cursor:pointer;
  background:#e5e7eb;
}

button.primary{background:#2563eb;color:#fff;}

.hint{
  margin-top:.75rem;
  font-size:.85rem;
  color:#4b5563;
}

.preview-wrap {
  overflow-x: auto;
  padding-bottom: .5rem;
  line-height: 1.2; 
}

.label-body {
  display: grid;
  grid-template-columns: 1fr 1fr; /* Twee kolommen */
  column-gap: 4mm;
  row-gap: 0.5mm;
  align-content: start;
}

.line.full-width {
  grid-column: span 2;
  font-weight: bold;
  border-bottom: 0.5px solid #eee;
  margin-bottom: 1px;
}

/* ===================== SHEET / GRID ===================== */
.sheet{
  --ml:0mm;
  --mt:0mm;
  --cg:0mm;
  --rg:0mm;

  /* print-scale variable (via inline style) */
  --printScale: 1;

  width:210mm;
  height:297mm;
  background:#fff;
  border:1px dashed #e5e7eb;
  padding-left:var(--ml);
  padding-top:var(--mt);
  overflow:hidden;
  box-sizing:border-box;
}

.label-grid{
  display:grid;
  column-gap:var(--cg);
  row-gap:var(--rg);
  width:210mm;
  height:297mm;
  align-content:start;
}

/* 16 etiketten: 2×8, 105×37mm */
.grid-16{
  grid-template-columns:105mm 105mm;
  grid-template-rows:repeat(8, 37mm);
}

/* 8 etiketten: 2×4 */
.grid-8{
  grid-template-columns:105mm 105mm;
  grid-template-rows:repeat(4, 74.25mm);
}

/* 2 etiketten: 1×2 */
.grid-2{
  grid-template-columns:210mm;
  grid-template-rows:repeat(2, 148.5mm);
}

.label{
  box-sizing:border-box;
  color:#111827;
  user-select:none;
  border:1px solid rgba(0,0,0,.05);
  padding:3mm 4mm;
}

.grid-16 .label{width:105mm;height:37mm;}
.grid-8  .label{width:105mm;height:74.25mm;}
.grid-2  .label{width:210mm;height:148.5mm;padding:0;}

/* Bij template 16 (klein) moeten we iets zuiniger zijn met ruimte */
.grid-16 .label {
  padding: 2mm 3mm;
}

.label-plain{border:none;}

.line {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.empty{
  color:#9ca3af;
  display:flex;
  height:100%;
  align-items:center;
  justify-content:center;
}

/* auto font sizing */
.f-normal .line { font-size: 10pt; line-height: 1.3; }
.f-small  .line { font-size: 9pt;  line-height: 1.2; }
.f-tiny   .line { font-size: 8pt;  line-height: 1.1; }

/* ===================== Lufthansa label ===================== */
.luf {
  width: 100%;
  height: 100%;
  background: #fff;
  color: #111;
  border: 0.6mm solid #111;
  font-family: Arial, system-ui, -apple-system, "Segoe UI", sans-serif;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.luf-head {
  flex: 0 0 22mm;
  padding: 4.5mm 5mm 2.5mm;
  text-align: center;
  border-bottom: 0.6mm solid #111;
  box-sizing: border-box;
}

.luf-title {
  font-size: 17pt;
  font-weight: 800;
  line-height: 1;
}
.luf-sub {
  margin-top: 1.6mm;
  font-size: 10.5pt;
  font-weight: 700;
}

.luf-body {
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
  display: grid;
  grid-template-columns: 40% 60%;
}

.luf-left {
  background: #222;
  border-right: 0.6mm solid #111;
}

.luf-right {
  background: #2b2b2b;
  color: #fff;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.luf-row {
  background: #2b2b2b;
  border-bottom: 0.5mm solid rgba(255, 255, 255, 0.45);
  padding: 3mm 3.5mm 2mm;
  display: flex;
  flex-direction: column;
  justify-content: center;
  box-sizing: border-box;
}

.luf-row.luf-split {
  padding: 0;
  border-bottom: none;
  display: grid;
  grid-template-columns: 1fr 1fr;
  background: #2b2b2b;
}

.luf-row.luf-split .luf-col {
  background: #2b2b2b;
  padding: 3mm 3.5mm 2mm;
  display: flex;
  flex-direction: column;
  justify-content: center;
  box-sizing: border-box;
  border-right: 0.5mm solid rgba(255, 255, 255, 0.45);
  border-bottom: 0.5mm solid rgba(255, 255, 255, 0.45);
}
.luf-row.luf-split .luf-col:last-child {
  border-right: none;
}

.luf-big {
  font-size: 13.5pt;
  font-weight: 800;
  line-height: 1.08;
}
.luf-mid {
  font-size: 12.8pt;
  font-weight: 800;
  line-height: 1.08;
}
.luf-small {
  font-size: 8.5pt;
  opacity: 0.95;
  margin-top: 0.8mm;
}
.luf-light {
  font-weight: 500;
  opacity: 0.9;
}

.luf-foot {
  flex: 0 0 28mm;
  display: grid;
  grid-template-columns: 40% 60%;
  border-top: 0.6mm solid #111;
  box-sizing: border-box;
}

.luf-foot-left {
  background: #2b2b2b;
  color: #fff;
  padding: 3.2mm;
  border-right: 0.6mm solid #111;
  box-sizing: border-box;

  /* NEW: stabiel layouten */
  display: flex;
  flex-direction: column;
}

.luf-mid2 {
  font-size: 11pt;
  font-weight: 800;
}
.luf-small2 {
  font-size: 8.5pt;
  opacity: 0.95;

  /* NEW: geen negatieve margin meer (die veroorzaakt verschuiven) */
  margin-top: 0.8mm;
  line-height: 1.1;
}

.luf-recycle {
  /* NEW: niet meer absolute -> altijd zichtbaar op dezelfde plek */
  position: static;
  margin-top: auto;            /* duwt naar onderkant */
  display: flex;
  align-items: center;
  gap: 2.5mm;
}
.luf-recycle-mark { font-size: 16pt; }
.luf-recycle-code { font-size: 8.5pt; font-weight: 700; }

.luf-foot-right {
  background: #fff;
  color: #111;
  padding: 5mm 5mm 3.5mm;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  box-sizing: border-box;
}

.luf-ster {
  font-size: 14.5pt;
  font-weight: 900;
}

/* extra veilige marge Lufthansa label */
.grid-2 .label{
  padding:1mm;
  box-sizing:border-box;
}

/* ===================== PRINT ===================== */
@media print {
  @page { size: A4; margin: 0; }

  :global(html), :global(body) {
    margin: 0 !important;
    padding: 0 !important;
    background: #fff !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;

    /* helpt tegen extra pagina's */
    width: 210mm !important;
    height: 297mm !important;
    overflow: hidden !important;
  }

  /* UI weg (neemt geen ruimte in) */
  .no-print { display: none !important; }

  /* FAILSAFE: als ergens anders "alles verbergen" staat -> wij nemen controle */
  :global(body) * { visibility: hidden !important; }

  /* Alleen de sheet laten zien */
  .print-area,
  .print-area * {
    visibility: visible !important;
  }

  /* linksboven plaatsen */
  .print-area {
    position: absolute !important;
    left: 0 !important;
    top: 0 !important;
  }

  /* printsheet */
  .sheet {
    width: 210mm !important;
    height: 297mm !important;
    margin: 0 !important;
    border: none !important;
    overflow: visible !important;
    box-sizing: border-box !important;

    /* klein beetje schalen zodat onderkant nooit afkapt */
    transform: scale(var(--printScale, 0.985)) !important;
    transform-origin: top left !important;
  }

  /* rounding/overflow issues weg */
  .label-grid { height: auto !important; }
  .label { border: none !important; }

  /* Lufthansa kleuren (Background graphics AAN in Chrome) */
  .luf-left { background: #222 !important; }
  .luf-right,
  .luf-row,
  .luf-row.luf-split,
  .luf-foot-left { background: #2b2b2b !important; }
  .luf-right, .luf-right * { color: #fff !important; }
}


</style>
