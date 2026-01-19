<template>
  <div class="page">
    <h1>Klanten</h1>

    <!-- Formulier: nieuwe klant -->
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
          <textarea v-model="form.notities" rows="3" />
        </label>

        <div class="actions">
          <button type="submit" :disabled="saving">
            {{ saving ? "Opslaan..." : "Klant opslaan" }}
          </button>
          <span v-if="error" class="error">{{ error }}</span>
          <span v-if="success" class="success">{{ success }}</span>
        </div>
      </form>
    </section>

    <!-- Overzicht: klanten -->
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
            </tr>
          </thead>
          <tbody>
            <tr v-for="klant in klanten" :key="klant.klant_id">
              <td>{{ klant.klant_id }}</td>
              <td>{{ klant.naam }}</td>
              <td>{{ klant.plaats || "-" }}</td>
              <td>{{ klant.contactpersoon || "-" }}</td>
              <td>{{ klant.email || "-" }}</td>
              <td>{{ klant.telefoon || "-" }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";

const STORAGE_KLANTEN_KEY = "orderapp_klanten";
const API_BASE = "http://localhost:3000";

interface Klant {
  klant_id: number;
  naam: string;
  btw_nummer?: string;
  kvk_nummer?: string;
  straat?: string;
  huisnummer?: string;
  postcode?: string;
  plaats?: string;
  land?: string;
  contactpersoon?: string;
  email?: string;
  telefoon?: string;
  notities?: string;
}

function loadKlantenFromStorage(): Klant[] {
  try {
    const raw = localStorage.getItem(STORAGE_KLANTEN_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Klant[];
  } catch {
    return [];
  }
}

function saveKlantenToStorage(list: Klant[]) {
  try {
    localStorage.setItem(STORAGE_KLANTEN_KEY, JSON.stringify(list));
  } catch (err) {
    console.error("Kon klanten niet in localStorage opslaan", err);
  }
}

const klanten = ref<Klant[]>(loadKlantenFromStorage());
const loading = ref(false);
const saving = ref(false);
const error = ref<string | null>(null);
const success = ref<string | null>(null);

const form = reactive({
  naam: "",
  btw_nummer: "",
  kvk_nummer: "",
  straat: "",
  huisnummer: "",
  postcode: "",
  plaats: "",
  land: "",
  contactpersoon: "",
  email: "",
  telefoon: "",
  notities: "",
});

async function loadKlanten() {
  loading.value = true;
  try {
    const res = await fetch(`${API_BASE}/klanten`);
    if (!res.ok) throw new Error("Kon klanten niet laden");
    const data: Klant[] = await res.json();
    klanten.value = data;
    saveKlantenToStorage(klanten.value);
  } catch (e) {
    console.warn("Backend niet bereikbaar, gebruik localStorage-data", e);
    // klanten.value komt al uit localStorage
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
    const res = await fetch(`${API_BASE}/klanten`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Kon klant niet opslaan");
    }

    const newKlant: Klant = await res.json();
    klanten.value.push(newKlant);
    saveKlantenToStorage(klanten.value); // <<< belangrijk

    Object.assign(form, {
      naam: "",
      btw_nummer: "",
      kvk_nummer: "",
      straat: "",
      huisnummer: "",
      postcode: "",
      plaats: "",
      land: "",
      contactpersoon: "",
      email: "",
      telefoon: "",
      notities: "",
    });

    success.value = "Klant opgeslagen";
  } catch (e: any) {
    error.value = e.message || "Onbekende fout bij opslaan klant";
  } finally {
    saving.value = false;
  }
}

onMounted(() => {
  loadKlanten();
});
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
