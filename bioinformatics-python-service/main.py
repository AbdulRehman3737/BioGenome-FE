from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional

from Bio.Seq import Seq
from Bio.SeqUtils import gc_fraction
from Bio.SeqRecord import SeqRecord

from Bio.Restriction import RestrictionBatch, Analysis

import json
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Bioinformatics Python Service",
    description="Advanced bioinformatics analysis using Biopython",
    version="1.0.0"
)

class SequenceRequest(BaseModel):
    sequence: str
    sequence_type: str  # 'dna', 'rna', 'protein'
    analysis_options: Optional[Dict] = {}


class RestrictionRequest(BaseModel):
    sequence: str
    enzymes: List[str] = []

class AnalysisResult(BaseModel):
    sequence: str
    sequence_type: str
    length: int
    gc_content: float
    molecular_weight: float
    reverse_complement: Optional[str] = None
    transcription: Optional[str] = None
    translation: Optional[str] = None
    orf_regions: Optional[List[Dict]] = None
    errors: Optional[List[str]] = None
    is_valid: bool

@app.get("/")
async def root():
    return {"message": "Bioinformatics Python Service with Biopython"}

@app.post("/analyze", response_model=AnalysisResult)
async def analyze_sequence(request: SequenceRequest):
    """Comprehensive sequence analysis using Biopython"""
    try:
        sequence = request.sequence.upper().strip()
        seq_type = request.sequence_type.lower()
        options = request.analysis_options or {}
        
        # Validate sequence
        validation_result = validate_sequence(sequence, seq_type)
        if not validation_result["is_valid"]:
            return AnalysisResult(
                sequence=sequence,
                sequence_type=seq_type,
                length=len(sequence),
                gc_content=0.0,
                molecular_weight=0.0,
                is_valid=False,
                errors=validation_result["errors"]
            )
        
        # Create Biopython Seq object
        bio_seq = Seq(sequence)
        
        # Basic analysis
        length = len(bio_seq)
        gc_content_val = gc_fraction(bio_seq)
        # Calculate molecular weight manually for simplicity
        mw = calculate_molecular_weight(bio_seq, seq_type)
        
        # Initialize results
        reverse_complement = None
        transcription = None
        translation = None
        orf_regions = None
        
        # Type-specific analysis
        if seq_type == "dna":
            # DNA analysis
            reverse_complement = str(bio_seq.reverse_complement())
            transcription = str(bio_seq.transcribe())
            translation = str(bio_seq.translate())
            orf_regions = find_orfs(bio_seq)
            
        elif seq_type == "rna":
            # RNA analysis
            translation = str(bio_seq.translate())
            orf_regions = find_orfs(bio_seq)
            
        elif seq_type == "protein":
            # Protein analysis - just basic stats
            pass
        
        return AnalysisResult(
            sequence=sequence,
            sequence_type=seq_type,
            length=length,
            gc_content=round(gc_content_val, 2),
            molecular_weight=round(mw, 2),
            reverse_complement=reverse_complement,
            transcription=transcription,
            translation=translation,
            orf_regions=orf_regions,
            is_valid=True
        ).dict()
        
    except Exception as e:
        logger.error(f"Error analyzing sequence: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@app.post("/restriction")
async def analyze_restriction_sites(request: RestrictionRequest):
    """Restriction enzyme analysis using simple pattern matching"""
    try:
        sequence = request.sequence.upper().strip()
        enzymes = request.enzymes
        
        if not validate_sequence(sequence, "dna")["is_valid"]:
            raise HTTPException(status_code=400, detail="Invalid DNA sequence")
        
        # If no specific enzymes provided, use common ones
        if not enzymes:
            enzymes = ['EcoRI', 'BamHI', 'HindIII', 'PstI', 'XbaI']
        
        # Simple restriction enzyme recognition sites
        enzyme_sites = {
            'EcoRI': 'GAATTC',
            'BamHI': 'GGATCC',
            'HindIII': 'AAGCTT',
            'PstI': 'CTGCAG',
            'XbaI': 'TCTAGA',
            'NotI': 'GCGGCCGC',
            'SalI': 'GTCGAC',
            'XhoI': 'CTCGAG'
        }
        
        # Get cutting sites for each enzyme
        results = {}
        for enzyme in enzymes:
            recognition_seq = enzyme_sites.get(enzyme)
            if recognition_seq:
                # Find cutting sites using simple string matching
                sites_list = []
                for i in range(len(sequence) - len(recognition_seq) + 1):
                    if sequence[i:i+len(recognition_seq)] == recognition_seq:
                        sites_list.append(i)
                
                results[enzyme] = {
                    "cutting_sites": sites_list,
                    "fragments": len(sites_list) + 1 if sites_list else 1,
                    "recognition_sequence": recognition_seq
                }
            else:
                results[enzyme] = {"error": f"Unknown enzyme: {enzyme}"}
        
        return {
            "sequence": sequence,
            "analysis_results": results,
            "total_enzymes": len(enzymes)
        }
        
    except Exception as e:
        logger.error(f"Error in restriction analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Restriction analysis failed: {str(e)}")

@app.get("/available-enzymes")
async def get_available_enzymes():
    """Get list of available restriction enzymes"""
    try:
        from Bio.Restriction import Restriction_Dictionary
        enzymes = list(Restriction_Dictionary.rest_dict.keys())
        return {"available_enzymes": enzymes[:50]}  # Return first 50 for brevity
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get enzymes: {str(e)}")

def calculate_molecular_weight(sequence: Seq, seq_type: str) -> float:
    """Calculate approximate molecular weight"""
    if seq_type == "dna":
        # Approximate MW for DNA: A=331.2, T=322.2, C=307.2, G=347.2
        mw_map = {'A': 331.2, 'T': 322.2, 'C': 307.2, 'G': 347.2}
        return sum(mw_map.get(base, 0) for base in str(sequence))
    elif seq_type == "rna":
        # Approximate MW for RNA: A=347.2, U=324.2, C=323.2, G=363.2
        mw_map = {'A': 347.2, 'U': 324.2, 'C': 323.2, 'G': 363.2}
        return sum(mw_map.get(base, 0) for base in str(sequence))
    elif seq_type == "protein":
        # Approximate MW for amino acids (average ~110 Da)
        return len(sequence) * 110.0
    return 0.0

def validate_sequence(sequence: str, seq_type: str) -> Dict:
    """Validate sequence based on type"""
    errors = []
    
    if not sequence or len(sequence) == 0:
        errors.append("Sequence cannot be empty")
        return {"is_valid": False, "errors": errors}
    
    if seq_type == "dna":
        if not all(base in "ATCG" for base in sequence):
            errors.append("DNA sequence can only contain A, T, C, G characters")
    elif seq_type == "rna":
        if not all(base in "AUCG" for base in sequence):
            errors.append("RNA sequence can only contain A, U, C, G characters")
    elif seq_type == "protein":
        protein_bases = "ACDEFGHIKLMNPQRSTVWY"
        if not all(base in protein_bases for base in sequence):
            errors.append("Protein sequence contains invalid amino acid codes")
    
    return {"is_valid": len(errors) == 0, "errors": errors}

def find_orfs(sequence: Seq) -> List[Dict]:
    """Find Open Reading Frames in a sequence"""
    orfs = []
    
    # Check all 6 reading frames
    for frame in range(3):
        # Forward strand
        seq_frame = sequence[frame:]
        for i in range(0, len(seq_frame) - 3, 3):
            codon = seq_frame[i:i+3]
            if codon == "ATG":  # Start codon
                # Look for stop codon
                for j in range(i + 3, len(seq_frame) - 3, 3):
                    stop_codon = seq_frame[j:j+3]
                    if stop_codon in ["TAA", "TAG", "TGA"]:
                        orf_seq = seq_frame[i:j+3]
                        orfs.append({
                            "start": i + frame,
                            "end": j + frame + 3,
                            "length": len(orf_seq),
                            "sequence": str(orf_seq),
                            "translation": str(orf_seq.translate()),
                            "frame": frame + 1
                        })
                        break
    
    # Reverse complement
    rev_seq = sequence.reverse_complement()
    for frame in range(3):
        seq_frame = rev_seq[frame:]
        for i in range(0, len(seq_frame) - 3, 3):
            codon = seq_frame[i:i+3]
            if codon == "ATG":  # Start codon
                for j in range(i + 3, len(seq_frame) - 3, 3):
                    stop_codon = seq_frame[j:j+3]
                    if stop_codon in ["TAA", "TAG", "TGA"]:
                        orf_seq = seq_frame[i:j+3]
                        orfs.append({
                            "start": len(sequence) - (j + frame + 3),
                            "end": len(sequence) - (i + frame),
                            "length": len(orf_seq),
                            "sequence": str(orf_seq),
                            "translation": str(orf_seq.translate()),
                            "frame": -(frame + 1)  # Negative for reverse strand
                        })
                        break
    
    return orfs


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)