<template>
  <div class="page">
    <h1 class="no-print">Etiketten</h1>

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

        <div class="setting" v-if="template === '2'">
          <label>Datum (Date of Production)</label>
          <input class="input" type="date" v-model="lufthansaIsoDate" />
          <p class="hint">Wordt geprint als: <strong>{{ lufthansaDateDots }}</strong></p>
        </div>

        <div class="setting" v-else>
          <label>Wat komt op het etiket?</label>

          <div class="chips">
            <label class="chip"><input type="checkbox" v-model="fields.klant" />Klantnaam</label>
            <label class="chip"><input type="checkbox" v-model="fields.orderRef" />Order + klanten ordernummer</label>
            <label class="chip"><input type="checkbox" v-model="fields.product" />Product</label>
            <label class="chip"><input type="checkbox" v-model="fields.formaat" />Formaat</label>
            <label class="chip"><input type="checkbox" v-model="fields.leverdatum" />Leverdatum</label>
            <label class="chip"><input type="checkbox" v-model="fields.artikel" />Artikelnummer</label>
            <label class="chip"><input type="checkbox" v-model="fields.status" />Status</label>
            <label class="chip"><input type="checkbox" v-model="fields.datum" />Datum (vandaag)</label>
            <label class="chip"><input type="checkbox" v-model="fields.doosnummer" />Doosnummer (auto)</label>

            <label class="chip"><input type="checkbox" v-model="fields.materiaal" />Materiaal</label>
            <label class="chip"><input type="checkbox" v-model="fields.dikte" />Dikte</label>
            <label class="chip"><input type="checkbox" v-model="fields.perforatie" />Perforatie</label>
            <label class="chip"><input type="checkbox" v-model="fields.stuksDoos" />Stuks/doos</label>
            <label class="chip"><input type="checkbox" v-model="fields.bundel" />Bundel (stuks)</label>
            <label class="chip"><input type="checkbox" v-model="fields.totaalStuks" />Totaal stuks</label>
            <label class="chip"><input type="checkbox" v-model="fields.dozenTotaal" />Totaal dozen</label>
            <label class="chip"><input type="checkbox" v-model="fields.beugel" />Beugel (maat/vorm)</label>
          </div>

          <div class="doos-settings" v-if="fields.doosnummer && (template === '8' || template === '16')">
            <div class="doos-row">
              <label>Start doosnummer</label>
              <input class="input" type="number" min="1" v-model.number="doosStart" />
            </div>
          </div>

          <div class="setting">
            <label>Extra tekst (optioneel)</label>
            <input
              class="input"
              type="text"
              v-model="extraText"
              placeholder="Bijv: LET OP: spoed..."
            />
          </div>
        </div>
      </div>

      <div class="print-correction-wrapper" v-if="template !== '2'">
        <h3>Hoogte-correctie handmatig per rij (in mm)</h3>
        <p class="hint" style="margin-top:-5px; margin-bottom:15px;">
          Positief getal schuift de rij omlaag, negatief (bijv. <code>-1.5</code>) schuift omhoog. Base-styling blijft behouden.
        </p>
        
        <div class="rows-grid">
          <div v-for="rNum in totalRows" :key="rNum" class="correction-item">
            <label :for="'row-offset-' + rNum">Rij {{ rNum }}:</label>
            <input 
              :id="'row-offset-' + rNum" 
              class="input offset-input" 
              type="number" 
              step="0.1" 
              v-model.number="rowOffsets[rNum - 1]" 
            />
          </div>
        </div>
      </div>
    </section>

    <section class="card no-print" v-if="template !== '2'">
      <h2>Kies order (Vult direct de hele pagina)</h2>
      <div class="setting">
        <select class="input" @change="fillAllSlotsWithOrder($event)">
          <option value="">-- Selecteer een order om alle etiketten te vullen --</option>
          <option v-for="o in orders" :key="o.order_id" :value="o.order_id">
            Order {{ o.order_id }} | Ref: {{ o.interne_referentie ?? "-" }} | {{ klantNaam(o.klant_id) }}
          </option>
        </select>
      </div>
    </section>

    <section class="card print-card">
      <h2 class="no-print">Preview</h2>

      <div class="preview-wrap">
        <div class="sheet print-area" :class="[`sheet-t${template}`]">
          <div class="label-grid" :class="gridClass">
            
            <div
              v-for="(_, idx) in slotsCount"
              :key="idx"
              class="label"
              :class="[fontClass]"
              @click="template !== '2' ? removeSlot(idx) : undefined"
            >
              
              <template v-if="template === '2'">
                <div class="lufthansa-wrapper">
                  <div class="lh-header">
                    <div class="lh-title">Lufthansa</div>
                    <div class="lh-subtitle">Supplied by De Ster GmbH</div>
                  </div>

                  <div class="lh-main-grid">
                    <div class="lh-left-col"></div>
                    <div class="lh-right-col">
                      <div class="lh-block border-b">
                        <div class="lh-value bold-text">Bakingbag for rolls large</div>
                        <div class="lh-caption">Article</div>
                      </div>
                      <div class="lh-split-row border-b">
                        <div class="lh-block border-r">
                          <div class="lh-value bold-text">1 000 pieces</div>
                          <div class="lh-caption">Quantity</div>
                        </div>
                        <div class="lh-block">
                          <div class="lh-value"></div>
                          <div class="lh-caption">Charge-Nr.</div>
                        </div>
                      </div>
                      <div class="lh-block border-b">
                        <div class="lh-value bold-text">350 × 550 mm</div>
                        <div class="lh-caption">Dimensions of Article (mm)</div>
                      </div>
                      <div class="lh-split-row border-b">
                        <div class="lh-block border-r">
                          <div class="lh-value bold-text">0,0064 kg</div>
                          <div class="lh-caption">Weight per piece</div>
                        </div>
                        <div class="lh-block">
                          <div class="lh-value bold-text">6,40 kg</div>
                          <div class="lh-caption">per box</div>
                        </div>
                      </div>
                      <div class="lh-split-row">
                        <div class="lh-block border-r">
                          <div class="lh-value bold-text">{{ lufthansaDateDots }}</div>
                          <div class="lh-caption">Date of Production</div>
                        </div>
                        <div class="lh-block">
                          <div class="lh-value bold-text">not applicable</div>
                          <div class="lh-caption">To be used before</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="lh-footer-grid">
                    <div class="lh-footer-left">
                      <div class="lh-value bold-text">Handle with care / Dry storage</div>
                      <div class="lh-caption">Handling Instructions</div>
                      <div class="lh-recycle-code">
                        <span class="recycle-icon">♻</span> 1042
                      </div>
                    </div>
                    <div class="lh-footer-right">
                      <div class="lh-value bold-text text-white">De Ster 363 0023</div>
                      <div class="lh-caption text-gray">De Ster-Art.-Nr.</div>
                    </div>
                  </div>
                </div>
              </template>

              <template v-else>
                <template v-if="slots[idx]">
                  <div class="label-content" :style="getRowOffsetStyle(idx)">
                    <div 
                      v-for="(line, i) in buildLines(slots[idx]!, idx)" 
                      :key="i" 
                      class="line"
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

