import { NextResponse } from "next/server";

// Fallback enzyme list in case backend is not available
const FALLBACK_ENZYMES = [
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
  try {
    // Try to fetch from the NestJS backend first
    const response = await fetch("http://localhost:3001/analyze/enzymes", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(3000), // 3 second timeout
    });

    if (response.ok) {
      const data = await response.json();
      // Handle both snake_case and camelCase responses
      const enzymes =
        data.availableEnzymes || data.available_enzymes || FALLBACK_ENZYMES;
      return NextResponse.json({ availableEnzymes: enzymes });
    }
  } catch (error) {
    console.log("Backend not available, using fallback enzyme list");
  }

  // Return fallback enzyme list
  return NextResponse.json({ availableEnzymes: FALLBACK_ENZYMES });
}
