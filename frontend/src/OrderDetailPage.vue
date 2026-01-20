<template>
  <div class="page" v-if="localOrder">
    <section class="card header-row">
      <div class="left">
        <button class="back-btn" @click="emit('back')">← Terug naar overzicht</button>
      </div>

      <div class="title">
        <h1>
          Orderdetails – #{{ localOrder.order_id }}
          <span v-if="displayKlantNaam">– {{ displayKlantNaam }}</span>
        </h1>
      </div>

      <div class="right">
        <!-- NEW: PRINT BUTTONS -->
        <button class="print-btn" @click="printWerkbon" :disabled="!localOrder">Print werkbon</button>
        <button class="confirm-btn" @click="printOrderbevestiging" :disabled="!localOrder">
          Orderbevestiging
        </button>

        <button v-if="!isEditing" class="edit-btn" @click="isEditing = true">Bewerken</button>
        <button v-if="!isEditing" class="delete-btn" @click="deleteOrderFn" :disabled="deleting">
          {{ deleting ? "Verwijderen..." : "Order verwijderen" }}
        </button>
      </div>
    </section>

    <!-- NEW: document velden (bewerken voor prints) -->
    <section class="card">
      <h2>Documentgegevens (Orderbevesteging)</h2>
      <div class="grid">
        <div class="field">
          <span class="label">Bedrukking</span>
          <input v-model="docFields.bedrukking" type="text" placeholder="bijv. 1 kleur / logo / geen" />
        </div>

        <div class="field">
          <span class="label">Stuks per beugel</span>
          <input v-model="docFields.stuksPerBeugel" type="text" placeholder="bijv. 23" />
        </div>

        <div class="field">
          <span class="label">Prijs per eenheid (€)</span>
          <input v-model.number="docFields.prijsPerEenheid" type="number" min="0" step="0.01" />
        </div>

        <div class="field">
          <span class="label">Extra omschrijving</span>
          <input v-model="docFields.extraOmschrijving" type="text" placeholder="komt extra op de bevestiging" />
        </div>

        <div class="field">
          <span class="label">Totaalprijs (€)</span>
          <span class="value">{{ formatMoney(totaalPrijs) }}</span>
        </div>
      </div>
    </section>

    <!-- VIEW -->
    <template v-if="!isEditing">
      <section class="card">
        <h2>Algemeen</h2>
        <div class="grid">
          <div class="field"><span class="label">Interne referentie</span><span class="value">{{ localOrder.interne_referentie ?? "-" }}</span></div>
          <div class="field"><span class="label">Klant</span><span class="value">{{ displayKlantNaam }} (ID: {{ localOrder.klant_id ?? "-" }})</span></div>
          <div class="field"><span class="label">Klant ordernr</span><span class="value">{{ localOrder.klant_order_nummer ?? "-" }}</span></div>
          <div class="field"><span class="label">Artikelnr klant</span><span class="value">{{ localOrder.klant_artikel_nummer ?? "-" }}</span></div>
          <div class="field"><span class="label">Orderdatum</span><span class="value">{{ localOrder.order_datum ?? "-" }}</span></div>
          <div class="field"><span class="label">Geplande leverdatum</span><span class="value">{{ localOrder.geplande_lever_datum ?? "-" }}</span></div>
          <div class="field"><span class="label">Status</span><span class="value">{{ localOrder.status ?? "-" }}</span></div>
        </div>
      </section>

      <section class="card">
        <h2>Productinformatie</h2>
        <div class="grid">
          <div class="field"><span class="label">Productnaam</span><span class="value">{{ localOrder.product_naam ?? "-" }}</span></div>
          <div class="field"><span class="label">Formaat</span><span class="value">{{ localOrder.formaat ?? "-" }}</span></div>
          <div class="field"><span class="label">Materiaal</span><span class="value">{{ localOrder.materiaal ?? "-" }}</span></div>
          <div class="field"><span class="label">Dikte (µm)</span><span class="value">{{ localOrder.dikte_micron ?? "-" }}</span></div>
          <div class="field"><span class="label">Stuks per doos</span><span class="value">{{ localOrder.stuks_per_doos ?? "-" }}</span></div>
          <div class="field"><span class="label">Totaal aantal stuks</span><span class="value">{{ localOrder.totaal_aantal_stuks ?? "-" }}</span></div>
          <div class="field"><span class="label">Geproduceerde dozen</span><span class="value">{{ localOrder.geproduceerde_dozen ?? 0 }}</span></div>
          <div class="field"><span class="label">Perforatie</span><span class="value">{{ localOrder.perforatie_type ?? "-" }}</span></div>
          <div class="field"><span class="label">Beugel maat</span><span class="value">{{ localOrder.beugel_maat ?? "-" }}</span></div>
          <div class="field"><span class="label">Beugel vorm</span><span class="value">{{ localOrder.beugel_vorm ?? "-" }}</span></div>
          <div class="field"><span class="label">Etiket formaat</span><span class="value">{{ localOrder.etiket_format ?? "-" }}</span></div>
          <div class="field"><span class="label">Rows per rol</span><span class="value">{{ localOrder.rows_per_rol ?? "-" }}</span></div>
          <div class="field"><span class="label">Rol gewicht (g)</span><span class="value">{{ localOrder.rollen_gewicht_gram ?? "-" }}</span></div>
          <div class="field"><span class="label">Rol lengte (m)</span><span class="value">{{ localOrder.rol_lengte ?? "-" }}</span></div>
        </div>
      </section>

      <section class="card">
        <h2>Notities</h2>
        <p>{{ localOrder.notities ?? "Geen notities." }}</p>
      </section>
    </template>

    <!-- EDIT -->
    <template v-else>
      <section class="card">
        <h2>Order bewerken</h2>

        <form class="form" @submit.prevent="saveChanges">
          <div class="grid">
            <div class="field"><span class="label">Interne referentie</span><input v-model="localOrder.interne_referentie" type="text" /></div>
            <div class="field"><span class="label">Klant ordernr</span><input v-model="localOrder.klant_order_nummer" type="text" /></div>
            <div class="field"><span class="label">Artikelnr klant</span><input v-model="localOrder.klant_artikel_nummer" type="text" /></div>
            <div class="field"><span class="label">Orderdatum</span><input v-model="localOrder.order_datum" type="date" /></div>
            <div class="field"><span class="label">Geplande leverdatum</span><input v-model="localOrder.geplande_lever_datum" type="date" /></div>

            <div class="field">
              <span class="label">Status</span>
              <select v-model="localOrder.status">
                <option value="OPEN">OPEN</option>
                <option value="IN_PRODUCTIE">IN_PRODUCTIE</option>
                <option value="KLAAR">KLAAR</option>
                <option value="GEANNULEERD">GEANNULEERD</option>
              </select>
            </div>

            <div class="field"><span class="label">Productnaam</span><input v-model="localOrder.product_naam" type="text" /></div>
            <div class="field"><span class="label">Formaat</span><input v-model="localOrder.formaat" type="text" /></div>
            <div class="field"><span class="label">Materiaal</span><input v-model="localOrder.materiaal" type="text" /></div>
            <div class="field"><span class="label">Dikte (µm)</span><input v-model.number="localOrder.dikte_micron" type="number" min="0" /></div>
            <div class="field"><span class="label">Stuks per doos</span><input v-model.number="localOrder.stuks_per_doos" type="number" min="0" /></div>
            <div class="field"><span class="label">Totaal aantal stuks</span><input v-model.number="localOrder.totaal_aantal_stuks" type="number" min="0" /></div>
            <div class="field"><span class="label">Geproduceerde dozen</span><input v-model.number="localOrder.geproduceerde_dozen" type="number" min="0" /></div>

            <div class="field"><span class="label">Perforatie type</span><input v-model="localOrder.perforatie_type" type="text" /></div>
            <div class="field"><span class="label">Beugel maat</span><input v-model="localOrder.beugel_maat" type="text" /></div>
            <div class="field"><span class="label">Beugel vorm</span><input v-model="localOrder.beugel_vorm" type="text" /></div>
            <div class="field"><span class="label">Etiket formaat</span><input v-model="localOrder.etiket_format" type="text" /></div>
            <div class="field"><span class="label">Rows per rol</span><input v-model.number="localOrder.rows_per_rol" type="number" min="0" /></div>
            <div class="field"><span class="label">Rol gewicht (g)</span><input v-model.number="localOrder.rollen_gewicht_gram" type="number" min="0" /></div>
            <div class="field"><span class="label">Rol lengte (m)</span><input v-model.number="localOrder.rol_lengte" type="number" min="0" /></div>
          </div>

          <div class="field full">
            <span class="label">Notities</span>
            <textarea v-model="localOrder.notities" rows="3"></textarea>
          </div>

          <div class="actions">
            <button type="submit" :disabled="saving">{{ saving ? "Opslaan..." : "Wijzigingen opslaan" }}</button>
            <button type="button" class="cancel-btn" @click="cancelEdit" :disabled="saving">Annuleren</button>
            <span v-if="error" class="error">{{ error }}</span>
            <span v-if="success" class="success">{{ success }}</span>
          </div>
        </form>
      </section>
    </template>
  </div>

  <div v-else class="page">
    <section class="card">
      <p>Geen order geselecteerd.</p>
      <button class="back-btn" @click="emit('back')">← Terug naar overzicht</button>
    </section>
  </div>

  <QualityCheckPanel v-if="localOrder" :order="localOrder" />
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { Order, Klant } from "./services/db";
import { getKlanten, updateOrder, deleteOrder } from "./services/db";
import QualityCheckPanel from "./QualityCheckPanel.vue";

