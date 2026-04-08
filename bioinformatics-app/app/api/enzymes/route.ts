import { NextResponse } from "next/server";

// Available restriction enzymes
const AVAILABLE_ENZYMES = [
  "EcoRI",
  "BamHI",
  "HindIII",
  "PstI",
  "XbaI",
  "NotI",
  "SalI",
  "XhoI",
  "SmaI",
  "KpnI",
  "SacI",
  "SphI",
  "NcoI",
  "NdeI",
  "BglII",
  "AvaI",
  "BclI",
  "EcoRV",
  "HaeIII",
  "AluI",
];

export async function GET() {
  return NextResponse.json({ availableEnzymes: AVAILABLE_ENZYMES });
}
