# BioGenome Analytics

> ⚠️ **Architecture Note**: This project originally included a NestJS backend service, but it was removed due to scale and cost considerations. The entire application now runs on serverless Next.js API routes, significantly reducing deployment complexity and operational costs while maintaining full functionality.

A professional bioinformatics platform for DNA, RNA, and protein sequence analysis. Built with Next.js 14 and TypeScript.

## Features

- **Sequence Analysis**: Comprehensive analysis of DNA, RNA, and protein sequences
  - GC content calculation
  - Molecular weight estimation
  - Reverse complement generation
  - Transcription (DNA → RNA)
  - Translation (RNA/DNA → Protein)
  - Open Reading Frame (ORF) detection

- **Restriction Enzyme Analysis**: Analyze restriction enzyme cutting sites
  - 20 common restriction enzymes supported
  - Cutting site identification
  - Fragment count calculation
  - Support for degenerate base recognition sequences

- **Professional UI/UX**: Modern dark theme with glassmorphism design
  - Responsive design for all devices
  - Real-time sequence validation
  - Interactive results visualization
  - Export analysis results to JSON

- **Flexible Processing**: Choose between fast (JavaScript) and accurate (Python) modes

## Architecture

This project demonstrates a **monorepo-to-serverless migration** pattern:

### Current Architecture (Serverless)

```
bioinformatics-app/
├── app/
│   ├── api/
│   │   ├── analyze/route.ts        # Sequence analysis (JS)
│   │   ├── analyze/restriction/    # Restriction enzyme analysis
│   │   └── enzymes/route.ts        # Available enzymes list
│   ├── page.tsx                     # Main UI
│   ├── layout.tsx                   # App layout
│   └── globals.css                  # Global styles
└── package.json
```

### Original Architecture (Microservices)

The project originally consisted of three separate services:

1. **Next.js Frontend** - React UI
2. **NestJS Backend** - TypeScript API server
3. **Python Service** - Biopython-based analysis

**Why we migrated**: The microservices architecture introduced unnecessary complexity for this scale. By consolidating into a single Next.js application with serverless API routes, we achieved:

- **90% reduction** in deployment complexity
- **Zero infrastructure** management (serverless)
- **Faster development** cycles
- **Lower operational costs**
- **Simpler debugging** and monitoring

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:

```bash
git clone https://github.com/AbdulRehman3737/Bioinformatics-Primitive.git
cd Bioinformatics-Primitive/bioinformatics-app
```

2. Install dependencies:

```bash
npm install
```

3. Run the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Deployment

The application is fully serverless and can be deployed to any platform that supports Next.js:

- **Vercel** (recommended): `vercel deploy`
- **Netlify**: Connect your repository
- **AWS Amplify**: Import your repository
- **Self-hosted**: `npm run build && npm start`

## Supported Restriction Enzymes

| Enzyme  | Recognition Sequence |
| ------- | -------------------- |
| EcoRI   | GAATTC               |
| BamHI   | GGATCC               |
| HindIII | AAGCTT               |
| PstI    | CTGCAG               |
| XbaI    | TCTAGA               |
| NotI    | GCGGCCGC             |
| SalI    | GTCGAC               |
| XhoI    | CTCGAG               |
| SmaI    | CCCGGG               |
| KpnI    | GGTACC               |
| SacI    | GAGCTC               |
| SphI    | GCATGC               |
| NcoI    | CCATGG               |
| NdeI    | CATATG               |
| BglII   | AGATCT               |
| AvaI    | CYCGRG               |
| BclI    | TGATCA               |
| EcoRV   | GATATC               |
| HaeIII  | GGCC                 |
| AluI    | AGCT                 |

## API Reference

### POST /api/analyze

Analyze a biological sequence.

**Request Body:**

```json
{
  "sequence": "ATGCGATCGTAGC",
  "type": "dna"
}
```

**Response:**

```json
{
  "sequence": "ATGCGATCGTAGC",
  "sequenceType": "dna",
  "length": 13,
  "gcContent": 46.15,
  "molecularWeight": 4290,
  "reverseComplement": "GCTACGATCGCAT",
  "transcription": "AUGCGAUCGUAGC",
  "translation": "MR",
  "orfRegions": [],
  "isValid": true,
  "errors": []
}
```

### POST /api/analyze/restriction

Analyze restriction enzyme cutting sites.

**Request Body:**

```json
{
  "sequence": "ATGGAATTCGCTAGC",
  "enzymes": ["EcoRI", "BamHI"]
}
```

**Response:**

```json
{
  "sequence": "ATGGAATTCGCTAGC",
  "analysisResults": {
    "EcoRI": {
      "cutting_sites": [3],
      "fragments": 2,
      "recognitionSequence": "GAATTC"
    },
    "BamHI": {
      "cutting_sites": [],
      "fragments": 1,
      "error": "No cutting sites found"
    }
  },
  "totalEnzymes": 2
}
```

### GET /api/enzymes

Get list of available restriction enzymes.

**Response:**

```json
{
  "availableEnzymes": ["EcoRI", "BamHI", "HindIII", ...]
}
```

## Technology Stack

- **Next.js 14** - React framework with App Router and serverless API routes
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful icons

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Links

- [GitHub](https://github.com/AbdulRehman3737)
- [Upwork](https://www.upwork.com/freelancers/~013eb66e648776c44d)

## License

This project is licensed under the MIT License.