const fields = reactive({
  klant: true, orderRef: true, product: true, formaat: false,
  leverdatum: true, artikel: false, status: false, datum: false,
  doosnummer: false, materiaal: false, dikte: false, perforatie: false,
  stuksDoos: false, bundel: true, totaalStuks: false, dozenTotaal: false, beugel: false,
});

const extraText = ref<string>("");
const doosStart = ref<number>(1);

// --- LUFTHANSA DATE VARS ---
const lufthansaIsoDate = ref<string>(new Date().toISOString().slice(0, 10));
const lufthansaDateDots = computed<string>(() => {
  if (!lufthansaIsoDate.value) return "-";
  const parts = lufthansaIsoDate.value.split("-");
  if (parts.length !== 3) return lufthansaIsoDate.value;
  const [y, m, d] = parts;
  return `${d}.${m}.${y}`;
});

const todayText = computed(() => {
  const iso = new Date().toISOString().slice(0, 10);
  const [y, m, d] = iso.split("-");
  return `${d}-${m}-${y}`;
});

// --- PER-RIJ HOOGTE CORRECTIE ---
const rowOffsets = ref<number[]>([]);

const totalRows = computed(() => {
  if (template.value === "8") return 4;
  if (template.value === "16") return 8;
  return 0; // Geen correcties voor template 2 nodig
});

watch(totalRows, (newRowsCount) => {
  rowOffsets.value = Array.from({ length: newRowsCount }, () => 0);
}, { immediate: true });

