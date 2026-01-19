<template>
  <div class="page">
    <section class="card">
      <h2>Quality check</h2>

      <p v-if="!order">Geen order geselecteerd.</p>

      <template v-else>
        <form class="form" @submit.prevent="saveCheck">
          <div class="grid">
            <label>
              Datum
              <input type="date" v-model="form.datum" required />
            </label>

            <label>
              Machine nummer
              <input type="text" v-model="form.machine_nummer" />
            </label>

            <label>
              Operator
              <input type="text" v-model="form.operator" />
            </label>

            <label>
              Rol nummer
              <input type="text" v-model="form.rol_nummer" />
            </label>

            <label>
              Doos nummer
              <input type="text" v-model="form.doos_nummer" />
            </label>
          </div>

          <div class="checks-grid">
            <label>
              <input type="checkbox" v-model="form.lengte_breedte_ok" />
              Lengte / breedte OK
            </label>

            <label>
              <input type="checkbox" v-model="form.zijseal_ok" />
              Zijseal OK
            </label>

            <label>
              <input type="checkbox" v-model="form.lek_test_ok" />
              Lek test OK
            </label>

            <label>
              <input type="checkbox" v-model="form.perforatie_beugel_gaten_ok" />
              Perforatie beugelgaten OK
            </label>

            <label>
              <input type="checkbox" v-model="form.deeltjes_fysiek_ok" />
              Deeltjes / fysiek OK
            </label>
          </div>

          <label class="full">
            Opmerkingen
            <textarea v-model="form.opmerkingen" rows="3" />
          </label>

          <div class="actions">
            <button type="submit" :disabled="saving">
              {{ saving ? "Opslaan..." : "Quality check opslaan" }}
            </button>

            <span v-if="error" class="error">{{ error }}</span>
            <span v-if="success" class="success">{{ success }}</span>
          </div>
        </form>

        <div v-if="loadingList">Laden...</div>

        <ul v-else>
          <li v-for="qc in allChecks" :key="qc.qc_id" class="qc-item">
            <div class="qc-main">
              <strong>{{ qc.datum }}</strong>
              – machine {{ qc.machine_nummer || "-" }},
              operator {{ qc.operator || "-" }},
              rol {{ qc.rol_nummer || "-" }},
              doos {{ qc.doos_nummer || "-" }}
            </div>

            <div class="qc-checks">
              <span>
                Lengte / breedte {{ qc.lengte_breedte_ok ? "OK" : "NOK" }}
              </span>
              <span>
                Zijseal {{ qc.zijseal_ok ? "OK" : "NOK" }}
              </span>
              <span>
                Lek test {{ qc.lek_test_ok ? "OK" : "NOK" }}
              </span>
              <span>
                Beugelgaten {{ qc.perforatie_beugel_gaten_ok ? "OK" : "NOK" }}
              </span>
              <span>
                Deeltjes / fysiek {{ qc.deeltjes_fysiek_ok ? "OK" : "NOK" }}
              </span>
            </div>

            <div v-if="qc.opmerkingen" class="qc-remark">
              <strong>Opmerkingen:</strong> {{ qc.opmerkingen }}
            </div>
          </li>
        </ul>
      </template>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import type { Order, QualityCheck, QualityCheckInsert } from "./services/db";
import { createQualityCheck, getQualityChecksForOrder } from "./services/db";

const props = defineProps<{
  order: Order | null;
}>();

const orderId = computed(() => props.order?.order_id ?? null);

const allChecks = ref<QualityCheck[]>([]);
const loadingList = ref(false);

const saving = ref(false);
const error = ref<string | null>(null);
const success = ref<string | null>(null);

const form = ref({
  datum: new Date().toISOString().slice(0, 10),
  machine_nummer: "",
  operator: "",
  rol_nummer: "",
  doos_nummer: "",
  lengte_breedte_ok: true,
  zijseal_ok: true,
  lek_test_ok: true,
  perforatie_beugel_gaten_ok: true,
  deeltjes_fysiek_ok: true,
  opmerkingen: "",
});

async function loadChecks() {
  if (orderId.value == null) {
    allChecks.value = [];
    return;
  }

  loadingList.value = true;
  try {
    allChecks.value = await getQualityChecksForOrder(orderId.value);
  } catch (e: any) {
    console.warn(e);
    allChecks.value = [];
  } finally {
    loadingList.value = false;
  }
}

