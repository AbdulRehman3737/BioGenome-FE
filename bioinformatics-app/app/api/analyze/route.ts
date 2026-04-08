import { NextRequest, NextResponse } from "next/server";

// Genetic code table for translation (DNA codons)
const GENETIC_CODE: Record<string, string> = {
  TTT: "F",
  TTC: "F",
  TTA: "L",
  TTG: "L",
  TCT: "S",
  TCC: "S",
  TCA: "S",
  TCG: "S",
  TAT: "Y",
  TAC: "Y",
  TAA: "*",
  TAG: "*",
  TGT: "C",
  TGC: "C",
  TGA: "*",
  TGG: "W",
  CTT: "L",
  CTC: "L",
  CTA: "L",
  CTG: "L",
  CCT: "P",
  CCC: "P",
  CCA: "P",
  CCG: "P",
  CAT: "H",
  CAC: "H",
  CAA: "Q",
  CAG: "Q",
  CGT: "R",
  CGC: "R",
  CGA: "R",
  CGG: "R",
  ATT: "I",
  ATC: "I",
  ATA: "I",
  ATG: "M",
  ACT: "T",
  ACC: "T",
  ACA: "T",
  ACG: "T",
  AAT: "N",
  AAC: "N",
  AAA: "K",
  AAG: "K",
  AGT: "S",
  AGC: "S",
  AGA: "R",
  AGG: "R",
  GTT: "V",
  GTC: "V",
  GTA: "V",
  GTG: "V",
  GCT: "A",
  GCC: "A",
  GCA: "A",
  GCG: "A",
  GAT: "D",
  GAC: "D",
  GAA: "E",
  GAG: "E",
  GGT: "G",
  GGC: "G",
  GGA: "G",
  GGG: "G",
};

// RNA genetic code (U instead of T)
const RNA_GENETIC_CODE: Record<string, string> = {};
Object.entries(GENETIC_CODE).forEach(([dnaCodon, aminoAcid]) => {
  const rnaCodon = dnaCodon.replace(/T/g, "U");
  RNA_GENETIC_CODE[rnaCodon] = aminoAcid;
});

// Complement map for DNA
const DNA_COMPLEMENT: Record<string, string> = {
  A: "T",
  T: "A",
  C: "G",
  G: "C",
};

// Start codons for ORF detection
const START_CODONS = ["ATG"];
const STOP_CODONS = ["TAA", "TAG", "TGA"];

/**
 * Validate a biological sequence based on type
 */