function getRowOffsetStyle(idx: number) {
  if (template.value === "2") return {}; // Voor de zekerheid extra check
  const rowIndex = Math.floor(idx / 2); // Omdat template 8 en 16 beide 2 kolommen hebben
  const offset = rowOffsets.value[rowIndex] || 0;
  
  if (offset === 0) return {};
  // Margin-top verandert niks aan jouw originele padding classes in CSS
  return { marginTop: `${offset}mm` };
}

// --- GRID & TEMPLATE LOGIC ---
const slotsCount = computed(() => {
  if (template.value === "2") return 2;
  if (template.value === "8") return 8;
  return 16;
});

const slots = ref<any[]>([]);
function resetSlotsForTemplate() {
  slots.value = Array.from({ length: slotsCount.value }, () => null);
}
watch(template, () => resetSlotsForTemplate(), { immediate: true });

const selectedFieldCount = computed(() => Object.values(fields).filter(Boolean).length);
const fontClass = computed(() => {
  if (template.value === "8" || template.value === "2") return "f-normal";
  if (selectedFieldCount.value <= 5) return "f-normal";
  if (selectedFieldCount.value <= 8) return "f-small";
  return "f-tiny";
});

const gridClass = computed(() => {
  if (template.value === "2") return "grid-2";
  if (template.value === "8") return "grid-8";
  return "grid-16";
});

// --- HELPER FUNCTIES ---
function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  const [y, m, d] = value.split("-");
  if (!y || !m || !d) return value;
  return `${d}-${m}-${y}`;
}

function klantNaam(id: number | null) {
  if (!id) return "-";
  const k = klanten.value.find((x) => x.klant_id === id);
  return k ? k.naam : `#${id}`;
}

// Vult direct alle etiketten op basis van dropdown selectie
function fillAllSlotsWithOrder(event: Event) {
  const target = event.target as HTMLSelectElement;
  const orderId = Number(target.value);
  if (!orderId) { clearSlots(); return; }

  const o = orders.value.find((x) => x.order_id === orderId);
  if (!o) return;

  const slot = {
    orderId: o.order_id,
    ref: o.klant_order_nummer ?? "-",
    klant: klantNaam(o.klant_id),
    product: o.product_naam ?? "-",
    formaat: o.formaat ?? "-",
    leverdatum: formatDate(o.geplande_lever_datum),
    artikel: o.klant_artikel_nummer ?? "-",
    status: String(o.status ?? "-"),
  };
  slots.value = Array.from({ length: slotsCount.value }, () => ({ ...slot }));
}

function removeSlot(index: number) { slots.value[index] = null; }
function clearSlots() { resetSlotsForTemplate(); }
function printSheet() { window.print(); }

onMounted(async () => {
  loading.value = true;
  try {
    orders.value = await getOrders();
    klanten.value = await getKlanten();
  } catch(e) { console.warn(e); }
  loading.value = false;
});

function buildLines(slot: any, idx: number) {
  const lines: string[] = [];
  if (fields.klant) lines.push(slot.klant);
  if (fields.orderRef) lines.push(`Order ${slot.orderId} · Klant order ${slot.ref}`);
  if (fields.product) lines.push(slot.product);
  if (fields.formaat) lines.push(`Formaat: ${slot.formaat}`);
  if (fields.leverdatum) lines.push(`Leverdatum: ${slot.leverdatum}`);
  if (fields.artikel) lines.push(`Art.nr: ${slot.artikel}`);
  if (fields.status) lines.push(`Status: ${slot.status}`);
  if (fields.datum) lines.push(`Datum: ${todayText.value}`);

  const order = orders.value.find((o) => o.order_id === slot.orderId);
  if (order) {
    if (fields.materiaal && order.materiaal) lines.push(`Mat: ${order.materiaal}`);
    if (fields.dikte && order.dikte_micron != null) lines.push(`Dikte: ${order.dikte_micron} µm`);
    if (fields.perforatie && order.perforatie_type) lines.push(`Perf: ${order.perforatie_type}`);
    if (fields.stuksDoos && order.stuks_per_doos != null) lines.push(`Doos: ${order.stuks_per_doos}`);
    if (fields.bundel && order.stuks_per_bundel != null) lines.push(`Bundel: ${order.stuks_per_bundel} st.`);
    if (fields.totaalStuks && order.totaal_aantal_stuks != null) lines.push(`Totaal: ${order.totaal_aantal_stuks}`);
    if (fields.dozenTotaal && order.stuks_per_doos && order.totaal_aantal_stuks) {
      lines.push(`Dozen: ${Math.ceil(order.totaal_aantal_stuks / order.stuks_per_doos)}`);
    }
    if (fields.beugel && (order.beugel_maat || order.beugel_vorm)) {
      lines.push(`Beugel: ${order.beugel_maat ?? "-"} / ${order.beugel_vorm ?? "-"}`);
    }
  }
  
  if (fields.doosnummer && (template.value === "8" || template.value === "16")) {
    lines.push(`Doosnummer: ${(doosStart.value || 1) + idx}`);
  }
  
  if (extraText.value.trim()) lines.push(extraText.value.trim());
  return lines;
}
</script>

