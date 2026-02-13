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

          <button type="button" class="secondary" @click="resetForm" :disabled="saving">
            Reset
          </button>

          <button type="button" class="secondary" @click="loadKlanten" :disabled="loading">
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
              <!-- <th>Acties</th> -->
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="k in klanten"
              :key="k.klant_id"
              class="row-click"
              @click="openDetails(k)"
              title="Klik voor details / bewerken"
            >
              <td>{{ k.klant_id }}</td>
              <td>{{ k.naam }}</td>
              <td>{{ k.plaats || "-" }}</td>
              <td>{{ k.contactpersoon || "-" }}</td>
              <td>{{ k.email || "-" }}</td>
              <td>{{ k.telefoon || "-" }}</td>
              <td>
                <!-- stopPropagation zodat rij-click niet triggert -->
                <!-- <button
                  type="button"
                  class="danger"
                  @click.stop="deleteKlant(k.klant_id)"
                  :disabled="deletingId === k.klant_id"
                >
                  {{ deletingId === k.klant_id ? "Verwijderen..." : "Verwijder" }}
                </button> -->
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p v-if="listError" class="error">{{ listError }}</p>
    </section>

    <!-- ✅ MODAL: details + edit -->
    <div v-if="showModal" class="modal-backdrop" @click.self="closeModal">
      <div class="modal">
        <div class="modal-head">
          <div>
            <div class="modal-title">
              Klant #{{ selected?.klant_id }} — {{ selected?.naam }}
            </div>
            <div class="modal-sub">
              Klik buiten de popup om te sluiten
            </div>
          </div>

          <button class="icon-btn" type="button" @click="closeModal">✕</button>
        </div>

        <div class="modal-body">
          <div class="grid modal-grid">
            <label>
              Naam *
              <input v-model="edit.naam" type="text" :disabled="!editMode" />
            </label>

            <label>
              Contactpersoon
              <input v-model="edit.contactpersoon" type="text" :disabled="!editMode" />
            </label>

            <label>
              E-mail
              <input v-model="edit.email" type="email" :disabled="!editMode" />
            </label>

            <label>
              Telefoon
              <input v-model="edit.telefoon" type="text" :disabled="!editMode" />
            </label>

            <label>
              Straat
              <input v-model="edit.straat" type="text" :disabled="!editMode" />
            </label>

            <label>
              Huisnummer
              <input v-model="edit.huisnummer" type="text" :disabled="!editMode" />
            </label>

            <label>
              Postcode
              <input v-model="edit.postcode" type="text" :disabled="!editMode" />
            </label>

            <label>
              Plaats
              <input v-model="edit.plaats" type="text" :disabled="!editMode" />
            </label>

            <label>
              Land
              <input v-model="edit.land" type="text" :disabled="!editMode" />
            </label>

            <label>
              BTW-nummer
              <input v-model="edit.btw_nummer" type="text" :disabled="!editMode" />
            </label>

            <label>
              KVK-nummer
              <input v-model="edit.kvk_nummer" type="text" :disabled="!editMode" />
            </label>
          </div>

          <label class="full">
            Notities
            <textarea v-model="edit.notities" rows="4" :disabled="!editMode"></textarea>
          </label>

          <div class="modal-actions">
            <button type="button" class="secondary" @click="toggleEdit">
              {{ editMode ? "Annuleer bewerken" : "Bewerken" }}
            </button>

            <button
              type="button"
              class="primary"
              v-if="editMode"
              @click="saveEdit"
              :disabled="savingEdit"
            >
              {{ savingEdit ? "Opslaan..." : "Opslaan" }}
            </button>

            <button
              type="button"
              class="danger"
              @click="selected?.klant_id && deleteKlant(selected.klant_id)"
              :disabled="selected?.klant_id == null || deletingId === selected?.klant_id"
            >
              {{ deletingId === selected?.klant_id ? "Verwijderen..." : "Verwijder klant" }}
            </button>

            <span v-if="modalMsg" class="muted">{{ modalMsg }}</span>
            <span v-if="modalErr" class="error">{{ modalErr }}</span>
          </div>
        </div>
      </div>
    </div>
    <!-- ✅ /MODAL -->
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

type KlantRow = (Klant & Partial<Record<string, any>>);

const klanten = ref<KlantRow[]>([]);
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

/* ✅ modal state */
const showModal = ref(false);
const selected = ref<KlantRow | null>(null);
const editMode = ref(false);
const savingEdit = ref(false);
const modalErr = ref<string | null>(null);
const modalMsg = ref<string | null>(null);

