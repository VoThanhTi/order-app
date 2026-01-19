export interface Klant {
  klant_id: number;
  naam: string;
  btw_nummer?: string | undefined;
  kvk_nummer?: string | undefined;
  straat?: string | undefined;
  huisnummer?: string | undefined;
  postcode?: string | undefined;
  plaats?: string | undefined;
  land?: string | undefined;
  contactpersoon?: string | undefined;
  email?: string | undefined;
  telefoon?: string | undefined;
  notities?: string | undefined;
}

export type OrderStatus = "OPEN" | "IN_PRODUCTIE" | "KLAAR" | "GEANNULEERD";

export interface OrderProduct {
  order_id: number;
  interne_referentie: string;      // eigen ref nummer
  klant_order_nummer: string;
  klant_artikel_nummer: string;
  klant_id: number;

  order_datum: string;
  geplande_lever_datum: string;
  totaal_aantal_stuks: number;
  totaal_aantal_meters?: number | undefined;
  totaal_prijs?: number | undefined;
  status: OrderStatus;
  gereed_voor_verzending: boolean;
  notities?: string | undefined;

  // productspecificatie
  product_naam: string;
  formaat: string;
  product_type: string;
  bedrukking?: string | undefined;
  materiaal: string;
  dikte_micron: number;
  beugel_maat?: string | undefined;
  beugel_vorm?: string | undefined;
  beugel_totaal?: number | undefined;
  zak_formaat?: string | undefined;
  perforatie_type?: string | undefined;
  pallet_type?: string | undefined;
  stuks_per_doos: number;
  totaal_per_pallet?: number | undefined;
  rollen_gewicht_gram?: number | undefined;
  rol_lengte?: number | undefined;
  etiket_format?: string | undefined;   // 2 / 8 / 16
  rows_per_rol?: number | undefined;

  // voortgang
  geproduceerde_dozen?: number | undefined;
}

export interface QualityCheck {
  qc_id: number;
  order_id: number;
  datum: string;

  machine_nummer?: string | undefined;
  operator?: string | undefined;
  klantnummer?: string | undefined;
  klant_order_nummer?: string | undefined;

  rol_nummer?: string | undefined;
  lengte_breedte_ok?: boolean | undefined;
  aantal_zakken_in_doos?: number | undefined;
  aantal_gaten?: number | undefined;
  zijseal_ok?: boolean | undefined;
  sealsterkte_ok?: boolean | undefined;
  lek_test_ok?: boolean | undefined;
  perforatie_beugel_gaten_ok?: boolean | undefined;
  sealbalk_schoon?: boolean | undefined;
  kwaliteit_moederrol_ok?: boolean | undefined;
  rol_wisseling_ok?: boolean | undefined;

  machine_storing?: string | undefined;
  opmerkingen?: string | undefined;
  deeltjes_fysiek_ok?: boolean | undefined;
  doos_nummer?: string | undefined;
}