function validateSequence(
  sequence: string,
  type: string,
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!sequence || sequence.length === 0) {
    errors.push("Sequence cannot be empty");
    return { isValid: false, errors };
  }

  const upperSequence = sequence.toUpperCase();

  if (type === "dna") {
    if (!/^[ATCG]+$/.test(upperSequence)) {
      errors.push("DNA sequence can only contain A, T, C, G characters");
    }
  } else if (type === "rna") {
    if (!/^[AUCG]+$/.test(upperSequence)) {
      errors.push("RNA sequence can only contain A, U, C, G characters");
    }
  } else if (type === "protein") {
    if (!/^[ACDEFGHIKLMNPQRSTVWY]+$/.test(upperSequence)) {
      errors.push(
        "Protein sequence can only contain standard amino acid codes",
      );
    }
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Calculate GC content of a sequence
 */
function calculateGCContent(sequence: string): number {
  const upperSequence = sequence.toUpperCase();
  const gcCount = (upperSequence.match(/[GC]/g) || []).length;
  return (gcCount / upperSequence.length) * 100;
}

/**
 * Get reverse complement of a DNA sequence
 */
function getReverseComplement(dnaSequence: string): string {
  return dnaSequence
    .toUpperCase()
    .split("")
    .reverse()
    .map((base) => DNA_COMPLEMENT[base] || base)
    .join("");
}

/**
 * Transcribe DNA to RNA (replace T with U)
 */
function transcribeDNA(dnaSequence: string): string {
  return dnaSequence.toUpperCase().replace(/T/g, "U");
}

/**
 * Find the first start codon (ATG) position in a DNA sequence
 * Searches for ATG at any position (not just in-frame)
 */
function findStartCodonPosition(dnaSequence: string): number {
  const seq = dnaSequence.toUpperCase();
  // Search for ATG at any position
  for (let i = 0; i <= seq.length - 3; i++) {
    const codon = seq.substring(i, i + 3);
    if (codon === "ATG") {
      return i;
    }
  }
  return -1; // No start codon found
}

/**
 * Translate a sequence to protein
 * If fromStartCodon is true, finds the first ATG and translates from there
 * Returns empty string if no start codon is found
 */
function translateSequence(
  sequence: string,
  isRNA: boolean = false,
  fromStartCodon: boolean = true,
): string {
  // Use DNA codon table - work with DNA directly
  const codonTable = GENETIC_CODE;
  // Convert to uppercase, keep as DNA (don't transcribe to RNA)
  let seq = sequence.toUpperCase();

  // If input is RNA, convert to DNA for lookup in DNA codon table
  if (isRNA) {
    seq = seq.replace(/U/g, "T");
  }

  // If fromStartCodon is true, find the first ATG and start translation from there
  if (fromStartCodon) {
    const startPos = findStartCodonPosition(seq);
    if (startPos === -1) {
      return ""; // No start codon found - return empty protein
    }
    // Start translation from the start codon position
    seq = seq.substring(startPos);
  }

  // Translate codon by codon
  let protein = "";
  for (let i = 0; i <= seq.length - 3; i += 3) {
    const codon = seq.substring(i, i + 3);
    if (codon.length === 3) {
      const aminoAcid = codonTable[codon];
      if (!aminoAcid) continue; // Skip unknown codons
      if (aminoAcid === "*") break; // Stop at stop codon
      protein += aminoAcid;
    }
  }

  return protein;
}

/**
 * Find Open Reading Frames (ORFs) in a DNA sequence
 */
function findORFs(dnaSequence: string): Array<{
  start: number;
  end: number;
  length: number;
  sequence: string;
  translation: string;
  frame: number;
}> {
  const orfs: Array<{
    start: number;
    end: number;
    length: number;
    sequence: string;
    translation: string;
    frame: number;
  }> = [];

  const seq = dnaSequence.toUpperCase();

  // Check all 3 forward frames
  for (let frame = 0; frame < 3; frame++) {
    let i = frame;
    while (i <= seq.length - 3) {
      const codon = seq.substring(i, i + 3);

      // Look for start codon
      if (START_CODONS.includes(codon)) {
        // Find the stop codon
        let j = i + 3;
        while (j <= seq.length - 3) {
          const stopCodon = seq.substring(j, j + 3);
          if (STOP_CODONS.includes(stopCodon)) {
            // Found an ORF
            const orfSequence = seq.substring(i, j + 3);
            const translation = translateSequence(orfSequence);

            orfs.push({
              start: i,
              end: j + 3,
              length: orfSequence.length,
              sequence: orfSequence,
              translation: translation,
              frame: frame + 1,
            });

            i = j + 3;
            break;
          }
          j += 3;
        }
        if (j > seq.length - 3) {
          i = j;
        }
      } else {
        i += 3;
      }
    }
  }

  // Sort by length (longest first) and limit to top 10
  return orfs.sort((a, b) => b.length - a.length).slice(0, 10);
}

/**
 * Calculate approximate molecular weight
 */
function calculateMolecularWeight(sequence: string): number {
  // Average molecular weight of a nucleotide is approximately 330 Da
  return sequence.length * 330;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sequence, type } = body;

    // Validate input
    if (!sequence || !type) {
      return NextResponse.json(
        { error: "Sequence and type are required" },
        { status: 400 },
      );
    }

    const upperSequence = sequence.toUpperCase().trim();

    // Validate sequence
    const validation = validateSequence(upperSequence, type);

    if (!validation.isValid) {
      return NextResponse.json({
        sequence: upperSequence,
        sequenceType: type,
        length: upperSequence.length,
        gcContent: 0,
        molecularWeight: 0,
        reverseComplement: "",
        transcription: "",
        translation: "",
        orfRegions: [],
        isValid: false,
        errors: validation.errors,
      });
    }

    // Perform analysis
    const length = upperSequence.length;
    const gcContent = calculateGCContent(upperSequence);
    const molecularWeight = calculateMolecularWeight(upperSequence);

    let reverseComplement = "";
    let transcription = "";
    let translation = "";
    let orfRegions: Array<{
      start: number;
      end: number;
      length: number;
      sequence: string;
      translation: string;
      frame: number;
    }> = [];

    if (type === "dna") {
      reverseComplement = getReverseComplement(upperSequence);
      transcription = transcribeDNA(upperSequence);
      translation = translateSequence(upperSequence);
      orfRegions = findORFs(upperSequence);
    } else if (type === "rna") {
      // Convert RNA to DNA for some operations
      const dnaSequence = upperSequence.replace(/U/g, "T");
      reverseComplement = getReverseComplement(dnaSequence);
      transcription = upperSequence; // RNA is already transcribed
      translation = translateSequence(upperSequence, true);
      orfRegions = findORFs(dnaSequence);
    } else if (type === "protein") {
      translation = upperSequence;
    }

    return NextResponse.json({
      sequence: upperSequence,
      sequenceType: type,
      length,
      gcContent: Math.round(gcContent * 100) / 100,
      molecularWeight: Math.round(molecularWeight * 100) / 100,
      reverseComplement,
      transcription,
      translation,
      orfRegions,
      isValid: true,
      errors: [],
    });
  } catch (error) {
    console.error("Error analyzing sequence:", error);
    return NextResponse.json(
      { error: "Failed to analyze sequence" },
      { status: 500 },
    );
  }
}
