// src/services/db.ts
import { supabase } from "../lib/supabase";

export type OrderStatus = "OPEN" | "IN_PRODUCTIE" | "KLAAR" | "GEANNULEERD";

export type Klant = {
  klant_id: number;
  naam: string;

  contactpersoon?: string | null;
  email?: string | null;
  telefoon?: string | null;

  straat?: string | null;
  huisnummer?: string | null;
  postcode?: string | null;
  plaats?: string | null;
  land?: string | null;

  btw_nummer?: string | null;
  kvk_nummer?: string | null;
  notities?: string | null;
};


export type QualityCheck = {
  qc_id: number;
  order_id: number;

  datum: string; // YYYY-MM-DD
  machine_nummer: string | null;
  operator: string | null;
  rol_nummer: string | null;
  doos_nummer: string | null;

  lengte_breedte_ok: boolean;
  zijseal_ok: boolean;
  lek_test_ok: boolean;
  perforatie_beugel_gaten_ok: boolean;
  deeltjes_fysiek_ok: boolean;

  opmerkingen: string | null;

  // optioneel (als je ze in je tabel hebt)
  klantnummer?: string | null;
  klant_order_nummer?: string | null;
};

export type Order = {
  order_id: number;

  klant_id: number | null;
  interne_referentie: string | null;
  klant_order_nummer: string | null;
  klant_artikel_nummer: string | null;

  order_datum: string | null; // YYYY-MM-DD
  geplande_lever_datum: string | null; // YYYY-MM-DD

  product_naam: string | null;
  formaat: string | null;
  status: OrderStatus | string | null;

  // voortgang
  stuks_per_doos?: number | null;
  totaal_aantal_stuks?: number | null;
  stuks_per_bundel: number | null;
  geproduceerde_dozen?: number | null;

  // extra velden (detail/nieuw)
  product_type?: string | null;
  materiaal?: string | null;
  dikte_micron?: number | null;
  bedrukking?: string | null;

  beugel_maat?: string | null;
  beugel_vorm?: string | null;
  perforatie_type?: string | null;

  pallet_type?: string | null;
  totaal_per_pallet?: number | null;

  rollen_gewicht_gram?: number | null;
  rows_per_rol?: number | null;
  etiket_format?: string | null;
  rol_lengte?: number | null;

  totaal_aantal_meters?: number | null;
  totaal_prijs?: number | null;

  // prijs instellingen voor orderbevestiging
  prijs_eenheid_type?: string | null;
  bereken_aantal?: number | null;
  prijs_per_eenheid?: number | null;
  extra_omschrijving?: string | null;

  notities?: string | null;
  gereed_voor_verzending?: boolean | null;
};

export type OrderUpdate = Partial<
  Pick<
    Order,
    | "klant_id"
    | "interne_referentie"
    | "klant_order_nummer"
    | "klant_artikel_nummer"
    | "order_datum"
    | "geplande_lever_datum"
    | "status"
    | "product_naam"
    | "formaat"
    | "product_type"
    | "materiaal"
    | "dikte_micron"
    | "bedrukking"
    | "beugel_maat"
    | "beugel_vorm"
    | "perforatie_type"
    | "stuks_per_doos"
    | "stuks_per_bundel"
    | "totaal_aantal_stuks"
    | "geproduceerde_dozen"
    | "pallet_type"
    | "totaal_per_pallet"
    | "rollen_gewicht_gram"
    | "rows_per_rol"
    | "etiket_format"
    | "rol_lengte"
    | "totaal_aantal_meters"
    | "totaal_prijs"
    | "prijs_eenheid_type"
    | "bereken_aantal"
    | "prijs_per_eenheid"
    | "extra_omschrijving"
    | "notities"
    | "gereed_voor_verzending"
  >
>;

export async function getKlanten(): Promise<Klant[]> {
  const res = await supabase.from("klanten_api").select("*").order("naam");
  if (res.error) throw res.error;
  return (res.data ?? []) as Klant[];
}

export async function getOrders(): Promise<Order[]> {
  const res = await supabase
    .from("orders_api")
    .select("*")
    .order("order_id", { ascending: false });
  if (res.error) throw res.error;
  return (res.data ?? []) as Order[];
}

export async function getOrderById(orderId: number): Promise<Order> {
  const res = await supabase
    .from("orders_api")
    .select("*")
    .eq("order_id", orderId)
    .single();

  if (res.error) throw res.error;
  return res.data as Order;
}

export async function updateOrder(orderId: number, patch: OrderUpdate): Promise<Order> {
  // We updaten de basistabel 'orders'
  const up = await supabase.from("orders").update(patch).eq("order_id", orderId);
  if (up.error) throw up.error;

  // Altijd teruglezen uit de view/api voor consistente velden
  return await getOrderById(orderId);
}

