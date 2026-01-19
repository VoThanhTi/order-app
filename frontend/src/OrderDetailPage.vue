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
        <button v-if="!isEditing" class="edit-btn" @click="isEditing = true">Bewerken</button>
        <button v-if="!isEditing" class="delete-btn" @click="deleteOrderFn" :disabled="deleting">
          {{ deleting ? "Verwijderen..." : "Order verwijderen" }}
        </button>
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
            <textarea v-model="localOrder.notities" rows="3" />
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
  },
  { immediate: true }
);

const displayKlantNaam = computed(() => {
  if (!localOrder.value) return null;
  if (klantNaam.value) return klantNaam.value;
  return localOrder.value.klant_id ? `Klant #${localOrder.value.klant_id}` : "-";
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
</script>


<style scoped>
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
.cancel-btn {
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
