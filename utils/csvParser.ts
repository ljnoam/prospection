import { Prospect, ProspectStatus } from '../types';

/**
 * Translates common OpenStreetMap keys to French business terms.
 */
const translateActivity = (val: string): string => {
  const map: Record<string, string> = {
    'bakery': 'Boulangerie',
    'hairdresser': 'Coiffeur',
    'butcher': 'Boucherie',
    'restaurant': 'Restaurant',
    'cafe': 'Café',
    'fast_food': 'Restauration rapide',
    'bar': 'Bar',
    'clothes': 'Vêtements',
    'supermarket': 'Supermarché',
    'convenience': 'Épicerie',
    'car_repair': 'Garage',
    'florist': 'Fleuriste',
    'pharmacy': 'Pharmacie',
    'bank': 'Banque',
    'beauty': 'Institut de beauté',
    'real_estate': 'Agence Immobilière',
    'optician': 'Opticien',
    'jewelry': 'Bijouterie',
    'shoes': 'Chaussures',
    'e-cigarette': 'Vapoteur'
  };
  return map[val.toLowerCase()] || val;
};

/**
 * Parses raw CSV string from Overpass Turbo.
 * Separator: ;
 */
export const parseProspectCSV = (rawCsv: string, cityName: string): Omit<Prospect, 'id'>[] => {
  const lines = rawCsv.split('\n').filter(line => line.trim() !== '');
  if (lines.length < 2) return [];

  // Header parsing to find column indices
  const headerLine = lines[0];
  const headers = headerLine.split(';').map(h => h.trim().toLowerCase());

  const getIdx = (key: string) => headers.indexOf(key);

  const idxName = getIdx('name');
  
  // Phone priority
  const idxPhone = getIdx('phone');
  const idxMobile = getIdx('mobile');
  const idxContactPhone = getIdx('contact:phone');

  // Email priority
  const idxEmail = getIdx('email');
  const idxContactEmail = getIdx('contact:email');

  // Activity priority
  const idxShop = getIdx('shop');
  const idxAmenity = getIdx('amenity');
  const idxCraft = getIdx('craft');

  // Location priority (@lat, ::lat, latitude, lat)
  let idxLat = getIdx('@lat');
  if (idxLat === -1) idxLat = getIdx('::lat');
  if (idxLat === -1) idxLat = getIdx('latitude');
  if (idxLat === -1) idxLat = getIdx('lat');

  let idxLon = getIdx('@lon');
  if (idxLon === -1) idxLon = getIdx('::lon');
  if (idxLon === -1) idxLon = getIdx('longitude');
  if (idxLon === -1) idxLon = getIdx('lon');

  const prospects: Omit<Prospect, 'id'>[] = [];

  // Iterate starting from line 1 (skipping header)
  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(';');

    // Helper to safely get value at index
    const getVal = (index: number) => (index >= 0 && index < row.length ? row[index].trim() : '');

    const name = getVal(idxName);
    
    // Skip if no name
    if (!name) continue;

    // Resolve Phone
    let phone = getVal(idxPhone);
    if (!phone) phone = getVal(idxMobile);
    if (!phone) phone = getVal(idxContactPhone);

    // Resolve Email
    let email = getVal(idxEmail);
    if (!email) email = getVal(idxContactEmail);

    // Resolve Activity
    let activityRaw = getVal(idxShop);
    if (!activityRaw) activityRaw = getVal(idxAmenity);
    if (!activityRaw) activityRaw = getVal(idxCraft);
    const activity = translateActivity(activityRaw);

    // Resolve Geo
    let lat: number | undefined = undefined;
    let lon: number | undefined = undefined;
    
    const latStr = getVal(idxLat);
    const lonStr = getVal(idxLon);

    if (latStr && lonStr) {
        const parsedLat = parseFloat(latStr);
        const parsedLon = parseFloat(lonStr);
        if (!isNaN(parsedLat) && !isNaN(parsedLon)) {
            lat = parsedLat;
            lon = parsedLon;
        }
    }

    prospects.push({
      name,
      phone,
      email,
      activity,
      city: cityName,
      lat,
      lon,
      status: ProspectStatus.TO_CONTACT,
      notes: '',
      createdAt: Date.now()
    });
  }

  return prospects;
};