watch(orderId, () => {
  loadChecks();
}, { immediate: true });

async function saveCheck() {
  error.value = null;
  success.value = null;

  if (!props.order || orderId.value == null) {
    error.value = "Geen order geselecteerd";
    return;
  }

  const payload: QualityCheckInsert = {
    order_id: orderId.value,
    datum: form.value.datum,

    machine_nummer: form.value.machine_nummer || null,
    operator: form.value.operator || null,
    rol_nummer: form.value.rol_nummer || null,
    doos_nummer: form.value.doos_nummer || null,

    lengte_breedte_ok: !!form.value.lengte_breedte_ok,
    zijseal_ok: !!form.value.zijseal_ok,
    lek_test_ok: !!form.value.lek_test_ok,
    perforatie_beugel_gaten_ok: !!form.value.perforatie_beugel_gaten_ok,
    deeltjes_fysiek_ok: !!form.value.deeltjes_fysiek_ok,

    opmerkingen: form.value.opmerkingen || null,

    // optioneel: alleen als je die kolommen echt hebt in je tabel
    klantnummer: props.order.klant_order_nummer ?? null,
    klant_order_nummer: props.order.klant_order_nummer ?? null,
  };

  saving.value = true;
  try {
    const saved = await createQualityCheck(payload);

    // prepend bovenaan
    allChecks.value = [saved, ...allChecks.value];

    // reset form
    form.value = {
      datum: new Date().toISOString().slice(0, 10),
      machine_nummer: "",
      operator: "",
      rol_nummer: "",
      doos_nummer: "",
      lengte_breedte_ok: true,
      zijseal_ok: true,
      lek_test_ok: true,
      perforatie_beugel_gaten_ok: true,
      deeltjes_fysiek_ok: true,
      opmerkingen: "",
    };

    success.value = "Quality check opgeslagen";
  } catch (e: any) {
    console.error(e);
    error.value = e?.message ?? "Onbekende fout bij opslaan quality check";
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.card {
  background: #ffffff;
  border-radius: 12px;
  padding: 1.5rem;
  margin-top: 1.5rem;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.06);
  border: 1px solid #e5e7eb;
  color: #111827;
}

h2 {
  font-size: 1.2rem;
  margin-bottom: 1rem;
}

h3 {
  font-size: 1rem;
  margin: 1rem 0 0.5rem;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 0.75rem 1rem;
}

.checks-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 0.5rem 1rem;
  margin-top: 0.5rem;
}

label {
  display: flex;
  flex-direction: column;
  font-size: 0.85rem;
  gap: 0.25rem;
  color: #111827;
}

input,
textarea {
  border-radius: 8px;
  border: 1px solid #d1d5db;
  padding: 0.45rem 0.6rem;
  font-size: 0.9rem;
  background: #f3f4f6;
  color: #111827;
}

input:focus,
textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 1px #3b82f6;
  background: #ffffff;
}
.qc-item {
  padding: 0.4rem 0;
  border-bottom: 1px solid #e5e7eb;
}

.qc-main {
  font-size: 0.85rem;
  margin-bottom: 0.25rem;
}

.qc-checks {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin-bottom: 0.25rem;
}

.chip-ok,
.chip-nok {
  padding: 0.1rem 0.5rem;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 500;
}

.chip-ok {
  background: #dcfce7;
  color: #166534;
}

.chip-nok {
  background: #fee2e2;
  color: #b91c1c;
}

.qc-remark {
  font-size: 0.8rem;
  color: #374151;
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

button {
  background: #2563eb;
  color: white;
  border-radius: 999px;
  border: none;
  padding: 0.5rem 1.1rem;
  font-size: 0.9rem;
  cursor: pointer;
}

button:disabled {
  opacity: 0.6;
  cursor: default;
}

.error {
  color: #b91c1c;
  font-size: 0.85rem;
}

.success {
  color: #166534;
  font-size: 0.85rem;
}

.checks-list ul {
  list-style: none;
  padding-left: 0;
  margin: 0;
}

.checks-list li {
  font-size: 0.85rem;
  padding: 0.25rem 0;
  border-bottom: 1px solid #e5e7eb;
}
</style>
