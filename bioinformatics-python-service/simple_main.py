from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/')
def home():
    return {"message": "Bioinformatics Python Service (Simple)"}

@app.route('/analyze', methods=['POST'])
def analyze_sequence():
    try:
        data = request.json
        sequence = data.get('sequence', '').upper().strip()
        seq_type = data.get('sequence_type', 'dna').lower()
        
        if not sequence:
            return jsonify({
                "error": "Sequence is required"
            }), 400
        
        # Simple validation
        if seq_type == 'dna' and not all(base in 'ATCG' for base in sequence):
            return jsonify({
                "sequence": sequence,
                "sequence_type": seq_type,
                "length": len(sequence),
                "gc_content": 0.0,
                "molecular_weight": 0.0,
                "is_valid": False,
                "errors": ["Invalid DNA sequence"]
            }), 200
        
        # Simple analysis
        length = len(sequence)
        gc_count = sequence.count('G') + sequence.count('C')
        gc_content = (gc_count / length) * 100 if length > 0 else 0
        
        # Simple reverse complement for DNA
        reverse_complement = ""
        if seq_type == 'dna':
            complement_map = {'A': 'T', 'T': 'A', 'C': 'G', 'G': 'C'}
            reverse_complement = ''.join(complement_map.get(base, base) for base in reversed(sequence))
        
        # Simple transcription (DNA to RNA)
        transcription = sequence.replace('T', 'U') if seq_type == 'dna' else ""
        
        # Simple translation (very basic)
        translation = ""
        if seq_type == 'dna':
            # Very basic codon table
            codon_table = {
                'ATG': 'M', 'TTT': 'F', 'TTC': 'F', 'TTA': 'L', 'TTG': 'L',
                'TCT': 'S', 'TCC': 'S', 'TCA': 'S', 'TCG': 'S', 'TAT': 'Y',
                'TAC': 'Y', 'TAA': '*', 'TAG': '*', 'TGT': 'C', 'TGC': 'C',
                'TGA': '*', 'TGG': 'W', 'CTT': 'L', 'CTC': 'L', 'CTA': 'L',
                'CTG': 'L', 'CCT': 'P', 'CCC': 'P', 'CCA': 'P', 'CCG': 'P',
                'CAT': 'H', 'CAC': 'H', 'CAA': 'Q', 'CAG': 'Q', 'CGT': 'R',
                'CGC': 'R', 'CGA': 'R', 'CGG': 'R', 'ATT': 'I', 'ATC': 'I',
                'ATA': 'I', 'ACT': 'T', 'ACC': 'T', 'ACA': 'T', 'ACG': 'T',
                'AAT': 'N', 'AAC': 'N', 'AAA': 'K', 'AAG': 'K', 'AGT': 'S',
                'AGC': 'S', 'AGA': 'R', 'AGG': 'R', 'GTT': 'V', 'GTC': 'V',
                'GTA': 'V', 'GTG': 'V', 'GCT': 'A', 'GCC': 'A', 'GCA': 'A',
                'GCG': 'A', 'GAT': 'D', 'GAC': 'D', 'GAA': 'E', 'GAG': 'E',
                'GGT': 'G', 'GGC': 'G', 'GGA': 'G', 'GGG': 'G'
            }
            for i in range(0, len(sequence) - 2, 3):
                codon = sequence[i:i+3]
                if codon in codon_table:
                    aa = codon_table[codon]
                    if aa == '*':
                        break
                    translation += aa
        
        return jsonify({
            "sequence": sequence,
            "sequence_type": seq_type,
            "length": length,
            "gc_content": round(gc_content, 2),
            "molecular_weight": round(length * 330, 2),  # Approximate MW
            "reverse_complement": reverse_complement,
            "transcription": transcription,
            "translation": translation,
            "is_valid": True
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/restriction', methods=['POST'])
def analyze_restriction_sites():
    try:
        data = request.json
        sequence = data.get('sequence', '').upper().strip()
        enzymes = data.get('enzymes', [])
        
        if not sequence:
            return jsonify({"error": "Sequence is required"}), 400
        
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
        
        analysis_results = {}
        
        for enzyme in enzymes:
            recognition_seq = enzyme_sites.get(enzyme)
            if recognition_seq:
                # Find cutting sites
                sites = []
                for i in range(len(sequence) - len(recognition_seq) + 1):
                    if sequence[i:i+len(recognition_seq)] == recognition_seq:
                        sites.append(i)
                
                analysis_results[enzyme] = {
                    "cuttingSites": sites,
                    "fragments": len(sites) + 1 if sites else 1,
                    "recognitionSequence": recognition_seq
                }
            else:
                analysis_results[enzyme] = {
                    "error": f"Unknown enzyme: {enzyme}"
                }
        
        return jsonify({
            "sequence": sequence,
            "analysisResults": analysis_results,
            "totalEnzymes": len(enzymes)
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/available-enzymes')
def get_available_enzymes():
    enzymes = ['EcoRI', 'BamHI', 'HindIII', 'PstI', 'XbaI', 'NotI', 'SalI', 'XhoI']
    return jsonify({"available_enzymes": enzymes})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)