const props = defineProps<{ order: Order | null }>();

const emit = defineEmits<{
  (e: "back"): void;
  (e: "updated", order: Order): void;
  (e: "deleted"): void;
}>();

const klanten = ref<Klant[]>([]);
const klantNaam = ref<string | null>(null);

const isEditing = ref(false);
const saving = ref(false);
const deleting = ref(false);
const error = ref<string | null>(null);
const success = ref<string | null>(null);

const localOrder = ref<Order | null>(null);

/** NEW: doc velden voor orderbevestiging (lokaal per order) */
const docFields = ref({
  bedrukking: "",
  stuksPerBeugel: "",
  prijsPerEenheid: 0,
  extraOmschrijving: "",
});

watch(
  () => props.order,
  async (newOrder) => {
    localOrder.value = newOrder ? { ...newOrder } : null;
    isEditing.value = false;
    error.value = null;
    success.value = null;

    if (!klanten.value.length) {
      try {
        klanten.value = await getKlanten();
      } catch {
        klanten.value = [];
      }
    }

    if (localOrder.value?.klant_id) {
      const k = klanten.value.find((x) => x.klant_id === localOrder.value!.klant_id);
      klantNaam.value = k ? k.naam : null;
    } else {
      klantNaam.value = null;
    }

    // load doc fields per order
    loadDocFields();
  },
  { immediate: true }
);