const edit = reactive({
  klant_id: 0,
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

function fillEditFromSelected(k: KlantRow) {
  edit.klant_id = Number(k.klant_id);
  edit.naam = String(k.naam ?? "");
  edit.contactpersoon = String(k.contactpersoon ?? "");
  edit.email = String(k.email ?? "");
  edit.telefoon = String(k.telefoon ?? "");
  edit.straat = String(k.straat ?? "");
  edit.huisnummer = String(k.huisnummer ?? "");
  edit.postcode = String(k.postcode ?? "");
  edit.plaats = String(k.plaats ?? "");
  edit.land = String(k.land ?? "");
  edit.btw_nummer = String(k.btw_nummer ?? "");
  edit.kvk_nummer = String(k.kvk_nummer ?? "");
  edit.notities = String(k.notities ?? "");
}

function openDetails(k: KlantRow) {
  selected.value = k;
  fillEditFromSelected(k);
  showModal.value = true;
  editMode.value = false;
  modalErr.value = null;
  modalMsg.value = null;
}

function closeModal() {
  showModal.value = false;
  selected.value = null;
  editMode.value = false;
  modalErr.value = null;
  modalMsg.value = null;
}

function toggleEdit() {
  modalErr.value = null;
  modalMsg.value = null;

  if (!selected.value) return;

  // toggle
  editMode.value = !editMode.value;

  // als we cancelen -> reset naar origineel
  if (!editMode.value) {
    fillEditFromSelected(selected.value);
  }
}

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

async function saveEdit() {
  modalErr.value = null;
  modalMsg.value = null;

  if (!selected.value) return;
  if (!edit.naam.trim()) {
    modalErr.value = "Naam is verplicht";
    return;
  }

  savingEdit.value = true;
  try {
    const payload: KlantInsert = {
      naam: edit.naam.trim(),
      contactpersoon: edit.contactpersoon.trim() || null,
      email: edit.email.trim() || null,
      telefoon: edit.telefoon.trim() || null,
      straat: edit.straat.trim() || null,
      huisnummer: edit.huisnummer.trim() || null,
      postcode: edit.postcode.trim() || null,
      plaats: edit.plaats.trim() || null,
      land: edit.land.trim() || null,
      btw_nummer: edit.btw_nummer.trim() || null,
      kvk_nummer: edit.kvk_nummer.trim() || null,
      notities: edit.notities.trim() || null,
    };

    const res = await supabase
      .from("klanten")
      .update(payload)
      .eq("klant_id", edit.klant_id)
      .select("*")
      .single();

    if (res.error) throw res.error;

    modalMsg.value = "Opgeslagen ✅";
    editMode.value = false;

    // refresh lijst + geselecteerde rij updaten (zodat popup meteen klopt)
    await loadKlanten();
    const updated = klanten.value.find(x => Number(x.klant_id) === edit.klant_id) ?? null;
    selected.value = updated;
    if (updated) fillEditFromSelected(updated);
  } catch (e: any) {
    console.error(e);
    modalErr.value = e?.message ?? "Kon klant niet opslaan";
  } finally {
    savingEdit.value = false;
  }
}

async function deleteKlant(klantId: number) {
  const sure = window.confirm(`Weet je zeker dat je klant #${klantId} wilt verwijderen?`);
  if (!sure) return;

  deletingId.value = klantId;
  listError.value = null;
  modalErr.value = null;
  modalMsg.value = null;

  try {
    const res = await supabase.from("klanten").delete().eq("klant_id", klantId);
    if (res.error) throw res.error;

    await loadKlanten();

    // als deze klant open stond, modal sluiten
    if (selected.value && Number(selected.value.klant_id) === klantId) {
      closeModal();
    }
  } catch (e: any) {
    console.error(e);
    const msg = e?.message ?? "Kon klant niet verwijderen";
    listError.value = msg;
    modalErr.value = msg;
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

.full { width: 100%; }

.actions {
  margin-top: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
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

button.secondary {
  background: #e5e7eb;
  color: #111827;
}

button.danger {
  background: #dc2626;
  color: #fff;
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

.muted {
  color: #6b7280;
  font-size: 0.85rem;
}

.table-wrapper { overflow-x: auto; }

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

/* ✅ klikbaar rij */
.row-click {
  cursor: pointer;
}
.row-click:hover {
  background: #f3f4f6;
}

/* ✅ modal */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.25rem;
  z-index: 50;
}

.modal {
  width: min(920px, 100%);
  background: #fff;
  border-radius: 14px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 20px 60px rgba(0,0,0,.25);
  overflow: hidden;
}

.modal-head {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.modal-title {
  font-weight: 800;
  font-size: 1.1rem;
  color: #111827;
}

.modal-sub {
  font-size: 0.85rem;
  color: #6b7280;
  margin-top: 0.15rem;
}

.icon-btn {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  background: #fff;
  color: #111827;
  cursor: pointer;
}

.modal-body {
  padding: 1.25rem;
}

.modal-grid {
  margin-bottom: 0.75rem;
}

.modal-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  align-items: center;
  margin-top: 0.9rem;
}
</style>