import { z } from "zod";

// Raw API response item from the bulk endpoint (no coordinates)
export const OAMeldungSchema = z.object({
  id: z.number().int(),
  meldungsNummern: z.array(z.string()).default([]),
  bezirk: z.string(),
  betreff: z.string(),
  erstellungsDatum: z.string(), // format: "DD.MM.YYYY - HH:MM:SS"
  status: z.string(),
  sachverhalt: z.string().nullable().optional(),
});

// Detail endpoint: same as bulk + address + coordinates + extra fields
export const OAMeldungDetailSchema = OAMeldungSchema.extend({
  strasse: z.string().optional(),
  hausNummer: z.string().nullable().optional(),
  plz: z.string().nullable().optional(),
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
  anmerkungZumOrt: z.string().nullable().optional(),
  letzteAenderungDatum: z.string().nullable().optional(),
  rueckMeldungAnBuerger: z.string().nullable().optional(),
  bild1Base64: z.string().nullable().optional(),
  bild2Base64: z.string().nullable().optional(),
});

export type OAMeldungDetail = z.infer<typeof OAMeldungDetailSchema>;

export type OAMeldung = z.infer<typeof OAMeldungSchema>;

export const OAResponseSchema = z.object({
  messages: z.object({ success: z.boolean() }).passthrough().optional(),
  results: z.object({ count: z.number() }).passthrough().optional(),
  index: z.array(OAMeldungSchema),
});

export const MapQuerySchema = z.object({
  zoom: z.coerce.number().int().min(1),
  displayMode: z.enum(["heatmap", "points"]).default("points"),
  minLat: z.coerce.number().optional(),
  maxLat: z.coerce.number().optional(),
  minLng: z.coerce.number().optional(),
  maxLng: z.coerce.number().optional(),
  district: z.string().optional(),
  category: z.string().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});