watch(
  docFields,
  () => {
    saveDocFields();
  },
  { deep: true }
);

const displayKlantNaam = computed(() => {
  if (!localOrder.value) return null;
  if (klantNaam.value) return klantNaam.value;
  return localOrder.value.klant_id ? `Klant #${localOrder.value.klant_id}` : "-";
});

const klantObj = computed<Klant | null>(() => {
  if (!localOrder.value?.klant_id) return null;
  return klanten.value.find((k) => k.klant_id === localOrder.value!.klant_id) ?? null;
});

const klantAdres = computed(() => {
  const k = klantObj.value;
  if (!k) return "";
  const parts = [
    k.straat && k.huisnummer ? `${k.straat} ${k.huisnummer}` : null,
    k.postcode && k.plaats ? `${k.postcode} ${k.plaats}` : null,
    k.land ? k.land : null,
  ].filter(Boolean);
  return parts.join(", ");
});

const totaalPrijs = computed(() => {
  const aantal = Number(localOrder.value?.totaal_aantal_stuks ?? 0);
  const prijs = Number(docFields.value.prijsPerEenheid ?? 0);
  if (!aantal || !prijs) return 0;
  return Math.round(aantal * prijs * 100) / 100;
});

function cancelEdit() {
  if (props.order) localOrder.value = { ...props.order };
  isEditing.value = false;
  error.value = null;
  success.value = null;
}

