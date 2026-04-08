import { NextRequest, NextResponse } from "next/server";

// Restriction enzyme recognition sites
const ENZYME_SITES: Record<string, string> = {
  EcoRI: "GAATTC",
  BamHI: "GGATCC",
  HindIII: "AAGCTT",
  PstI: "CTGCAG",
  XbaI: "TCTAGA",
  NotI: "GCGGCCGC",
  SalI: "GTCGAC",
  XhoI: "CTCGAG",
  SmaI: "CCCGGG",
  KpnI: "GGTACC",
  SacI: "GAGCTC",
  SphI: "GCATGC",
  NcoI: "CCATGG",
  NdeI: "CATATG",
  BglII: "AGATCT",
  AvaI: "CYCGRG",
  BclI: "TGATCA",
  EcoRV: "GATATC",
  HaeIII: "GGCC",
  AluI: "AGCT",
};

/**
 * Find cutting sites for a restriction enzyme in a sequence
 */
function findCuttingSites(sequence: string, recognitionSeq: string): number[] {
  const sites: number[] = [];
  const seq = sequence.toUpperCase();
  const recognition = recognitionSeq.toUpperCase();

  // Handle degenerate bases in recognition sequence
  const pattern = recognition
    .replace(/R/g, "[AG]") // A or G
    .replace(/Y/g, "[CT]") // C or T
    .replace(/M/g, "[AC]") // A or C
    .replace(/K/g, "[GT]") // G or T
    .replace(/S/g, "[GC]") // G or C
    .replace(/W/g, "[AT]") // A or T
    .replace(/B/g, "[CGT]") // C, G, or T
    .replace(/D/g, "[AGT]") // A, G, or T
    .replace(/H/g, "[ACT]") // A, C, or T
    .replace(/V/g, "[ACG]") // A, C, or G
    .replace(/N/g, "[ACGT]"); // Any base

  const regex = new RegExp(pattern, "g");
  let match;

  while ((match = regex.exec(seq)) !== null) {
    sites.push(match.index);
  }

  return sites;
}

/**
 * Validate DNA sequence
 */
function validateDNASequence(sequence: string): {
  isValid: boolean;
  error?: string;
} {
  if (!sequence || sequence.length === 0) {
    return { isValid: false, error: "Sequence is required" };
  }

  const upperSequence = sequence.toUpperCase();
  if (!/^[ATCG]+$/.test(upperSequence)) {
    return {
      isValid: false,
      error: "Invalid DNA sequence. Only A, T, C, G characters are allowed",
    };
  }

  return { isValid: true };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sequence, enzymes } = body;

    // Validate input
    if (!sequence) {
      return NextResponse.json(
        { error: "Sequence is required" },
        { status: 400 },
      );
    }

    if (!enzymes || !Array.isArray(enzymes) || enzymes.length === 0) {
      return NextResponse.json(
        { error: "At least one enzyme must be specified" },
        { status: 400 },
      );
    }

    const upperSequence = sequence.toUpperCase().trim();

    // Validate DNA sequence
    const validation = validateDNASequence(upperSequence);
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Analyze restriction sites
    const analysisResults: Record<
      string,
      {
        cutting_sites: number[];
        fragments: number;
        recognitionSequence?: string;
        error?: string;
      }
    > = {};

    for (const enzyme of enzymes) {
      const recognitionSeq = ENZYME_SITES[enzyme];

      if (recognitionSeq) {
        const cuttingSites = findCuttingSites(upperSequence, recognitionSeq);

        analysisResults[enzyme] = {
          cutting_sites: cuttingSites,
          fragments: cuttingSites.length + 1,
          recognitionSequence: recognitionSeq,
        };
      } else {
        analysisResults[enzyme] = {
          cutting_sites: [],
          fragments: 0,
          error: `Unknown enzyme: ${enzyme}`,
        };
      }
    }

    return NextResponse.json({
      sequence: upperSequence,
      analysisResults,
      totalEnzymes: enzymes.length,
    });
  } catch (error) {
    console.error("Error in restriction analysis:", error);
    return NextResponse.json(
      { error: "Failed to analyze restriction sites" },
      { status: 500 },
    );
  }
}
