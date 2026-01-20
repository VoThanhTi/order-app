<template>
  <div class="page">
    <h1>Nieuwe order / product</h1>

    <section class="card">
      <h2>Klant & orderinformatie</h2>

      <form @submit.prevent="createOrder">
        <div class="grid">
          <label>
            Klant *
            <select v-model.number="form.klant_id" required>
              <option value="" disabled>Kies een klant</option>
              <option
                v-for="klant in klanten"
                :key="klant.klant_id"
                :value="klant.klant_id"
              >
                {{ klant.naam }}
              </option>
            </select>
          </label>

          <label>
            Interne referentie *
            <input v-model="form.interne_referentie" type="text" required />
          </label>

          <label>
            Klant ordernummer
            <input v-model="form.klant_order_nummer" type="text" />
          </label>

          <label>
            Klant artikelnr
            <input v-model="form.klant_artikel_nummer" type="text" />
          </label>

          <label>
            Orderdatum *
            <input v-model="form.order_datum" type="date" required />
          </label>

          <label>
            Geplande leverdatum *
            <input v-model="form.geplande_lever_datum" type="date" required />
          </label>
        </div>

        <h2>Productspecificatie</h2>

        <div class="grid">
          <label>
            Productnaam *
            <input v-model="form.product_naam" type="text" required />
          </label>

          <label>
            Formaat zak *
            <input v-model="form.formaat" type="text" placeholder="bv. 400 x 600 mm" />
          </label>

          <label>
            Product type
            <input v-model="form.product_type" type="text" placeholder="folie, beugelzak, ..." />
          </label>

          <label>
            Materiaal *
            <input v-model="form.materiaal" type="text" placeholder="LDPE, HDPE, ..." />
          </label>

          <label>
            Dikte (µm) *
            <input v-model.number="form.dikte_micron" type="number" min="0" />
          </label>

          <label>
            Bedrukking
            <input v-model="form.bedrukking" type="text" />
          </label>

          <label>
            Beugel maat
            <input v-model="form.beugel_maat" type="text" placeholder="8 cm / 12 cm / NVT" />
          </label>

          <label>
            Beugel vorm
            <input v-model="form.beugel_vorm" type="text" placeholder="krom / recht / NVT" />
          </label>

          <label>
            Perforatie type
            <input v-model="form.perforatie_type" type="text" placeholder="geen / micro / macro / grote perf" />
          </label>

          <label>
            Stuks per doos *
            <input v-model.number="form.stuks_per_doos" type="number" min="1" />
          </label>

          <label>
            Totaal aantal stuks *
            <input v-model.number="form.totaal_aantal_stuks" type="number" min="1" />
          </label>

          <label>
            Rollen gewicht (gram)
            <input v-model.number="form.rollen_gewicht_gram" type="number" min="0" />
          </label>

          <label>
            Rows per rol
            <input v-model.number="form.rows_per_rol" type="number" min="0" />
          </label>

          <label>
            Etiket formaat
            <input v-model="form.etiket_format" type="text" placeholder="2 / 8 / 16" />
          </label>

          <label>
            Pallet type
            <input v-model="form.pallet_type" type="text" placeholder="europallet / blockpallet" />
          </label>

          <label>
            Totaal per pallet
            <input v-model.number="form.totaal_per_pallet" type="number" min="0" />
          </label>

          <label>
            Rol lengte (m)
            <input v-model.number="form.rol_lengte" type="number" min="0" />
          </label>
        </div>

        <label class="full">
          Notities
          <textarea v-model="form.notities" rows="3" />
        </label>

        <div class="actions">
          <button type="submit" :disabled="saving || !klanten.length">
            {{ saving ? "Opslaan..." : "Order opslaan" }}
          </button>
          <span v-if="error" class="error">{{ error }}</span>
          <span v-if="success" class="success">{{ success }}</span>
          <span v-if="loadingKlanten" class="muted text-sm"> Data ophalen...</span>
        </div>
      </form>
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, watch } from "vue";
import { supabase } from "./lib/supabase";

interface Klant {
  klant_id: number;
  naam: string;
}

type OrderStatus = "OPEN" | "IN_PRODUCTIE" | "KLAAR" | "GEANNULEERD";

interface OrderForm {
  klant_id: number | "";
  interne_referentie: string;
  klant_order_nummer: string;
  klant_artikel_nummer: string;
  order_datum: string;
  geplande_lever_datum: string;

