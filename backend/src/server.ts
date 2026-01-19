import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Klant, OrderProduct, OrderStatus, QualityCheck } from "./models";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ===== In-memory data (tijdelijk, later DB) =====
let klanten: Klant[] = [];
let nextKlantId = 1;

let orders: OrderProduct[] = [];
let nextOrderId = 1;

let qualityChecks: QualityCheck[] = [];
let nextQcId = 1;

// ===== Routes =====

// Root
app.get("/", (req, res) => {
  res.send("Order backend draait 🚀 Gebruik /health voor status.");
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "order-backend" });
});

//
// KLANTEN
//

// GET alle klanten
app.get("/klanten", (req, res) => {
  res.json(klanten);
});

// POST nieuwe klant
app.post("/klanten", (req, res) => {
  const body = req.body as Partial<Klant>;

  if (!body.naam) {
    return res.status(400).json({ error: "veld 'naam' is verplicht" });
  }

  const nieuweKlant: Klant = {
    klant_id: nextKlantId++,
    naam: body.naam,
    btw_nummer: body.btw_nummer,
    kvk_nummer: body.kvk_nummer,
    straat: body.straat,
    huisnummer: body.huisnummer,
    postcode: body.postcode,
    plaats: body.plaats,
    land: body.land,
    contactpersoon: body.contactpersoon,
    email: body.email,
    telefoon: body.telefoon,
    notities: body.notities,
  };

  klanten.push(nieuweKlant);

  res.status(201).json(nieuweKlant);
});

//
// ORDERS
//

// GET alle orders
app.get("/orders", (req, res) => {
  res.json(orders);
});

// GET één order
app.get("/orders/:id", (req, res) => {
  const id = Number(req.params.id);
  const order = orders.find((o) => o.order_id === id);
  if (!order) {
    return res.status(404).json({ error: "order niet gevonden" });
  }
  res.json(order);
});

// POST nieuwe order
app.post("/orders", (req, res) => {
  const body = req.body as Partial<OrderProduct>;

  // basis validaties
  if (!body.interne_referentie) {
    return res.status(400).json({ error: "interne_referentie is verplicht" });
  }
  if (!body.klant_id) {
    return res.status(400).json({ error: "klant_id is verplicht" });
  }
  if (!body.product_naam || !body.formaat || !body.materiaal) {
    return res.status(400).json({
      error: "product_naam, formaat en materiaal zijn verplicht",
    });
  }
  if (!body.stuks_per_doos || !body.totaal_aantal_stuks) {
    return res
      .status(400)
      .json({ error: "stuks_per_doos en totaal_aantal_stuks zijn verplicht" });
  }
  if (!body.order_datum || !body.geplande_lever_datum) {
    return res
      .status(400)
      .json({ error: "order_datum en geplande_lever_datum zijn verplicht" });
  }

  // check: bestaat klant?
  const klant = klanten.find((k) => k.klant_id === body.klant_id);
  if (!klant) {
    return res.status(400).json({ error: "klant_id bestaat niet" });
  }

  const nieuweOrder: OrderProduct = {
    order_id: nextOrderId++,
    interne_referentie: body.interne_referentie,
    klant_order_nummer: body.klant_order_nummer || "",
    klant_artikel_nummer: body.klant_artikel_nummer || "",
    klant_id: body.klant_id,

    order_datum: body.order_datum,
    geplande_lever_datum: body.geplande_lever_datum,
    totaal_aantal_stuks: body.totaal_aantal_stuks,
    totaal_aantal_meters: body.totaal_aantal_meters ?? 0,
    totaal_prijs: body.totaal_prijs ?? 0,
    status: (body.status as OrderStatus) || "OPEN",
    gereed_voor_verzending: body.gereed_voor_verzending ?? false,
    notities: body.notities,

    product_naam: body.product_naam,
    formaat: body.formaat,
    product_type: body.product_type || "",
    bedrukking: body.bedrukking,
    materiaal: body.materiaal,
    dikte_micron: body.dikte_micron ?? 0,
    beugel_maat: body.beugel_maat,
    beugel_vorm: body.beugel_vorm,
    beugel_totaal: body.beugel_totaal,
    zak_formaat: body.zak_formaat,
    perforatie_type: body.perforatie_type,
    pallet_type: body.pallet_type,
    stuks_per_doos: body.stuks_per_doos,
    totaal_per_pallet: body.totaal_per_pallet,
    rollen_gewicht_gram: body.rollen_gewicht_gram,
    rol_lengte: body.rol_lengte,
    etiket_format: body.etiket_format,
    rows_per_rol: body.rows_per_rol,

    geproduceerde_dozen: body.geproduceerde_dozen ?? 0,
  };

  orders.push(nieuweOrder);

  res.status(201).json(nieuweOrder);
});