async function saveChanges() {
  if (!localOrder.value) return;

  saving.value = true;
  error.value = null;
  success.value = null;

  try {
    const patch = {
      interne_referentie: localOrder.value.interne_referentie ?? null,
      klant_order_nummer: localOrder.value.klant_order_nummer ?? null,
      klant_artikel_nummer: localOrder.value.klant_artikel_nummer ?? null,
      order_datum: localOrder.value.order_datum ?? null,
      geplande_lever_datum: localOrder.value.geplande_lever_datum ?? null,
      status: (localOrder.value.status ?? "OPEN") as any,

      product_naam: localOrder.value.product_naam ?? null,
      formaat: localOrder.value.formaat ?? null,
      materiaal: localOrder.value.materiaal ?? null,
      dikte_micron: localOrder.value.dikte_micron ?? 0,

      stuks_per_doos: localOrder.value.stuks_per_doos ?? 0,
      totaal_aantal_stuks: localOrder.value.totaal_aantal_stuks ?? 0,
      geproduceerde_dozen: localOrder.value.geproduceerde_dozen ?? 0,

      perforatie_type: localOrder.value.perforatie_type ?? null,
      beugel_maat: localOrder.value.beugel_maat ?? null,
      beugel_vorm: localOrder.value.beugel_vorm ?? null,
      etiket_format: localOrder.value.etiket_format ?? null,

      rows_per_rol: localOrder.value.rows_per_rol ?? 0,
      rollen_gewicht_gram: localOrder.value.rollen_gewicht_gram ?? 0,
      rol_lengte: localOrder.value.rol_lengte ?? 0,

      notities: localOrder.value.notities ?? null,
    };

    const updated = await updateOrder(localOrder.value.order_id, patch);
    localOrder.value = { ...updated };
    emit("updated", updated);

    isEditing.value = false;
    success.value = "Order bijgewerkt";
  } catch (e: any) {
    console.error(e);
    error.value = e?.message ?? "Kon order niet bijwerken";
  } finally {
    saving.value = false;
  }
}

async function deleteOrderFn() {
  if (!localOrder.value) return;

  const sure = window.confirm(`Weet je zeker dat je order #${localOrder.value.order_id} wilt verwijderen?`);
  if (!sure) return;

  deleting.value = true;
  error.value = null;
  success.value = null;

  try {
    await deleteOrder(localOrder.value.order_id);
    emit("deleted");
  } catch (e: any) {
    console.error(e);
    error.value = e?.message ?? "Kon order niet verwijderen";
  } finally {
    deleting.value = false;
  }
}

/* ------------------ PRINT HELPERS ------------------ */

function escapeHtml(input: any) {
  const s = String(input ?? "");
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  const [y, m, d] = String(value).split("-");
  if (!y || !m || !d) return String(value);
  return `${d}-${m}-${y}`;
}