  product_naam: string;
  formaat: string;
  product_type: string;
  materiaal: string;
  dikte_micron: number | null;
  bedrukking: string;
  beugel_maat: string;
  beugel_vorm: string;
  perforatie_type: string;
  stuks_per_doos: number | null;
  totaal_aantal_stuks: number | null;
  totaal_aantal_meters: number | null;
  totaal_prijs: number | null;
  pallet_type: string;
  totaal_per_pallet: number | null;
  rollen_gewicht_gram: number | null;
  rows_per_rol: number | null;
  etiket_format: string;
  rol_lengte: number | null;
  notities: string;
  status: OrderStatus;
  gereed_voor_verzending: boolean;
}

const klanten = ref<Klant[]>([]);
const loadingKlanten = ref(false);
const saving = ref(false);
const error = ref<string | null>(null);
const success = ref<string | null>(null);

// Vandaag als standaard datum voor nieuwe orders
const today = new Date().toISOString().split('T')[0] as string;

const form = reactive<OrderForm>({
  klant_id: "",
  interne_referentie: "",
  klant_order_nummer: "",
  klant_artikel_nummer: "",
  order_datum: today,
  geplande_lever_datum: "",

  product_naam: "",
  formaat: "",
  product_type: "",
  materiaal: "",
  dikte_micron: null,
  bedrukking: "",
  beugel_maat: "",
  beugel_vorm: "",
  perforatie_type: "",
  stuks_per_doos: null,
  totaal_aantal_stuks: null,
  totaal_aantal_meters: null,
  totaal_prijs: null,
  pallet_type: "",
  totaal_per_pallet: null,
  rollen_gewicht_gram: null,
  rows_per_rol: null,
  etiket_format: "",
  rol_lengte: null,
  notities: "",
  status: "OPEN",
  gereed_voor_verzending: false,
});

/**
 * Automatisch velden vullen op basis van de laatste order van de gekozen klant
 */