export async function deleteOrder(orderId: number): Promise<void> {
  const res = await supabase.from("orders").delete().eq("order_id", orderId);
  if (res.error) throw res.error;
}

export type QualityCheckInsert = Omit<QualityCheck, "qc_id">;

export async function getQualityChecksForOrder(orderId: number): Promise<QualityCheck[]> {
  const res = await supabase
    .from("quality_checks")
    .select("*")
    .eq("order_id", orderId)
    .order("datum", { ascending: false })
    .order("qc_id", { ascending: false });

  if (res.error) throw res.error;
  return (res.data ?? []) as QualityCheck[];
}

export async function createQualityCheck(payload: QualityCheckInsert): Promise<QualityCheck> {
  const res = await supabase
    .from("quality_checks")
    .insert(payload)
    .select("*")
    .single();

  if (res.error) throw res.error;
  return res.data as QualityCheck;
}

// ------------------------------
// Voorraad (Inventory) functies
// Tabellen verwacht: inventory_groups, inventory_items
// ------------------------------

export type InventoryGroup = {
  id: string;
  name: string;
  created_at?: string | null;
};

export type InventoryItem = {
  id: string;
  group_id: string;
  product_name: string | null;
  product_sku?: string | null;
  quantity: number;
  last_modified_at?: string | null;
  created_at?: string | null;
};

export type InventoryItemInsert = Omit<InventoryItem, "id" | "created_at" | "last_modified_at">;

export async function getInventoryGroups(): Promise<InventoryGroup[]> {
  const res = await supabase
    .from("inventory_groups")
    .select("*")
    .order("created_at", { ascending: false });

  if (res.error) throw res.error;
  return (res.data ?? []) as InventoryGroup[];
}

export async function createInventoryGroup(name: string): Promise<InventoryGroup> {
  // probeer de ingelogde user-id mee te geven zodat RLS WITH CHECK werkt
  let created_by: string | null = null;
  try {
    const { data, error } = await supabase.auth.getUser();
    if (!error && data?.user) created_by = data.user.id;
  } catch (e) {
    // ignore
  }

  const payload: any = { name };
  if (created_by) payload.created_by = created_by;

  const res = await supabase.from("inventory_groups").insert(payload).select("*").single();

  if (res.error) throw res.error;
  return res.data as InventoryGroup;
}

export async function updateInventoryGroup(groupId: string, patch: Partial<InventoryGroup>): Promise<InventoryGroup> {
  const res = await supabase
    .from("inventory_groups")
    .update(patch)
    .eq("id", groupId)
    .select("*")
    .single();

  if (res.error) throw res.error;
  return res.data as InventoryGroup;
}

export async function deleteInventoryGroup(groupId: string): Promise<void> {
  // verwijder items eerst (cascade kan ook in DB)
  const delItems = await supabase.from("inventory_items").delete().eq("group_id", groupId);
  if (delItems.error) throw delItems.error;

  const res = await supabase.from("inventory_groups").delete().eq("id", groupId);
  if (res.error) throw res.error;
}

export async function getInventoryItemsForGroup(groupId: string): Promise<InventoryItem[]> {
  const res = await supabase
    .from("inventory_items")
    .select("*")
    .eq("group_id", groupId)
    .order("created_at", { ascending: false });

  if (res.error) throw res.error;
  return (res.data ?? []) as InventoryItem[];
}

export async function addInventoryItem(payload: InventoryItemInsert): Promise<InventoryItem> {
  // voeg created_by (indien beschikbaar) en last_modified_at toe
  let created_by: string | null = null;
  try {
    const { data, error } = await supabase.auth.getUser();
    if (!error && data?.user) created_by = data.user.id;
  } catch (e) {
    // ignore
  }

  const toInsert: any = { ...payload, last_modified_at: new Date().toISOString() };
  if (created_by) toInsert.created_by = created_by;

  const res = await supabase.from("inventory_items").insert(toInsert).select("*").single();

  if (res.error) throw res.error;
  return res.data as InventoryItem;
}

export async function updateInventoryItem(itemId: string, patch: Partial<InventoryItem>): Promise<InventoryItem> {
  const toUpdate = { ...patch, last_modified_at: new Date().toISOString() } as any;
  const res = await supabase.from("inventory_items").update(toUpdate).eq("id", itemId).select("*").single();

  if (res.error) throw res.error;
  return res.data as InventoryItem;
}

export async function deleteInventoryItem(itemId: string): Promise<void> {
  const res = await supabase.from("inventory_items").delete().eq("id", itemId);
  if (res.error) throw res.error;
}

