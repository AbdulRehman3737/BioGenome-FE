import { Injectable } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { AxiosResponse } from "axios";
import { Observable } from "rxjs";
import { map, catchError } from "rxjs/operators";

export interface AnalysisResult {
  sequence: string;
  length: number;
  gcContent: number;
  molecularWeight: number;
  reverseComplement?: string;
  transcription?: string;
  translation?: string;
  orfRegions?: Array<{
    start: number;
    end: number;
    length: number;
    sequence: string;
    translation: string;
    frame: number;
  }>;
  isValid: boolean;
  errors?: string[];
}

export interface AlignmentResult {
  alignedSequences: Array<{
    id: string;
    sequence: string;
    description: string;
  }>;
  alignmentLength: number;
  numSequences: number;
}

export interface RestrictionResult {
  sequence: string;
  analysisResults: Record<
    string,
    {
      cuttingSites: number[];
      fragments: number;
      recognitionSequence?: string;
      error?: string;
    }
  >;
  totalEnzymes: number;
}

@Injectable()
export class AppService {
  private readonly pythonServiceUrl = "http://localhost:8000";

  constructor(private readonly httpService: HttpService) {}
  // Genetic code table for translation
  private readonly geneticCode: Record<string, string> = {
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
  private readonly rnaGeneticCode: Record<string, string> = {
    UUU: "F",
    UUC: "F",
    UUA: "L",
    UUG: "L",
    UCU: "S",
    UCC: "S",
    UCA: "S",
    UCG: "S",
    UAU: "Y",
    UAC: "Y",
    UAA: "*",
    UAG: "*",
    UGU: "C",
    UGC: "C",
    UGA: "*",
    UGG: "W",
    CUU: "L",
    CUC: "L",
    CUA: "L",
    CUG: "L",
    CCU: "P",
    CCC: "P",
    CCA: "P",
    CCG: "P",
    CAU: "H",
    CAC: "H",
    CAA: "Q",
    CAG: "Q",
    CGU: "R",
    CGC: "R",
    CGA: "R",
    CGG: "R",
    AUU: "I",
    AUC: "I",
    AUA: "I",
    AUG: "M",
    ACU: "T",
    ACC: "T",
    ACA: "T",
    ACG: "T",
    AAU: "N",
    AAC: "N",
    AAA: "K",
    AAG: "K",
    AGU: "S",
    AGC: "S",
    AGA: "R",
    AGG: "R",
    GUU: "V",
    GUC: "V",
    GUA: "V",
    GUG: "V",
    GCU: "A",
    GCC: "A",
    GCA: "A",
    GCG: "A",
    GAU: "D",
    GAC: "D",
    GAA: "E",
    GAG: "E",
    GGU: "G",
    GGC: "G",
    GGA: "G",
    GGG: "G",
  };

  validateSequence(
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
      // Basic protein validation - allow standard amino acid codes
      if (!/^[ACDEFGHIKLMNPQRSTVWY]+$/.test(upperSequence)) {
        errors.push(
          "Protein sequence can only contain standard amino acid codes",
        );
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  calculateGCContent(sequence: string): number {
    const upperSequence = sequence.toUpperCase();
    const gcCount = (upperSequence.match(/[GC]/g) || []).length;
    return (gcCount / upperSequence.length) * 100;
  }

  getReverseComplement(dnaSequence: string): string {
    const complementMap: Record<string, string> = {
      A: "T",
      T: "A",
      C: "G",
      G: "C",
    };

    return dnaSequence
      .split("")
      .reverse()
      .map((base) => complementMap[base] || base)
      .join("");
  }

  transcribeDNA(dnaSequence: string): string {
    return dnaSequence.replace(/T/g, "U");
  }

  translateSequence(sequence: string, isRNA: boolean = false): string {
    const codonTable = isRNA ? this.rnaGeneticCode : this.geneticCode;
    const seq = isRNA ? sequence : this.transcribeDNA(sequence);

    let protein = "";
    for (let i = 0; i < seq.length - 2; i += 3) {
      const codon = seq.substring(i, i + 3);
      if (codon.length === 3) {
        const aminoAcid = codonTable[codon] || "X";
        if (aminoAcid === "*") break; // Stop translation at stop codon
        protein += aminoAcid;
      }
    }

    return protein;
  }

  async analyzeSequence(
    sequence: string,
    type: string,
  ): Promise<AnalysisResult> {
    try {
      const response: AxiosResponse<AnalysisResult> = await this.httpService
        .post(`${this.pythonServiceUrl}/analyze`, {
          sequence,
          sequence_type: type,
          analysis_options: {},
        })
        .toPromise();

      return response.data;
    } catch (error) {
      throw new Error(`Failed to analyze sequence: ${error.message}`);
    }
  }

  async alignSequences(
    sequences: string[],
    sequenceType: string,
  ): Promise<AlignmentResult> {
    try {
      const response: AxiosResponse<AlignmentResult> = await this.httpService
        .post(`${this.pythonServiceUrl}/align`, {
          sequences,
          sequence_type: sequenceType,
        })
        .toPromise();

      return response.data;
    } catch (error) {
      throw new Error(`Failed to align sequences: ${error.message}`);
    }
  }

  async analyzeRestrictionSites(
    sequence: string,
    enzymes?: string[],
  ): Promise<RestrictionResult> {
    try {
      const response: AxiosResponse<RestrictionResult> = await this.httpService
        .post(`${this.pythonServiceUrl}/restriction`, {
          sequence,
          enzymes: enzymes || [],
        })
        .toPromise();

      return response.data;
    } catch (error) {
      throw new Error(`Failed to analyze restriction sites: ${error.message}`);
    }
  }

  async getAvailableEnzymes(): Promise<{ availableEnzymes: string[] }> {
    try {
      const response: AxiosResponse<{ availableEnzymes: string[] }> =
        await this.httpService
          .get(`${this.pythonServiceUrl}/available-enzymes`)
          .toPromise();

      return response.data;
    } catch (error) {
      throw new Error(`Failed to get available enzymes: ${error.message}`);
    }
  }
}
