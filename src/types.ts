export type Pixel = { lat: number; lng: number; color: number };

export type PlaceOk = {
  ok: true;
  lat: number;
  lng: number;
  color: number;
  pool_size: number;
};
export type PlaceErr = { ok: false; reason?: string; refill_in?: number };
export type PlaceResponse = PlaceOk | PlaceErr;
