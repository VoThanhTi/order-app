<template>
  <div class="page" v-if="localOrder">
    <section class="card header-row">
      <div class="left">
        <button class="back-btn" @click="emit('back')">← Terug naar overzicht</button>
      </div>

      <div class="title">
        <h1 style="color: #111827">
          Orderdetails – #{{ localOrder.order_id }}
          <span v-if="displayKlantNaam">– {{ displayKlantNaam }}</span>
        </h1>
      </div>

      <div class="right">
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

    <section class="card">
      <h2>Prijsinstellingen (voor bevestiging)</h2>
      <div class="grid">
        <div class="field">
          <span class="label">Eenheid type</span>
          <select v-model="docFields.prijsEenheidType">
            <option value="per 1.000 stuks">per 1.000 stuks</option>
            <option value="per Kg">per Kg</option>
            <option value="per 1 m2">per 1 m2</option>
          </select>
        </div>

        <div class="field">
          <span class="label">Aantal (x)</span>
          <input v-model.number="docFields.berekenAantal" type="number" step="0.01" placeholder="bijv. 12" />
        </div>

        <div class="field">
          <span class="label">Prijs per eenheid (€)</span>
          <input v-model.number="docFields.prijsPerEenheid" type="number" min="0" step="0.01" />
        </div>

        <div class="field">
          <span class="label">Totaalprijs (€)</span>
          <span class="value" style="font-weight: bold; color: #16a34a; font-size: 1.1rem;">
            € {{ formatMoney(totaalPrijs) }}
          </span>
        </div>

        <div class="field full">
          <span class="label">Extra omschrijving op bevestiging</span>
          <input v-model="docFields.extraOmschrijving" type="text" placeholder="Extra tekst onderaan de bevestiging..." />
        </div>
      </div>
    </section>

    <template v-if="!isEditing">
      <section class="card">
        <h2>Algemeen</h2>
        <div class="grid">
          <div class="field"><span class="label">Interne referentie</span><span class="value">{{ localOrder.interne_referentie ?? "-" }}</span></div>
          <div class="field"><span class="label">Klant</span><span class="value">{{ displayKlantNaam }}</span></div>
          <div class="field"><span class="label">Klant ordernr</span><span class="value">{{ localOrder.klant_order_nummer ?? "-" }}</span></div>
          <div class="field"><span class="label">Artikelnr klant</span><span class="value">{{ localOrder.klant_artikel_nummer ?? "-" }}</span></div>
          <div class="field"><span class="label">Orderdatum</span><span class="value">{{ formatDate(localOrder.order_datum) }}</span></div>
          <div class="field"><span class="label">Geplande leverdatum</span><span class="value">{{ formatDate(localOrder.geplande_lever_datum) }}</span></div>
          <div class="field"><span class="label">Status</span><span class="value">{{ localOrder.status ?? "-" }}</span></div>
        </div>
      </section>

      <section class="card">
        <h2>Productinformatie</h2>
        <div class="grid">
          <div class="field"><span class="label">Productnaam</span><span class="value">{{ localOrder.product_naam ?? "-" }}</span></div>
          <div class="field"><span class="label">Product Type</span><span class="value">{{ localOrder.product_type ?? "-" }}</span></div>
          
          <div class="field"><span class="label">Formaat</span><span class="value">{{ localOrder.formaat ?? "-" }}</span></div>
          <div class="field"><span class="label">Materiaal</span><span class="value">{{ localOrder.materiaal ?? "-" }}</span></div>
          <div class="field"><span class="label">Dikte (µm)</span><span class="value">{{ localOrder.dikte_micron ?? "-" }}</span></div>
          <div class="field"><span class="label">Bedrukking</span><span class="value">{{ localOrder.bedrukking || "Geen" }}</span></div>
          
          <div class="field"><span class="label">Perforatie</span><span class="value">{{ localOrder.perforatie_type ?? "-" }}</span></div>
          <div class="field"><span class="label">Beugel</span><span class="value">{{ localOrder.beugel_vorm }} ({{ localOrder.beugel_maat }})</span></div>
          
          <div class="field"><span class="label">Stuks per doos</span><span class="value">{{ localOrder.stuks_per_doos ?? "-" }}</span></div>
          <div class="field"><span class="label">Stuks per bundel</span><span class="value">{{ localOrder.stuks_per_bundel ?? "-" }}</span></div> 
          <div class="field"><span class="label">Totaal aantal stuks</span><span class="value">{{ localOrder.totaal_aantal_stuks ?? "-" }}</span></div>
          
          <div class="field"><span class="label">Pallet Type</span><span class="value">{{ localOrder.pallet_type ?? "-" }}</span></div>
          <div class="field"><span class="label">Totaal per pallet</span><span class="value">{{ localOrder.totaal_per_pallet ?? "-" }}</span></div>

          <div class="field"><span class="label">Etiket formaat</span><span class="value">{{ localOrder.etiket_format ?? "-" }}</span></div>
          <div class="field"><span class="label">Rol gewicht / Lengte / Rows</span><span class="value">{{ localOrder.rollen_gewicht_gram }}g / {{ localOrder.rol_lengte }}m / {{ localOrder.rows_per_rol }}</span></div>
        </div>
      </section>

      <section class="card">
        <h2>Notities</h2>
        <p>{{ localOrder.notities ?? "Geen notities." }}</p>
      </section>
    </template>

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
            <div class="field"><span class="label">Product Type</span><input v-model="localOrder.product_type" type="text" placeholder="bv. Beugelzak" /></div>
            
            <div class="field"><span class="label">Formaat</span><input v-model="localOrder.formaat" type="text" /></div>
            <div class="field"><span class="label">Materiaal</span><input v-model="localOrder.materiaal" type="text" /></div>
            <div class="field"><span class="label">Dikte (µm)</span><input v-model.number="localOrder.dikte_micron" type="number" min="0" /></div>
            <div class="field"><span class="label">Bedrukking</span><input v-model="localOrder.bedrukking" type="text" /></div>

            <div class="field"><span class="label">Stuks per doos</span><input v-model.number="localOrder.stuks_per_doos" type="number" min="0" /></div>
            <div class="field"><span class="label">Stuks per bundel</span><input v-model.number="localOrder.stuks_per_bundel" type="number" min="0" /></div>
            <div class="field"><span class="label">Totaal aantal stuks</span><input v-model.number="localOrder.totaal_aantal_stuks" type="number" min="0" /></div>
            <div class="field"><span class="label">Geproduceerde dozen</span><input v-model.number="localOrder.geproduceerde_dozen" type="number" min="0" /></div>

            <div class="field"><span class="label">Pallet Type</span><input v-model="localOrder.pallet_type" type="text" placeholder="bv. Europallet" /></div>
            <div class="field"><span class="label">Totaal per pallet</span><input v-model.number="localOrder.totaal_per_pallet" type="number" min="0" /></div>

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
            <button type="submit" :disabled="saving" class="confirm-btn">{{ saving ? "Opslaan..." : "Wijzigingen opslaan" }}</button>
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

