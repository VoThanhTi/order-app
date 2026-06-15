<script setup lang="ts">
import { ref, onMounted } from "vue";
import {
  getInventoryGroups,
  createInventoryGroup,
  getInventoryItemsForGroup,
  addInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  deleteInventoryGroup,
} from "./services/db";
import type { InventoryGroup, InventoryItem } from "./services/db";

const groups = ref<InventoryGroup[]>([]);
const selectedGroup = ref<InventoryGroup | null>(null);
const items = ref<InventoryItem[]>([]);

const newGroupName = ref("");
const newItemProduct = ref("");
const newItemQuantity = ref<number | null>(null);

async function loadGroups() {
  groups.value = await getInventoryGroups();
  if (!selectedGroup.value && groups.value.length > 0) {
    // non-null assertion because length>0 guarantees an element at index 0
    await selectGroup(groups.value[0]!);
  }
}

async function selectGroup(g: InventoryGroup) {
  selectedGroup.value = g;
  items.value = await getInventoryItemsForGroup(g.id);
}

async function createGroup() {
  if (!newGroupName.value.trim()) return;
  const g = await createInventoryGroup(newGroupName.value.trim());
  groups.value.unshift(g);
  newGroupName.value = "";
  await selectGroup(g);
}

async function addItem() {
  if (!selectedGroup.value) return;
  const q = Number(newItemQuantity.value) || 0;
  const payload = {
    group_id: selectedGroup.value.id,
    product_name: newItemProduct.value || null,
    product_sku: null,
    quantity: q,
  };
  const it = await addInventoryItem(payload);
  items.value.unshift(it);
  newItemProduct.value = "";
  newItemQuantity.value = null;
}

async function saveItem(item: InventoryItem) {
  const updated = await updateInventoryItem(item.id, { product_name: item.product_name, quantity: Number(item.quantity) });
  const idx = items.value.findIndex((i) => i.id === item.id);
  if (idx >= 0) items.value[idx] = updated;
}

async function removeItem(itemId: string) {
  if (!confirm("Verwijder item?")) return;
  await deleteInventoryItem(itemId);
  items.value = items.value.filter((i) => i.id !== itemId);
}

async function removeGroup(groupId: string) {
  if (!confirm("Verwijder groep en alle items?")) return;
  await deleteInventoryGroup(groupId);
  groups.value = groups.value.filter((g) => g.id !== groupId);
  if (selectedGroup.value?.id === groupId) {
    selectedGroup.value = null;
    items.value = [];
  }
}

onMounted(loadGroups);
</script>

<template>
  <div class="voorraad-page">
    <div class="grid two-cols">
      <aside class="groups panel">
        <h3>Groepen</h3>

        <div class="row" style="gap:8px; margin-bottom:8px;">
          <input v-model="newGroupName" placeholder="Nieuwe groep" />
          <button class="btn" @click="createGroup">Maak</button>
        </div>

        <ul class="group-list">
          <li v-for="g in groups" :key="g.id" :class="{ selected: selectedGroup && selectedGroup.id === g.id }">
            <div class="group-row">
              <div @click="selectGroup(g)" style="flex:1; cursor:pointer">
                <div class="group-name">{{ g.name }}</div>
                <div class="group-meta">{{ g.created_at ? new Date(g.created_at).toLocaleString() : '' }}</div>
              </div>
              <button class="icon-btn danger" @click.stop="removeGroup(g.id)">✕</button>
            </div>
          </li>
        </ul>
      </aside>

      <section class="items panel">
        <h3>Items</h3>

        <div v-if="!selectedGroup">Kies eerst een groep</div>

        <div v-else>
          <div class="row" style="gap:8px; margin-bottom:8px;">
            <input v-model="newItemProduct" placeholder="Product naam" />
            <input v-model.number="newItemQuantity" type="number" placeholder="Aantal" />
            <button class="btn" @click="addItem">Voeg toe</button>
          </div>

          <table class="items-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Aantal</th>
                <th>Laatst aangepast</th>
                <th>Acties</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in items" :key="item.id">
                <td><input v-model="item.product_name" /></td>
                <td><input v-model.number="item.quantity" type="number" /></td>
                <td>{{ item.last_modified_at ? new Date(item.last_modified_at).toLocaleString() : '' }}</td>
                <td>
                  <button class="btn ghost" @click="saveItem(item)">Opslaan</button>
                  <button class="btn danger" @click="removeItem(item.id)">Verwijder</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
:root {
  --bg-0: #071028;
  --panel: rgba(255,255,255,0.03);
  --muted: #9ca3af;
  --accent: #2563eb;
  --danger: #ef4444;
}
.voorraad-page { padding:20px; min-height:100vh; background: linear-gradient(180deg,#041024 0%, #061220 100%); color: #e6eef8; font-family: Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial }
.two-cols { display:grid; grid-template-columns: 300px 1fr; gap:20px; align-items:start }
.panel { background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01)); padding:16px; border-radius:12px; box-shadow: 0 8px 30px rgba(2,6,23,0.6); border: 1px solid rgba(255,255,255,0.03) }
.groups { width: 300px }
.row { display:flex; gap:8px; align-items:center }
input { background: transparent; border:1px solid rgba(148,163,184,0.06); padding:8px 10px; border-radius:10px; color:inherit; outline:none; transition: box-shadow .15s, border-color .15s }
input:focus { box-shadow: 0 8px 20px rgba(37,99,235,0.08); border-color: rgba(37,99,235,0.48) }
.btn { background: var(--accent); color:white; border:0; padding:8px 12px; border-radius:10px; cursor:pointer; transition: transform .08s ease, box-shadow .12s }
.btn:hover { transform: translateY(-1px); box-shadow: 0 10px 26px rgba(37,99,235,0.12) }
.btn.ghost { background: transparent; color:inherit; border: 1px solid rgba(148,163,184,0.08); padding:6px 10px; border-radius:8px }
.btn.danger { background: var(--danger); color: white }
.icon-btn { background:transparent; border:0; cursor:pointer; padding:6px; border-radius:6px; color: rgba(248,113,113,0.9) }
.group-list { list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:10px; max-height: calc(100vh - 220px); overflow:auto }
.group-list li { display:flex; align-items:center; justify-content:space-between; padding:10px; border-radius:10px; transition: background .12s, transform .08s }
.group-list li:hover { background: rgba(255,255,255,0.02); transform: translateY(-2px) }
.group-row { display:flex; align-items:center; gap:12px; width:100% }
.group-name { font-weight:700; font-size:0.98rem }
.group-meta { font-size:0.8rem; color:var(--muted) }
.group-list li.selected { background: linear-gradient(90deg, rgba(37,99,235,0.12), rgba(37,99,235,0.06)); border-left: 4px solid var(--accent); padding-left:8px; box-shadow: 0 14px 40px rgba(37,99,235,0.04) }
.items-table { width:100%; border-collapse:collapse; margin-top:8px }
.items-table th, .items-table td { padding:12px 8px; text-align:left; border-bottom: 1px solid rgba(255,255,255,0.03) }
.items-table tbody tr:hover { background: rgba(255,255,255,0.02) }
.items-table input { background: transparent; border: none; padding:6px; color:inherit; width:100% }
.items-table input:focus { outline:none }
.items .row { gap:10px; margin-bottom:12px }
@media (max-width:860px) {
  .two-cols { grid-template-columns: 1fr }
  .groups { width:100% }
}
</style>
