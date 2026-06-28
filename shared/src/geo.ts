// Pure geo/projection math. No DOM, no state — shared by display + server.

const M_PER_MILE = 1609.34;
const KT_TO_MS = 0.514444;
const DEG = Math.PI / 180;

export interface Meters {
  east: number;
  north: number;
}

export interface Point {
  x: number;
  y: number;
}

/**
 * Flat-earth approximation of lat/lon -> local meters relative to a center.
 * Plenty accurate within a few miles.
 */
export function llToMeters(
  lat: number,
  lon: number,
  lat0: number,
  lon0: number,
): Meters {
  const east = (lon - lon0) * Math.cos(lat0 * DEG) * 111320;
  const north = (lat - lat0) * 110540;
  return { east, north };
}

/** Horizontal ground distance (meters) from center. */
export function rangeMeters(m: Meters): number {
  return Math.hypot(m.east, m.north);
}

export function metersToMiles(m: number): number {
  return m / M_PER_MILE;
}

/** Pixels per meter so that `radiusMiles` fills half of the smaller screen axis. */
export function pxPerMeter(
  screenW: number,
  screenH: number,
  radiusMiles: number,
): number {
  return Math.min(screenW, screenH) / 2 / (radiusMiles * M_PER_MILE);
}

export interface ProjectOpts {
  rotationDeg: number;
  mirrorX: boolean;
  mirrorY: boolean;
  pxPerM: number;
  screenW: number;
  screenH: number;
}

/** Local meters -> screen pixels with rotation + mirror, screen-Y inverted. */
export function project(m: Meters, o: ProjectOpts): Point {
  const t = o.rotationDeg * DEG;
  const cos = Math.cos(t);
  const sin = Math.sin(t);
  let x = m.east * cos - m.north * sin;
  let y = m.east * sin + m.north * cos;
  if (o.mirrorX) x = -x;
  if (o.mirrorY) y = -y;
  return {
    x: o.screenW / 2 + x * o.pxPerM,
    y: o.screenH / 2 - y * o.pxPerM, // screen Y grows downward
  };
}

/**
 * Dead-reckon a position forward along its track at ground speed.
 * Returns new local meters. Used to smooth ~1 Hz updates to 60 fps.
 */
export function deadReckon(
  m: Meters,
  trackDeg: number | undefined,
  gsKt: number | undefined,
  dtSec: number,
): Meters {
  if (trackDeg == null || gsKt == null || gsKt <= 0) return m;
  const dist = gsKt * KT_TO_MS * dtSec;
  const t = trackDeg * DEG;
  return {
    east: m.east + dist * Math.sin(t),
    north: m.north + dist * Math.cos(t),
  };
}

export const EMERGENCY_SQUAWKS = new Set(["7500", "7600", "7700"]);


export interface FilteredAircraft {
  flight: string;
  altBaro: number;
  lat: number;
  lon: number;
  track?: number;
  gs?: number;
  typeName?: string;
  airline?: string;
  origin?: string;
  destination?: string;
  originName?: string;
  destName?: string;
  distanceMiles: number; // 3D distance in miles from home position
}

export function getClosestFilteredAircraft(
  aircraftList: any[], 
  homeLat: number, 
  homeLon: number,
  maxMiles: number = 15,
  minAlt: number = 2000,
  maxAlt: number = 35000
): FilteredAircraft | null {
  let closestAircraft = null;
  let min3DDistance = Infinity;

  for (const ac of aircraftList) {
    // Exclude A/C based on altitude filter
    if (ac.altBaro === undefined || ac.altBaro === null) continue;
    
    const alt = ac.altBaro;
    
    // 1. Altitude filter 
    if (alt < minAlt || alt > maxAlt) continue;

    // 2. 2D Calculation - Haversine
    const R = 3958.8; // Raggio della Terra in miglia terrestri
    const dLat = (ac.lat - homeLat) * Math.PI / 180;
    const dLon = (ac.lon - homeLon) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(homeLat * Math.PI / 180) * Math.cos(ac.lat * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance2D = R * c;

    // 3. 3D Calculation - Slant Range
    const altInMiles = alt / 5280;
    const distance3D = Math.sqrt(Math.pow(distance2D, 2) + Math.pow(altInMiles, 2));

    // 4. 3D filter from home based on radius and altitude
    if (distance3D <= maxMiles && distance3D < min3DDistance) {
      min3DDistance = distance3D;
      // Forziamo il salvataggio dei dati correnti per evitare reference a vecchi stati
      closestAircraft = { ...ac, distanceMiles: distance3D, altBaro: alt };
    }
  }

  return closestAircraft;
}