<style scoped>
.page { max-width: 1100px; margin: 2rem auto; padding: 0 1rem 3rem; color: #f9fafb; }
h1 { font-size: 1.8rem; margin-bottom: 1.2rem; }
h2 { font-size: 1.1rem; margin-bottom: .75rem; }

.card { background: #fff; border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem; border: 1px solid #e5e7eb; color: #111827; }
.settings { display: grid; grid-template-columns: 1fr; gap: 1rem; margin-bottom: 1.5rem; }
@media (min-width: 900px) { .settings { grid-template-columns: 360px 1fr; align-items: start; } }

.setting label { font-weight: 600; display: block; margin-bottom: .4rem; }
select, .input { width: 100%; border-radius: 10px; border: 1px solid #d1d5db; padding: .5rem .6rem; background: #f3f4f6; }
.chips { display: flex; flex-wrap: wrap; gap: .5rem; }
.chip { display: inline-flex; align-items: center; gap: .45rem; background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 999px; padding: .35rem .6rem; font-size: .9rem; }
.doos-settings { margin-top: .8rem; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: .8rem; }
.doos-row { display: grid; grid-template-columns: 160px 1fr; gap: .8rem; align-items: center; }

/* Rij correctie paneel stijlen */
.print-correction-wrapper { padding-top: 1.2rem; border-top: 1px solid #e5e7eb; }
.print-correction-wrapper h3 { font-size: 1rem; margin-bottom: 0.2rem; color: #1f2937; }
.rows-grid { display: flex; flex-wrap: wrap; gap: 1rem; margin-top: 1rem; }
.correction-item { display: flex; align-items: center; gap: 0.5rem; background: #f9fafb; border: 1px solid #e5e7eb; padding: 0.4rem 0.8rem; border-radius: 8px; }
.correction-item label { font-weight: bold; font-size: 0.9rem; }
.offset-input { width: 75px; text-align: center; padding: 0.3rem; }

.toolbar { margin-top: .9rem; display: flex; gap: .6rem; justify-content: flex-end; }
button { border: none; border-radius: 999px; padding: .45rem 1rem; cursor: pointer; background: #e5e7eb; }
button.primary { background: #2563eb; color: #fff; }
.hint { margin-top: .75rem; font-size: .85rem; color: #4b5563; }
.preview-wrap { overflow-x: auto; padding-bottom: .5rem; line-height: 1.2; }

/* ===================== SHEET / GRID (JOUW CSS STRUCTUUR) ===================== */
.sheet { width: 210mm; height: 297mm; background: #fff; border: 1px dashed #e5e7eb; overflow: hidden; box-sizing: border-box; }
.label-grid { display: grid; width: 210mm; height: 297mm; align-content: start; }
.grid-16 { grid-template-columns: 105mm 105mm; grid-template-rows: repeat(8, 37mm); }
.grid-8 { grid-template-columns: 105mm 105mm; grid-template-rows: repeat(4, 74.25mm); }
.grid-2 { grid-template-columns: 210mm; grid-template-rows: repeat(2, 148.5mm); }

.label {
  box-sizing: border-box; color: #111827; user-select: none;
  border: 1px solid rgba(0,0,0,.05);
  padding-left: 4mm; padding-right: 4mm;
}
.grid-16 .label { width: 105mm; height: 37mm; padding-left: 3mm; padding-right: 3mm; }
.grid-8 .label { width: 105mm; height: 74.25mm; }

/* JOUW SPECIFIEKE PADDING CLASSES (ZORGVULDIG BEHOUDEN) */
.grid-16 .label.f-normal .label-content { box-sizing: border-box !important; padding-top: 6mm !important; }
.grid-16 .label.f-small .label-content { box-sizing: border-box !important; padding-top: 5mm !important; }
.grid-16 .label.f-tiny .label-content { box-sizing: border-box !important; padding-top: 4mm !important; }
.grid-8 .label.f-normal .label-content { box-sizing: border-box !important; padding-top: 7mm !important; }

/* Lufthansa label wrapper overrides (Nu met veilige marge rondom!) */
.grid-2 .label { 
  padding: 6mm 10mm !important; /* Boven/onder 6mm, links/rechts 10mm afstand tot de papierrand */
  border: none; 
}

.label-content { display: grid; grid-template-columns: 1fr 1fr; column-gap: 2mm; row-gap: 0.5mm; }
.line:nth-child(1), .line:nth-child(2), .line:nth-child(3) { grid-column: span 2; font-weight: bold; border-bottom: 0.2mm solid #eee; margin-bottom: 1px; }
.line { font-size: 9pt; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.empty { color: #9ca3af; display: flex; height: 100%; align-items: center; justify-content: center; }

.f-normal .line { font-size: 10pt; line-height: 1.3; }
.f-small .line { font-size: 9pt; line-height: 1.2; }
.f-tiny .line { font-size: 7.5pt; line-height: 1.1; }

/* ===================== LUFTHANSA TEMPLATE HTML STYLES ===================== */
.lufthansa-wrapper {
  width: 100%; height: 100%; display: flex; flex-direction: column;
  font-family: Arial, sans-serif; color: #000; box-sizing: border-box; border: 2px solid #000;
}
.lh-header { background: #000; color: #fff; text-align: center; padding: 12px 0; }
.lh-title { font-size: 20pt; font-weight: bold; letter-spacing: 1px; }
.lh-subtitle { font-size: 14pt; margin-top: 2px; }

/* GEBRUIK NU FR UNITS IN PLAATS VAN MM OM OVERFLOW EN LELIJK RECHTS-UITSTEKEN TE FIXEN! */
.lh-main-grid { display: grid; grid-template-columns: 75fr 135fr; flex-grow: 1; }
.lh-left-col { border-right: 2px solid #000; background: #fff; }
.lh-right-col { display: flex; flex-direction: column; }
.lh-block { padding: 8px 12px; display: flex; flex-direction: column; justify-content: center; flex-grow: 1; }
.lh-split-row { display: grid; grid-template-columns: 1fr 1fr; flex-grow: 1; }
.border-b { border-bottom: 2px solid #000; }
.border-r { border-right: 2px solid #000; }
.lh-value { font-size: 16pt; line-height: 1.2; min-height: 22px; }
.bold-text { font-weight: bold; font-size: 17pt; }
.lh-caption { font-size: 9pt; color: #333; margin-top: 3px; }

/* OOK HIER FR UNITS ZODAT ALLES PERFECT RECHTS LIJNT */
.lh-footer-grid { display: grid; grid-template-columns: 75fr 135fr; height: 35mm; border-top: 2px solid #000; }
.lh-footer-left { padding: 8px 12px; border-right: 2px solid #000; position: relative; }
.lh-footer-right { background: #000; color: #fff; padding: 12px; display: flex; flex-direction: column; justify-content: center; }
.text-white { color: #fff !important; font-size: 18pt; }
.text-gray { color: #ccc !important; }
.lh-recycle-code { margin-top: 12px; font-size: 13pt; color: #00a651; font-weight: bold; display: flex; align-items: center; gap: 4px; }

/* ===================== PRINT ===================== */
@media print {
  @page { size: A4; margin: 0; }
  :global(html), :global(body) {
    margin: 0 !important; padding: 0 !important; background: #fff !important;
    width: 210mm !important; height: 297mm !important;
    -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;
  }
  .no-print { display: none !important; }
  :global(body) * { visibility: hidden !important; }
  .print-area, .print-area * { visibility: visible !important; }
  .print-area { position: absolute !important; left: 0 !important; top: 0 !important; }
  
  .sheet { width: 210mm !important; height: 297mm !important; margin: 0 !important; border: none !important; box-sizing: border-box !important; }
  .label { border: none !important; }
}
</style>