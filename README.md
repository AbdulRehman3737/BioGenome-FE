# Bioinformatics-Primitive

A comprehensive bioinformatics web application built with modern technologies, providing advanced sequence analysis capabilities using Biopython.

## 🏗️ Architecture

This is a **monorepo** containing three interconnected services:

```
Bioinformatics-Primitive/
├── bioinformatics-app/          # 🎨 Next.js Frontend (React)
├── bioinformatics-backend/      # 🚀 Nest.js API Gateway (Node.js)
├── bioinformatics-python-service/ # 🐍 Python Biopython Service
├── README.md
├── README-SETUP.md
├── setup.sh
└── .gitignore
```

### Why a Monorepo?

- **Easier dependency management** between services
- **Simplified deployment** and CI/CD setup
- **Better development workflow** with all services in one place
- **Single source of truth** for the entire application
- **Easier version compatibility** management

## 🚀 Features

### Basic Sequence Analysis

- **Length calculation** - Get sequence length
- **GC Content** - Calculate GC percentage
- **Molecular Weight** - Estimate molecular weight
- **Reverse Complement** - Generate DNA reverse complement
- **Transcription** - DNA to RNA conversion
- **Translation** - DNA/RNA to protein conversion
- **ORF Detection** - Find Open Reading Frames

### Restriction Enzyme Analysis

- **Multiple Enzyme Support** - Analyze with multiple enzymes
- **Cutting Site Detection** - Find restriction sites
- **Fragment Analysis** - Calculate fragment sizes
- **Recognition Sequences** - View enzyme recognition patterns

## 🛠️ Tech Stack

### Frontend (bioinformatics-app/)

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **React Hook Form** - Form management
- **SWR** - Data fetching

### Backend (bioinformatics-backend/)

- **Nest.js** - Node.js framework
- **TypeScript** - Type-safe development
- **Axios** - HTTP client for Python service communication
- **Express** - Web server

### Python Service (bioinformatics-python-service/)

- **FastAPI** - Modern Python web framework
- **Biopython** - Bioinformatics library
- **Flask** - Alternative simple service

## 📦 Installation

### Prerequisites

- **Node.js** (v18 or higher)
- **Python** (v3.8 or higher)
- **pip** (Python package manager)

### Quick Setup

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd Bioinformatics-Primitive
   ```

2. **Run the setup script**

   ```bash
   ./setup.sh  # Linux/Mac
   # or
   setup.bat   # Windows
   ```

3. **Start all services**

   ```bash
   # Terminal 1: Start Python service
   cd bioinformatics-python-service
   python simple_main.py

   # Terminal 2: Start Nest.js backend
   cd bioinformatics-backend
   npm run start:dev

   # Terminal 3: Start Next.js frontend
   cd bioinformatics-app
   npm run dev
   ```

4. **Open your browser**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - Python Service: http://localhost:8000

### Manual Installation

See [README-SETUP.md](README-SETUP.md) for detailed manual installation instructions.

## 🎯 Usage

1. **Launch the application** at http://localhost:3000
2. **Select analysis type**:
   - **Basic Analysis**: Comprehensive sequence analysis
   - **Restriction Analysis**: Enzyme cutting site analysis
3. **Enter your sequence** (DNA, RNA, or Protein)
4. **Select options** (sequence type, enzymes, etc.)
5. **Analyze** and view results with interactive visualizations

## 📁 Project Structure

### Frontend Structure

```
bioinformatics-app/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes (proxy to backend)
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx          # Main application page
├── package.json          # Dependencies
└── tailwind.config.js    # Tailwind configuration
```

### Backend Structure

```
bioinformatics-backend/
├── src/
│   ├── app.controller.ts # Main controller
│   ├── app.module.ts     # Application module
│   ├── app.service.ts    # Service logic
│   └── main.ts          # Application entry point
├── package.json          # Dependencies
└── tsconfig.json        # TypeScript configuration
```

### Python Service Structure

```
bioinformatics-python-service/
├── main.py              # FastAPI application
├── simple_main.py       # Flask alternative
├── requirements.txt     # Python dependencies
└── simple_requirements.txt # Simple Flask dependencies
```

## 🔧 Development

### Adding New Features

1. **Frontend**: Add components in `bioinformatics-app/app/page.tsx`
2. **Backend**: Add endpoints in `bioinformatics-backend/src/app.controller.ts`
3. **Python Service**: Add endpoints in `bioinformatics-python-service/main.py`

### Environment Variables

Create `.env` files in each service directory as needed:

**Frontend (.env.local)**

```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

**Backend (.env)**

```
PYTHON_SERVICE_URL=http://localhost:8000
```

## 🚀 Deployment

### Docker (Recommended)

```bash
# Build all services
docker-compose build

# Start all services
docker-compose up -d
```

### Production

1. Build frontend: `npm run build` (in bioinformatics-app)
2. Build backend: `npm run build` (in bioinformatics-backend)
3. Deploy Python service with your preferred method
4. Configure reverse proxy (nginx, etc.)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: Use GitHub Issues for bug reports and feature requests
- **Documentation**: Check [README-SETUP.md](README-SETUP.md) for detailed setup
- **Code**: Well-documented with TypeScript types and comments

## 📊 Technologies Used

- **Frontend**: React, Next.js, TypeScript, Tailwind CSS
- **Backend**: Node.js, Nest.js, TypeScript, Express
- **Python**: FastAPI, Biopython, Flask
- **Development**: Git, npm, pip
- **Styling**: Tailwind CSS, Lucide React icons
- **Data Fetching**: SWR, Axios

---

**Bioinformatics-Primitive** - Making bioinformatics accessible and powerful for everyone! 🧬
