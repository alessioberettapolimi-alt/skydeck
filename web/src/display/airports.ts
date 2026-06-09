// Bundled airport geometry, drawn at true geographic position so departures and
// arrivals visibly line up with the runways. Coordinates from OurAirports (LIMC, LIML, LIME).

export interface Runway {
  leIdent: string;
  heIdent: string;
  le: [number, number]; // [lat, lon]
  he: [number, number];
  widthFt: number;
}

export interface Airport {
  icao: string;
  name: string;
  runways: Runway[];
}

export const MXP: Airport = {
  icao: "LIMC",
  name: "Malpensa",
  runways: [
    { leIdent: "35L", heIdent: "17R", le: [45.6095, 8.7056], he: [45.6444, 8.7118], widthFt: 197 },
    { leIdent: "35R", heIdent: "17L", le: [45.6148, 8.7303], he: [45.6496, 8.7366], widthFt: 197 },
  ],
};

export const LIN: Airport = {
  icao: "LIML",
  name: "Linate",
  runways: [
    { leIdent: "36", heIdent: "18", le: [45.4338, 9.2778], he: [45.4559, 9.2789], widthFt: 148 },
  ],
};

export const BGY: Airport = {
  icao: "LIME",
  name: "Orio al Serio",
  runways: [
    { leIdent: "28", heIdent: "10", le: [45.6739, 9.7153], he: [45.6644, 9.6784], widthFt: 148 },
  ],
};

// --- Città vicine con micro-piste virtuali di 10 metri per posizionamento ---

export const COMO: Airport = {
  icao: "COMO",
  name: "Como",
  runways: [
    { leIdent: "36", heIdent: "18", le: [45.8105, 9.0851], he: [45.8106, 9.0851], widthFt: 1 },
  ],
};

export const LECCO: Airport = {
  icao: "LECCO",
  name: "Lecco",
  runways: [
    { leIdent: "36", heIdent: "18", le: [45.8558, 9.3973], he: [45.8559, 9.3973], widthFt: 1 },
  ],
};

export const MONZA: Airport = {
  icao: "MONZA",
  name: "Monza",
  runways: [
    { leIdent: "36", heIdent: "18", le: [45.5845, 9.2744], he: [45.5846, 9.2744], widthFt: 1 },
  ],
};

// --- Geometria Vettoriale del Lago di Como mappata come Runway ---

export const LAGO_DI_COMO: Airport = {
  icao: "LAGO",
  name: "Lago di Como",
  runways: [
    // RAMO NORD (Dall'alto a scendere verso Bellagio)
    { leIdent: "W01", heIdent: "E01", le: [46.1552, 9.3789], he: [46.1042, 9.3496], widthFt: 3000 }, // Gera Lario -> Dongo
    { leIdent: "W02", heIdent: "E02", le: [46.1042, 9.3496], he: [46.0156, 9.2750], widthFt: 3000 }, // Dongo -> Menaggio
    { leIdent: "W03", heIdent: "E03", le: [46.0156, 9.2750], he: [45.9918, 9.2618], widthFt: 3000 }, // Menaggio -> Centro Lago (Punta di Bellagio)

    // RAMO DI COMO (Da Bellagio giù a Como città - segue la costa a zig zag)
    { leIdent: "W04", heIdent: "E04", le: [45.9918, 9.2618], he: [45.9542, 9.2081], widthFt: 2000 }, // Bellagio -> Lenno
    { leIdent: "W05", heIdent: "E05", le: [45.9542, 9.2081], he: [45.9171, 9.1302], widthFt: 2000 }, // Lenno -> Argegno
    { leIdent: "W06", heIdent: "E06", le: [45.9171, 9.1302], he: [45.8752, 9.1328], widthFt: 1800 }, // Argegno -> Laglio / Moltrasio
    { leIdent: "W07", heIdent: "E07", le: [45.8752, 9.1328], he: [45.8340, 9.0760], widthFt: 1500 }, // Moltrasio -> Cernobbio
    { leIdent: "W08", heIdent: "E08", le: [45.8340, 9.0760], he: [45.8143, 9.0831], widthFt: 1500 }, // Cernobbio -> Como Bacino

    // RAMO DI LECCO (Da Bellagio giù a Lecco città)
    { leIdent: "W09", heIdent: "E09", le: [45.9918, 9.2618], he: [45.9328, 9.3175], widthFt: 1800 }, // Bellagio -> Lierna
    { leIdent: "W10", heIdent: "E10", le: [45.9328, 9.3175], he: [45.8942, 9.3402], widthFt: 1500 }, // Lierna -> Mandello del Lario
    { leIdent: "W11", heIdent: "E11", le: [45.8942, 9.3402], he: [45.8490, 9.3940], widthFt: 1200 }, // Mandello -> Lecco centro
  ],
};

/** Airports and cities drawn on the map. */
export const AIRPORTS: Airport[] = [MXP, LIN, BGY, COMO, LECCO, MONZA, LAGO_DI_COMO];