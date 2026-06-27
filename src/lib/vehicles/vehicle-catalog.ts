/**
 * Practical static vehicle catalog — common U.S. makes and their best-known
 * models. Not exhaustive: every make supports a "Model not listed → type it"
 * fallback, so the list just needs to cover the usual cases so a stressed buyer
 * can TAP instead of TYPE. Keep additions alphabetical-ish within a make by
 * popularity.
 */

export const MODELS_BY_MAKE: Record<string, string[]> = {
  Toyota: ["Camry", "Corolla", "RAV4", "Highlander", "Sienna", "Tacoma", "Tundra", "4Runner", "Prius", "Sequoia", "Crown"],
  Honda: ["Accord", "Civic", "CR-V", "HR-V", "Pilot", "Odyssey", "Ridgeline", "Passport"],
  Nissan: ["Altima", "Sentra", "Rogue", "Pathfinder", "Murano", "Frontier", "Titan", "Armada", "Kicks"],
  Ford: ["F-150", "Escape", "Explorer", "Bronco", "Mustang", "Edge", "Expedition", "Ranger", "Maverick"],
  Chevrolet: ["Silverado", "Equinox", "Malibu", "Traverse", "Tahoe", "Suburban", "Trailblazer", "Colorado", "Blazer"],
  GMC: ["Sierra", "Terrain", "Acadia", "Yukon", "Canyon"],
  Hyundai: ["Elantra", "Sonata", "Tucson", "Santa Fe", "Palisade", "Kona", "Ioniq 5"],
  Kia: ["Forte", "K5", "Sportage", "Sorento", "Telluride", "Soul", "EV6", "Carnival"],
  Subaru: ["Outback", "Forester", "Crosstrek", "Impreza", "Legacy", "Ascent"],
  Mazda: ["Mazda3", "Mazda6", "CX-30", "CX-5", "CX-50", "CX-9", "CX-90"],
  Volkswagen: ["Jetta", "Passat", "Tiguan", "Atlas", "Golf", "Taos", "ID.4"],
  BMW: ["3 Series", "5 Series", "X1", "X3", "X5", "X7", "4 Series", "i4"],
  "Mercedes-Benz": ["C-Class", "E-Class", "GLC", "GLE", "GLB", "A-Class", "GLS"],
  Audi: ["A4", "A6", "Q3", "Q5", "Q7", "A3", "Q8", "e-tron"],
  Lexus: ["ES", "RX", "NX", "GX", "IS", "UX", "TX"],
  Acura: ["Integra", "TLX", "MDX", "RDX"],
  Jeep: ["Grand Cherokee", "Wrangler", "Cherokee", "Compass", "Gladiator", "Wagoneer"],
  Ram: ["1500", "2500", "3500", "ProMaster"],
  Dodge: ["Charger", "Challenger", "Durango", "Hornet"],
  Chrysler: ["Pacifica", "300"],
  Cadillac: ["Escalade", "XT5", "XT4", "XT6", "CT5", "Lyriq"],
  Volvo: ["XC40", "XC60", "XC90", "S60", "V60"],
  Tesla: ["Model 3", "Model Y", "Model S", "Model X", "Cybertruck"],
  Porsche: ["Macan", "Cayenne", "911", "Panamera", "Taycan"],
  "Land Rover": ["Range Rover", "Range Rover Sport", "Defender", "Discovery"],
  Jaguar: ["F-PACE", "E-PACE", "XF", "I-PACE"],
  Mitsubishi: ["Outlander", "Eclipse Cross", "Outlander Sport", "Mirage"],
  Genesis: ["G70", "G80", "GV70", "GV80"],
  Lincoln: ["Corsair", "Nautilus", "Aviator", "Navigator"],
  MINI: ["Cooper", "Countryman", "Clubman"],
  Buick: ["Encore", "Enclave", "Envision", "Envista"],
  INFINITI: ["QX50", "QX60", "QX80", "Q50"],
};

/** Makes shown in the selector, in a sensible (popularity-ish) order. */
export const VEHICLE_MAKES: string[] = [
  "Toyota", "Honda", "Ford", "Chevrolet", "Nissan", "Hyundai", "Kia", "Subaru",
  "Jeep", "Ram", "GMC", "Mazda", "Volkswagen", "BMW", "Mercedes-Benz", "Audi",
  "Lexus", "Acura", "Dodge", "Chrysler", "Cadillac", "Buick", "Volvo", "Tesla",
  "Porsche", "Land Rover", "Jaguar", "Mitsubishi", "Genesis", "Lincoln", "MINI",
  "INFINITI",
];

/** Models for a make, or [] if unknown (selector then offers manual entry). */
export function modelsForMake(make: string | undefined | null): string[] {
  if (!make) return [];
  return MODELS_BY_MAKE[make] ?? [];
}
