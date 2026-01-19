<!-- src/KlantenPage.vue -->
<template>
  <div class="page">
    <h1>Klanten</h1>

    <!-- Nieuwe klant -->
    <section class="card">
      <h2>Nieuwe klant aanmaken</h2>

      <form @submit.prevent="createKlant">
        <div class="grid">
          <label>
            Naam *
            <input v-model="form.naam" type="text" required />
          </label>

          <label>
            Contactpersoon
            <input v-model="form.contactpersoon" type="text" />
          </label>

          <label>
            E-mail
            <input v-model="form.email" type="email" />
          </label>

          <label>
            Telefoon
            <input v-model="form.telefoon" type="text" />
          </label>

          <label>
            Straat
            <input v-model="form.straat" type="text" />
          </label>

          <label>
            Huisnummer
            <input v-model="form.huisnummer" type="text" />
          </label>

          <label>
            Postcode
            <input v-model="form.postcode" type="text" />
          </label>

          <label>
            Plaats
            <input v-model="form.plaats" type="text" />
          </label>

          <label>
            Land
            <input v-model="form.land" type="text" />
          </label>

          <label>
            BTW-nummer
            <input v-model="form.btw_nummer" type="text" />
          </label>

          <label>
            KVK-nummer
            <input v-model="form.kvk_nummer" type="text" />
          </label>
        </div>

        <label class="full">
          Notities
          <textarea v-model="form.notities" rows="3"></textarea>
        </label>

        <div class="actions">
          <button type="submit" :disabled="saving">
            {{ saving ? "Opslaan..." : "Klant opslaan" }}
          </button>

          <button type="button" @click="resetForm" :disabled="saving">
            Reset
          </button>

          <button type="button" @click="loadKlanten" :disabled="loading">
            {{ loading ? "Laden..." : "Ververs lijst" }}
          </button>

          <span v-if="error" class="error">{{ error }}</span>
          <span v-if="success" class="success">{{ success }}</span>
        </div>
      </form>
    </section>

    <!-- Overzicht -->
    <section class="card">
      <h2>Klantenoverzicht</h2>

      <div v-if="loading">Laden...</div>
      <div v-else-if="klanten.length === 0">Nog geen klanten.</div>

      <div v-else class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Naam</th>
              <th>Plaats</th>
              <th>Contactpersoon</th>
              <th>E-mail</th>
              <th>Telefoon</th>
              <th>Acties</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="k in klanten" :key="k.klant_id">
              <td>{{ k.klant_id }}</td>
              <td>{{ k.naam }}</td>
              <td>{{ k.plaats || "-" }}</td>
              <td>{{ k.contactpersoon || "-" }}</td>
              <td>{{ k.email || "-" }}</td>
              <td>{{ k.telefoon || "-" }}</td>
              <td>
                <button type="button" @click="deleteKlant(k.klant_id)" :disabled="deletingId === k.klant_id">
                  {{ deletingId === k.klant_id ? "Verwijderen..." : "Verwijder" }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p v-if="listError" class="error">{{ listError }}</p>
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { supabase } from "./lib/supabase";
import type { Klant } from "./services/db";
import { getKlanten } from "./services/db";

/**
 * BELANGRIJK:
 * - Lezen: via view "klanten_api" (getKlanten uit db.ts)
 * - Schrijven/verwijderen: via table "klanten" (direct supabase)
 *   (View is vaak read-only)
 */

type KlantInsert = {
  naam: string;
  contactpersoon: string | null;
  email: string | null;
  telefoon: string | null;
  straat: string | null;
  huisnummer: string | null;
  postcode: string | null;
  plaats: string | null;
  land: string | null;
  btw_nummer: string | null;
  kvk_nummer: string | null;
  notities: string | null;
};

const klanten = ref<(Klant & Partial<Record<string, any>>)[]>([]);
const loading = ref(false);
const listError = ref<string | null>(null);

const saving = ref(false);
const error = ref<string | null>(null);
const success = ref<string | null>(null);

const deletingId = ref<number | null>(null);

const form = reactive({
  naam: "",
  contactpersoon: "",
  email: "",
  telefoon: "",
  straat: "",
  huisnummer: "",
  postcode: "",
  plaats: "",
  land: "",
  btw_nummer: "",
  kvk_nummer: "",
  notities: "",
});

function resetForm() {
  form.naam = "";
  form.contactpersoon = "";
  form.email = "";
  form.telefoon = "";
  form.straat = "";
  form.huisnummer = "";
  form.postcode = "";
  form.plaats = "";
  form.land = "";
  form.btw_nummer = "";
  form.kvk_nummer = "";
  form.notities = "";
}

async function loadKlanten() {
  loading.value = true;
  listError.value = null;

  try {
    const data = await getKlanten();
    // jouw Klant type heeft alleen klant_id + naam,
    // maar je view kan extra velden hebben (plaats/email/etc),
    // daarom casten we naar "Klant & extra".
    klanten.value = data as any;
  } catch (e: any) {
    console.error(e);
    listError.value = e?.message ?? "Kon klanten niet laden";
    klanten.value = [];
  } finally {
    loading.value = false;
  }
}

async function createKlant() {
  error.value = null;
  success.value = null;

  if (!form.naam.trim()) {
    error.value = "Naam is verplicht";
    return;
  }

  saving.value = true;
  try {
    const payload: KlantInsert = {
      naam: form.naam.trim(),
      contactpersoon: form.contactpersoon.trim() || null,
      email: form.email.trim() || null,
      telefoon: form.telefoon.trim() || null,
      straat: form.straat.trim() || null,
      huisnummer: form.huisnummer.trim() || null,
      postcode: form.postcode.trim() || null,
      plaats: form.plaats.trim() || null,
      land: form.land.trim() || null,
      btw_nummer: form.btw_nummer.trim() || null,
      kvk_nummer: form.kvk_nummer.trim() || null,
      notities: form.notities.trim() || null,
    };

    const res = await supabase.from("klanten").insert(payload).select("klant_id").single();
    if (res.error) throw res.error;

    success.value = `Klant opgeslagen (ID: ${res.data?.klant_id})`;
    resetForm();
    await loadKlanten();
  } catch (e: any) {
    console.error(e);
    error.value = e?.message ?? "Kon klant niet opslaan";
  } finally {
    saving.value = false;
  }
}

async function deleteKlant(klantId: number) {
  const sure = window.confirm(`Weet je zeker dat je klant #${klantId} wilt verwijderen?`);
  if (!sure) return;

  deletingId.value = klantId;
  listError.value = null;

  try {
    const res = await supabase.from("klanten").delete().eq("klant_id", klantId);
    if (res.error) throw res.error;
    await loadKlanten();
  } catch (e: any) {
    console.error(e);
    listError.value = e?.message ?? "Kon klant niet verwijderen";
  } finally {
    deletingId.value = null;
  }
}

onMounted(loadKlanten);
</script>

<style scoped>

h1 {
  font-size: 1.8rem;
  margin-bottom: 1.5rem;
  text-align: center;
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

form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 0.75rem 1rem;
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
}

th {
  background: #f9fafb;
  font-weight: 600;
}
</style>