/** Document velden voor orderbevestiging */
const docFields = ref({
  prijsEenheidType: "per 1.000 stuks",
  berekenAantal: 0,
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

    // Doc fields inladen en default aantal berekenen
    loadDocFields();
    if (localOrder.value && docFields.value.berekenAantal === 0) {
        // Slimme default: als het 1000 stuks is, deel door 1000
        const totaal = localOrder.value.totaal_aantal_stuks || 0;
        docFields.value.berekenAantal = totaal > 0 ? totaal / 1000 : 0;
    }
  },
  { immediate: true }
);

watch(docFields, () => saveDocFields(), { deep: true });

const displayKlantNaam = computed(() => {
  if (!localOrder.value) return null;
  if (klantNaam.value) return klantNaam.value;
  return localOrder.value.klant_id ? `Klant #${localOrder.value.klant_id}` : "-";
});

const klantObj = computed<Klant | null>(() => {
  if (!localOrder.value?.klant_id) return null;
  return klanten.value.find((k) => k.klant_id === localOrder.value!.klant_id) ?? null;
});

const totaalPrijs = computed(() => {
  const aantal = Number(docFields.value.berekenAantal ?? 0);
  const prijs = Number(docFields.value.prijsPerEenheid ?? 0);
  if (!aantal || !prijs) return 0;
  return Math.round(aantal * prijs * 100) / 100;
});

/* --------------- CRUD ACTIES --------------- */

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
      product_type: localOrder.value.product_type ?? null, // NIEUW
      formaat: localOrder.value.formaat ?? null,
      materiaal: localOrder.value.materiaal ?? null,
      dikte_micron: localOrder.value.dikte_micron ?? 0,
      bedrukking: localOrder.value.bedrukking ?? null,

      stuks_per_doos: localOrder.value.stuks_per_doos ?? 0,
      stuks_per_bundel: localOrder.value.stuks_per_bundel ?? 0,
      totaal_aantal_stuks: localOrder.value.totaal_aantal_stuks ?? 0,
      geproduceerde_dozen: localOrder.value.geproduceerde_dozen ?? 0,
      
      pallet_type: localOrder.value.pallet_type ?? null, // NIEUW
      totaal_per_pallet: localOrder.value.totaal_per_pallet ?? 0, // NIEUW

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
  try {
    await deleteOrder(localOrder.value.order_id);
    emit("deleted");
  } catch (e: any) {
    error.value = e?.message ?? "Kon order niet verwijderen";
  } finally {
    deleting.value = false;
  }
}