function formatMoney(n: number) {
  return (Number(n) || 0).toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function openPrintWindow(title: string, bodyHtml: string) {
  const w = window.open("", "_blank", "width=900,height=1000");
  if (!w) return;

  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    @page { size: A4; margin: 12mm; }
    body { font-family: Arial, Helvetica, sans-serif; color:#000; background:#fff; margin:0; }
    h1,h2 { margin: 0 0 8px 0; }
    .muted { color:#444; font-size:12px; }
    .row { display:flex; gap:16px; justify-content:space-between; }
    .box { border:1px solid #000; padding:10px; border-radius:6px; }
    table { width:100%; border-collapse:collapse; font-size:12px; }
    th, td { border:1px solid #000; padding:6px; vertical-align:top; }
    th { background:#eee; text-align:left; }
    .no-border td { border:none; padding:2px 0; }
    .right { text-align:right; }
    .title { text-align:center; letter-spacing:2px; margin:12px 0; }
    .spacer { height:10px; }
  </style>
</head>
<body>
${bodyHtml}
</body>
</html>`;

  w.document.open();
  w.document.write(html);
  w.document.close();

  // Wachten tot window ready is, dan printen
  w.onload = () => {
    setTimeout(() => {
      try {
        w.focus();
        w.print();
      } catch {}
    }, 50);
  };
}


/** 1) Werkbon voor operators */
function printWerkbon() {
  if (!localOrder.value) return;

  const o = localOrder.value;
  const klantNaamText = displayKlantNaam.value ?? "-";
  const adres = klantAdres.value || "-";

  const stuks = Number(o.totaal_aantal_stuks ?? 0);
  const perDoos = Number(o.stuks_per_doos ?? 0);
  const dozen = stuks && perDoos ? Math.ceil(stuks / perDoos) : "-";

  const html = `
    <div class="box">
      <div class="row">
        <div>
          <h2>PETERS VERPAKKINGEN B.V.</h2>
          <div class="muted">Werkbon (operators)</div>
        </div>
        <div class="right">
          <div><b>Order #</b> ${escapeHtml(o.order_id)}</div>
          <div><b>Ref</b> ${escapeHtml(o.interne_referentie ?? "-")}</div>
          <div><b>Leverdatum</b> ${escapeHtml(formatDate(o.geplande_lever_datum))}</div>
        </div>
      </div>

      <div class="spacer"></div>

      <div class="row">
        <div class="box" style="flex:1;">
          <b>Klant</b><br/>
          ${escapeHtml(klantNaamText)}<br/>
          ${escapeHtml(adres)}
        </div>
        <div class="box" style="flex:1;">
          <b>Product</b><br/>
          ${escapeHtml(o.product_naam ?? "-")}<br/>
          <span class="muted">Formaat:</span> ${escapeHtml(o.formaat ?? "-")}<br/>
          <span class="muted">Materiaal/dikte:</span> ${escapeHtml(o.materiaal ?? "-")} / ${escapeHtml(o.dikte_micron ?? "-")} µm<br/>
          <span class="muted">Perforatie:</span> ${escapeHtml(o.perforatie_type ?? "-")}<br/>
          <span class="muted">Beugel:</span> ${escapeHtml(o.beugel_vorm ?? "-")} (${escapeHtml(o.beugel_maat ?? "-")})
        </div>
      </div>

      <div class="spacer"></div>

      <table>
        <thead>
          <tr>
            <th>Aantal stuks</th>
            <th>Stuks per doos</th>
            <th>Totaal dozen</th>
            <th>Geproduceerde dozen</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${escapeHtml(stuks || "-")}</td>
            <td>${escapeHtml(perDoos || "-")}</td>
            <td>${escapeHtml(dozen)}</td>
            <td>${escapeHtml(o.geproduceerde_dozen ?? 0)}</td>
            <td>${escapeHtml(o.status ?? "-")}</td>
          </tr>
        </tbody>
      </table>

      <div class="spacer"></div>

      <div class="box">
        <b>Notities</b><br/>
        ${escapeHtml(o.notities ?? "Geen notities.")}
      </div>

      <div class="spacer"></div>
    </div>
  `;

  openPrintWindow(`Werkbon Order #${o.order_id}`, html);
}

/** 2) Orderbevestiging (jouw PDF velden) */
function printOrderbevestiging() {
  if (!localOrder.value) return;

  const o = localOrder.value;

  const html = `
    <div class="box">
      <h2 style="text-align:center;">Orderbevestiging</h2>

      <table class="no-border" style="width:100%; margin-top:6px;">
        <tr>
          <td><b>Ordernummer</b></td><td>${escapeHtml(o.interne_referentie ?? o.order_id)}</td>
          <td class="right"><b>Order datum</b></td><td class="right">${escapeHtml(formatDate(o.order_datum))}</td>
        </tr>
        <tr>
          <td><b>Art. # klant</b></td><td>${escapeHtml(o.klant_artikel_nummer ?? "-")}</td>
          <td class="right"><b>Order leverdatum</b></td><td class="right">${escapeHtml(formatDate(o.geplande_lever_datum))}</td>
        </tr>
      </table>

      <div class="spacer"></div>

      <div class="row">
        <div class="box" style="flex:1;">
          <b>Klant</b><br/>
          ${escapeHtml(displayKlantNaam.value ?? "-")}<br/>
          ${escapeHtml(klantAdres.value || "-")}
        </div>

        <div class="box" style="flex:1;">
          <b>Bedrukking</b><br/>
          ${escapeHtml(docFields.value.bedrukking || "-")}<br/>
          ${docFields.value.extraOmschrijving ? `<div class="muted">${escapeHtml(docFields.value.extraOmschrijving)}</div>` : ""}
        </div>
      </div>

      <div class="spacer"></div>

      <table>
        <thead>
          <tr>
            <th>Produkt ID</th>
            <th>Product type</th>
            <th>Materiaal en dikte</th>
            <th>Formaat</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${escapeHtml(o.klant_artikel_nummer ?? o.interne_referentie ?? o.order_id)}</td>
            <td>${escapeHtml(o.product_naam ?? "-")}</td>
            <td>${escapeHtml(o.materiaal ?? "-")} ${escapeHtml(o.dikte_micron ?? "-")} µm</td>
            <td>${escapeHtml(o.formaat ?? "-")}</td>
          </tr>
        </tbody>
      </table>

      <div class="spacer"></div>

      <table>
        <thead>
          <tr>
            <th>Order aantal</th>
            <th>Stuks per doos</th>
            <th>Perforatie</th>
            <th>Beugel</th>
            <th>Stuks per beugel</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${escapeHtml(o.totaal_aantal_stuks ?? "-")}</td>
            <td>${escapeHtml(o.stuks_per_doos ?? "-")}</td>
            <td>${escapeHtml(o.perforatie_type ?? "-")}</td>
            <td>${escapeHtml(o.beugel_vorm ?? "-")} (${escapeHtml(o.beugel_maat ?? "-")})</td>
            <td>${escapeHtml(docFields.value.stuksPerBeugel || "-")}</td>
          </tr>
        </tbody>
      </table>

      <div class="spacer"></div>

      <table>
        <thead>
          <tr>
            <th>Prijs per eenheid</th>
            <th>Prijs totaal</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>€ ${escapeHtml(formatMoney(Number(docFields.value.prijsPerEenheid || 0)))}</td>
            <td>€ ${escapeHtml(formatMoney(totaalPrijs.value))}</td>
          </tr>
        </tbody>
      </table>

      <div class="spacer"></div>

      <div class="muted">
        Dit document is gegenereerd vanuit het orderprogramma.
      </div>
    </div>
  `;

  openPrintWindow(`Orderbevestiging Order #${o.order_id}`, html);
}

/* ------------------ DOCFIELDS STORAGE ------------------ */

function docKey() {
  const id = localOrder.value?.order_id;
  return id ? `docFields:${id}` : null;
}

function loadDocFields() {
  const key = docKey();
  if (!key) return;

  try {
    const raw = localStorage.getItem(key);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    docFields.value = {
      bedrukking: parsed?.bedrukking ?? "",
      stuksPerBeugel: parsed?.stuksPerBeugel ?? "",
      prijsPerEenheid: Number(parsed?.prijsPerEenheid ?? 0),
      extraOmschrijving: parsed?.extraOmschrijving ?? "",
    };
  } catch {
    // ignore
  }
}

function saveDocFields() {
  const key = docKey();
  if (!key) return;

  try {
    localStorage.setItem(key, JSON.stringify(docFields.value));
  } catch {
    // ignore
  }
}
</script>

<style scoped>
/* jouw bestaande styles */
.card {
  background: #ffffff;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.06);
  border: 1px solid #e5e7eb;
  color: #111827;
}

.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.left,
.right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

h1 {
  font-size: 1.4rem;
  margin: 0;
  color: #f9fafb;
}

h2 {
  font-size: 1.2rem;
  margin-bottom: 1rem;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 0.75rem 1rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.label {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #6b7280;
}

.value {
  font-size: 0.95rem;
}

.back-btn,
.edit-btn,
.delete-btn,
.cancel-btn,
.print-btn,
.confirm-btn {
  border-radius: 999px;
  border: 1px solid #4b5563;
  padding: 0.35rem 0.9rem;
  font-size: 0.85rem;
  cursor: pointer;
}

.back-btn {
  background: #111827;
  color: #e5e7eb;
}
.back-btn:hover {
  background: #1f2937;
}

.edit-btn {
  background: #2563eb;
  border-color: #2563eb;
  color: #e5e7eb;
}
.edit-btn:hover {
  background: #1d4ed8;
}

.delete-btn {
  background: #b91c1c;
  border-color: #b91c1c;
  color: #fee2e2;
}
.delete-btn:hover {
  background: #991b1b;
}

.print-btn {
  background: #0f172a;
  color: #e5e7eb;
}
.print-btn:hover {
  background: #111827;
}

.confirm-btn {
  background: #16a34a;
  border-color: #16a34a;
  color: #eaffea;
}
.confirm-btn:hover {
  background: #15803d;
}

.cancel-btn {
  background: #e5e7eb;
  border-color: #d1d5db;
  color: #111827;
}
.cancel-btn:hover {
  background: #d1d5db;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

input,
textarea,
select {
  border-radius: 8px;
  border: 1px solid #d1d5db;
  padding: 0.45rem 0.6rem;
  font-size: 0.9rem;
  background: #f3f4f6;
  color: #111827;
}

input:focus,
textarea:focus,
select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 1px #3b82f6;
  background: #ffffff;
}

.full {
  width: 100%;
}

.actions {
  margin-top: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.error {
  color: #b91c1c;
  font-size: 0.85rem;
}

.success {
  color: #166534;
  font-size: 0.85rem;
}
</style>