async function fillFromLastOrder(klantId: number) {
  loadingKlanten.value = true;
  try {
    const { data, error: fetchError } = await supabase
      .from("orders")
      .select("*")
      .eq("klant_id", klantId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (data) {
      // Vul productspecificaties in
      form.product_naam = data.product_naam || "";
      form.formaat = data.formaat || "";
      form.product_type = data.product_type || "";
      form.materiaal = data.materiaal || "";
      form.dikte_micron = data.dikte_micron;
      form.bedrukking = data.bedrukking || "";
      form.beugel_maat = data.beugel_maat || "";
      form.beugel_vorm = data.beugel_vorm || "";
      form.perforatie_type = data.perforatie_type || "";
      form.stuks_per_doos = data.stuks_per_doos;
      form.totaal_aantal_stuks = data.totaal_aantal_stuks;
      form.pallet_type = data.pallet_type || "";
      form.totaal_per_pallet = data.totaal_per_pallet;
      form.rollen_gewicht_gram = data.rollen_gewicht_gram;
      form.rows_per_rol = data.rows_per_rol;
      form.etiket_format = data.etiket_format || "";
      form.rol_lengte = data.rol_lengte;
      form.notities = data.notities || "";
      
      // Specifieke order-data maken we leeg voor een nieuwe invoer
      form.interne_referentie = "";
      form.klant_order_nummer = "";
      form.klant_artikel_nummer = data.klant_artikel_nummer || "";
    }
  } catch (e: any) {
    console.error("Fout bij ophalen laatste order:", e.message);
  } finally {
    loadingKlanten.value = false;
  }
}

// Watcher die reageert op klantselectie
watch(() => form.klant_id, (newVal) => {
  if (newVal) {
    fillFromLastOrder(newVal as number);
  }
});

async function loadKlanten() {
  loadingKlanten.value = true;
  error.value = null;
  try {
    const res = await supabase
      .from("klanten_api")
      .select("*")
      .order("naam", { ascending: true });

    if (res.error) throw res.error;
    klanten.value = (res.data ?? []) as Klant[];
  } catch (e: any) {
    console.error(e);
    error.value = e.message || "Fout bij laden klanten";
  } finally {
    loadingKlanten.value = false;
  }
}

function validateForm(): string | null {
  if (!form.klant_id) return "Klant is verplicht";
  if (!form.interne_referentie.trim()) return "Interne referentie is verplicht";
  if (!form.order_datum) return "Orderdatum is verplicht";
  if (!form.geplande_lever_datum) return "Geplande leverdatum is verplicht";
  if (!form.product_naam.trim()) return "Productnaam is verplicht";
  if (!form.formaat.trim()) return "Formaat is verplicht";
  if (!form.materiaal.trim()) return "Materiaal is verplicht";
  if (!form.dikte_micron) return "Dikte is verplicht";
  if (!form.stuks_per_doos) return "Stuks per doos is verplicht";
  if (!form.totaal_aantal_stuks) return "Totaal aantal stuks is verplicht";
  return null;
}

function resetForm() {
  form.interne_referentie = "";
  form.klant_order_nummer = "";
  form.klant_artikel_nummer = "";
  form.order_datum = today;
  form.geplande_lever_datum = "";
  form.product_naam = "";
  form.formaat = "";
  form.product_type = "";
  form.materiaal = "";
  form.dikte_micron = null;
  form.bedrukking = "";
  form.beugel_maat = "";
  form.beugel_vorm = "";
  form.perforatie_type = "";
  form.stuks_per_doos = null;
  form.totaal_aantal_stuks = null;
  form.totaal_aantal_meters = null;
  form.totaal_prijs = null;
  form.pallet_type = "";
  form.totaal_per_pallet = null;
  form.rollen_gewicht_gram = null;
  form.rows_per_rol = null;
  form.etiket_format = "";
  form.rol_lengte = null;
  form.notities = "";
  form.status = "OPEN";
  form.gereed_voor_verzending = false;
}

async function createOrder() {
  error.value = null;
  success.value = null;

  const validationError = validateForm();
  if (validationError) {
    error.value = validationError;
    return;
  }

  saving.value = true;
  try {
    const payload: Record<string, any> = {
      klant_id: form.klant_id,
      interne_referentie_nummer: form.interne_referentie.trim(),
      klant_order_nummer: form.klant_order_nummer || null,
      klant_artikel_nummer: form.klant_artikel_nummer || null,
      order_datum: form.order_datum,
      geplande_lever_datum: form.geplande_lever_datum,
      product_naam: form.product_naam.trim(),
      formaat: form.formaat.trim(),
      product_type: form.product_type || null,
      materiaal: form.materiaal.trim(),
      dikte_micron: form.dikte_micron ?? 0,
      bedrukking: form.bedrukking || null,
      beugel_maat: form.beugel_maat || null,
      beugel_vorm: form.beugel_vorm || null,
      perforatie_type: form.perforatie_type || null,
      stuks_per_doos: form.stuks_per_doos ?? 0,
      totaal_aantal_stuks: form.totaal_aantal_stuks ?? 0,
      totaal_aantal_meters: form.totaal_aantal_meters ?? 0,
      totaal_prijs: form.totaal_prijs ?? 0,
      pallet_type: form.pallet_type || null,
      totaal_per_pallet: form.totaal_per_pallet ?? 0,
      rollen_gewicht_gram: form.rollen_gewicht_gram ?? 0,
      rows_per_rol: form.rows_per_rol ?? 0,
      etiket_format: form.etiket_format || null,
      rol_lengte: form.rol_lengte ?? 0,
      notities: form.notities || null,
      status: form.status,
      gereed_voor_verzending: form.gereed_voor_verzending,
      geproduceerde_dozen: 0,
    };

    const res = await supabase.from("orders").insert(payload).select("order_id").single();
    if (res.error) throw res.error;

    success.value = `Order opgeslagen (ID: ${res.data?.order_id})`;
    resetForm();
  } catch (e: any) {
    console.error(e);
    error.value = e.message || "Onbekende fout bij opslaan order";
  } finally {
    saving.value = false;
  }
}

onMounted(loadKlanten);
</script>

<style scoped>
h1 {
  font-size: 1.8rem;
  margin-bottom: 1.5rem;
  color: #ffffff;
}

.card {
  background: #ffffff;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.06);
  border: 1px solid #e5e7eb;
}

h2 {
  font-size: 1.2rem;
  margin-bottom: 1rem;
  margin-top: 0.75rem;
}

form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 0.75rem 1rem;
  margin-bottom: 0.75rem;
}

label {
  display: flex;
  flex-direction: column;
  font-size: 0.85rem;
  gap: 0.25rem;
  color: #111827;
  font-weight: 500;
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