/* ------------------ PRINT FUNCTIES ------------------ */

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
  return (y && m && d) ? `${d}-${m}-${y}` : String(value);
}

function formatMoney(n: number) {
  return (Number(n) || 0).toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function openPrintWindow(title: string, bodyHtml: string) {
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(`
    <!doctype html>
    <html>
    <head>
      <title>${escapeHtml(title)}</title>
      <style>
        @page { size: A4; margin: 12mm; }
        body { font-family: Arial, Helvetica, sans-serif; color:#000; background:#fff; margin:0; }
        h1,h2 { margin: 0 0 5px 0; }
        .muted { color:#444; font-size:11px; }
        .row { display:flex; gap:16px; justify-content:space-between; }
        .box { border:1px solid #000; padding:10px; border-radius:4px; }
        table { width:100%; border-collapse:collapse; font-size:12px; margin-top:8px; }
        th, td { border:1px solid #000; padding:6px; vertical-align:top; text-align:left; }
        th { background:#eee; }
        .no-border td { border:none; padding:2px 0; }
        .right { text-align:right; }
        .spacer { height:15px; }
      </style>
    </head>
    <body>
      ${bodyHtml}
      <script>
         setTimeout(() => { window.print(); }, 500);
      <\/script>
    </body>
    </html>
  `);
  w.document.close();
}

/** 1) WERKBON (Fixed) */
function printWerkbon() {
  if (!localOrder.value) return;
  const o = localOrder.value;
  // Veilig ophalen gegevens (ook als klantenlijst nog laadt)
  const kNaam = displayKlantNaam.value || "Onbekend";
  const kObj = klantObj.value;
  const adres = kObj 
    ? [kObj.straat, kObj.huisnummer, kObj.postcode, kObj.plaats].filter(Boolean).join(" ")
    : "";

  const stuks = Number(o.totaal_aantal_stuks ?? 0);
  const perDoos = Number(o.stuks_per_doos ?? 0);
  const dozen = (stuks && perDoos) ? Math.ceil(stuks / perDoos) : "-";

  const html = `
    <div class="box">
      <div class="row">
        <div>
          <h2>PETERS VERPAKKINGEN B.V.</h2>
          <div class="muted">Werkbon (Interne Productie)</div>
        </div>
        <div class="right">
          <div><b>Order #</b> ${escapeHtml(o.order_id)}</div>
          <div><b>Ref:</b> ${escapeHtml(o.interne_referentie ?? "-")}</div>
        </div>
      </div>
      <div class="spacer"></div>
      <div class="row">
        <div class="box" style="flex:1;">
          <b>Klant</b><br/>
          ${escapeHtml(kNaam)}<br/>
          <span class="muted">${escapeHtml(adres)}</span>
        </div>
        <div class="box" style="flex:1;">
          <b>Product</b><br/>
          ${escapeHtml(o.product_naam ?? "-")}<br/>
          Type: ${escapeHtml(o.product_type ?? "-")}<br/>
          Formaat: ${escapeHtml(o.formaat ?? "-")}<br/>
          Materiaal: ${escapeHtml(o.materiaal ?? "-")} (${escapeHtml(o.dikte_micron ?? "-")} µm)
        </div>
      </div>
      <div class="spacer"></div>
      
      <table>
        <thead>
           <tr><th>Bedrukking</th><th>Perforatie</th><th>Beugel</th><th>Etiket</th></tr>
        </thead>
        <tbody>
           <tr>
             <td>${escapeHtml(o.bedrukking || "Geen")}</td>
             <td>${escapeHtml(o.perforatie_type || "-")}</td>
             <td>${escapeHtml(o.beugel_vorm || "-")} (${escapeHtml(o.beugel_maat || "-")})</td>
             <td>${escapeHtml(o.etiket_format || "-")}</td>
           </tr>
        </tbody>
      </table>

      <table>
        <thead>
          <tr>
            <th>Totaal stuks</th>
            <th>Inhoud doos</th>
            <th>Dozen (calc)</th>
            <th>Pallet Type</th>
            <th>Stuks/Pallet</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><b>${escapeHtml(stuks)}</b></td>
            <td>${escapeHtml(perDoos)} st/ds</td>
            <td>${escapeHtml(dozen)}</td>
            <td>${escapeHtml(o.pallet_type || "-")}</td>
            <td>${escapeHtml(o.totaal_per_pallet || "-")}</td>
          </tr>
        </tbody>
      </table>

      <div class="spacer"></div>
      <div class="box">
        <b>Notities:</b><br/>
        ${escapeHtml(o.notities ?? "Geen bijzonderheden.")}
      </div>
      <div class="spacer"></div>
      <div class="muted">Geprint op: ${new Date().toLocaleString()}</div>
    </div>
  `;
  openPrintWindow(`Werkbon #${o.order_id}`, html);
}

/** 2) ORDERBEVESTIGING */
function printOrderbevestiging() {
  if (!localOrder.value) return;
  const o = localOrder.value;
  const kObj = klantObj.value;

  const html = `
    <div style="padding:10px;">
      <div class="row">
        <div>
          <h2 style="margin:0;">PETERS VERPAKKINGEN B.V.</h2>
          <div style="font-size:11px; line-height:1.4;">
            Groothandelsmarkt 5, 1681 NS Zwaagdijk-Oost<br/>
            Tel: 072-5612404 · E-mail: info@thermobag.com
          </div>
        </div>
        <div class="right">
          <h2 style="margin:0; color:#444;">ORDERBEVESTIGING</h2>
          <div style="font-size:12px;">Datum: ${new Date().toLocaleDateString()}</div>
        </div>
      </div>

      <hr style="margin:15px 0; border:0; border-top:1px solid #000;" />

      <div class="row">
        <div class="box" style="width:48%;">
          <div class="muted">Klant:</div>
          <b>${escapeHtml(displayKlantNaam.value)}</b><br/>
          ${escapeHtml(kObj?.straat || "")} ${escapeHtml(kObj?.huisnummer || "")}<br/>
          ${escapeHtml(kObj?.postcode || "")} ${escapeHtml(kObj?.plaats || "")}<br/>
          ${escapeHtml(kObj?.land || "")}
        </div>
        <div class="box" style="width:48%;">
          <table class="no-border" style="width:100%; font-size:12px;">
             <tr><td><b>Uw referentie:</b></td><td>${escapeHtml(o.klant_order_nummer || "-")}</td></tr>
             <tr><td><b>Ons ordernr:</b></td><td>${escapeHtml(o.interne_referentie || o.order_id)}</td></tr>
             <tr><td><b>Orderdatum:</b></td><td>${formatDate(o.order_datum)}</td></tr>
             <tr><td><b>Leverdatum:</b></td><td>${formatDate(o.geplande_lever_datum)}</td></tr>
          </table>
        </div>
      </div>

      <div class="spacer"></div>

      <table>
        <thead>
          <tr>
            <th>Productomschrijving</th>
            <th>Type</th>
            <th>Specificaties</th>
            <th>Aantal</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <b>${escapeHtml(o.product_naam)}</b><br/>
              <span class="muted">Bedrukking:</span> ${escapeHtml(o.bedrukking || "Geen")}
            </td>
            <td>${escapeHtml(o.product_type || "-")}</td>
            <td>
               ${escapeHtml(o.materiaal)} ${escapeHtml(o.dikte_micron)}µm<br/>
               ${escapeHtml(o.formaat)}
            </td>
            <td>${escapeHtml(o.totaal_aantal_stuks)} stuks</td>
          </tr>
        </tbody>
      </table>

      <div class="spacer"></div>

      <table>
        <thead>
          <tr>
            <th>Omschrijving eenheid</th>
            <th>Aantal eenheden</th>
            <th>Prijs per eenheid</th>
            <th>Totaal</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${escapeHtml(docFields.value.prijsEenheidType)}</td>
            <td>${escapeHtml(docFields.value.berekenAantal)}</td>
            <td>€ ${formatMoney(docFields.value.prijsPerEenheid)}</td>
            <td style="font-weight:bold;">€ ${formatMoney(totaalPrijs.value)}</td>
          </tr>
        </tbody>
      </table>

      ${docFields.value.extraOmschrijving ? `
        <div class="spacer"></div>
        <div class="box">
           <div class="muted">Opmerking:</div>
           ${escapeHtml(docFields.value.extraOmschrijving)}
        </div>
      ` : ''}

      <div style="margin-top:40px; text-align:center; font-size:11px;">
        Wij danken u voor uw order!
      </div>
    </div>
  `;
  openPrintWindow(`Bevestiging #${o.order_id}`, html);
}

/* ------------------ STORAGE LOGIC ------------------ */

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
      prijsEenheidType: parsed.prijsEenheidType ?? "per 1.000 stuks",
      berekenAantal: Number(parsed.berekenAantal ?? 0),
      prijsPerEenheid: Number(parsed.prijsPerEenheid ?? 0),
      extraOmschrijving: parsed.extraOmschrijving ?? "",
    };
  } catch {}
}

function saveDocFields() {
  const key = docKey();
  if (key) localStorage.setItem(key, JSON.stringify(docFields.value));
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