// PATCH /orders/:id – order bewerken
app.patch("/orders/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "ongeldig order ID" });
  }

  const index = orders.findIndex((o) => o.order_id === id);
  if (index === -1) {
    return res.status(404).json({ error: "order niet gevonden" });
  }

const current = orders[index] as OrderProduct;
  const body = req.body as Partial<OrderProduct>;

  // merge huidige order + nieuwe velden
const updated = {
  ...current,
  ...body,
} as OrderProduct;     // 👉 cast om TS niet te laten zeuren over optionals

  // ID & klant_id blijven gewoon gelijk
  updated.order_id = current.order_id;
  updated.klant_id = current.klant_id;

  orders[index] = updated;
  res.json(updated);
});

// DELETE /orders/:id – order verwijderen
app.delete("/orders/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "ongeldig order ID" });
  }

  const index = orders.findIndex((o) => o.order_id === id);
  if (index === -1) {
    return res.status(404).json({ error: "order niet gevonden" });
  }

  orders.splice(index, 1);
  res.status(204).send();
});

app.get("/orders/:id/quality-checks", (req, res) => {
  const orderId = Number(req.params.id);
  if (!Number.isInteger(orderId)) {
    return res.status(400).json({ error: "ongeldig order ID" });
  }

  const checks = qualityChecks.filter((qc) => qc.order_id === orderId);
  res.json(checks);
});

app.post("/orders/:id/quality-checks", (req, res) => {
  const orderId = Number(req.params.id);
  if (!Number.isInteger(orderId)) {
    return res.status(400).json({ error: "ongeldig order ID" });
  }

  const order = orders.find((o) => o.order_id === orderId);
  if (!order) {
    return res.status(404).json({ error: "order niet gevonden" });
  }

  const body = req.body as Partial<QualityCheck>;

  const qc: QualityCheck = {
    qc_id: nextQcId++,
    order_id: orderId,
    datum: body.datum ?? new Date().toISOString().slice(0, 10),

    machine_nummer: body.machine_nummer,
    operator: body.operator,
    klantnummer: body.klantnummer,
    klant_order_nummer: body.klant_order_nummer ?? order.klant_order_nummer,

    rol_nummer: body.rol_nummer,
    lengte_breedte_ok: body.lengte_breedte_ok ?? false,
    aantal_zakken_in_doos: body.aantal_zakken_in_doos,
    aantal_gaten: body.aantal_gaten,
    zijseal_ok: body.zijseal_ok ?? false,
    sealsterkte_ok: body.sealsterkte_ok ?? false,
    lek_test_ok: body.lek_test_ok ?? false,
    perforatie_beugel_gaten_ok: body.perforatie_beugel_gaten_ok ?? false,
    sealbalk_schoon: body.sealbalk_schoon ?? false,
    kwaliteit_moederrol_ok: body.kwaliteit_moederrol_ok ?? false,
    rol_wisseling_ok: body.rol_wisseling_ok ?? false,

    machine_storing: body.machine_storing,
    opmerkingen: body.opmerkingen,
    deeltjes_fysiek_ok: body.deeltjes_fysiek_ok ?? false,
    doos_nummer: body.doos_nummer,
  };

  qualityChecks.push(qc);
  res.status(201).json(qc);
});

app.patch("/quality-checks/:id", (req, res) => {
  const qcId = Number(req.params.id);
  if (!Number.isInteger(qcId)) {
    return res.status(400).json({ error: "ongeldig qc ID" });
  }

  const index = qualityChecks.findIndex((qc) => qc.qc_id === qcId);
  if (index === -1) {
    return res.status(404).json({ error: "quality check niet gevonden" });
  }

  // "!" zegt tegen TS: hier is hij zeker niet undefined
  const current = qualityChecks[index]!;
  const body = req.body as Partial<QualityCheck>;

  const updated: QualityCheck = {
    ...current,
    ...body,
    qc_id: current.qc_id,
    order_id: current.order_id, // blijft gelijk
  };

  qualityChecks[index] = updated;
  res.json(updated);
});


// ===== Start server =====
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

