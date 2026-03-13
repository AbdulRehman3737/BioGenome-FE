# Bioinformatics Primitive - Setup Guide

This guide will help you set up and run the Bioinformatics Primitive application on your local machine.

## Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Node.js** (version 18 or higher)
- **Python** (version 3.8 or higher)
- **npm** (comes with Node.js)
- **pip** (comes with Python)

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Bioinformatics-Primitive
```

### 2. Install Dependencies

#### Frontend Dependencies (Next.js)

```bash
cd bioinformatics-app
npm install
cd ..
```

#### Backend Dependencies (Nest.js)

```bash
cd bioinformatics-backend
npm install
cd ..
```

#### Python Dependencies (Biopython)

```bash
cd bioinformatics-python-service
pip install -r requirements.txt
cd ..
```

### 3. Environment Configuration

#### Create Environment Files

**Frontend (.env.local)**

```bash
cd bioinformatics-app
echo "NEXT_PUBLIC_API_URL=http://localhost:3001" > .env.local
cd ..
```

**Backend (.env)**

```bash
cd bioinformatics-backend
cat > .env << EOF
PORT=3001
PYTHON_SERVICE_URL=http://localhost:8000
MONGODB_URI=mongodb://localhost:27017/bioinformatics
JWT_SECRET=your-secret-key-change-this-in-production
EOF
cd ..
```

### 4. Start the Services

#### Option 1: Manual Start (Recommended for Development)

1. **Start Python Service** (Terminal 1)

   ```bash
   cd bioinformatics-python-service
   python main.py
   ```

2. **Start Nest.js Backend** (Terminal 2)

   ```bash
   cd bioinformatics-backend
   npm run start:dev
   ```

3. **Start Next.js Frontend** (Terminal 3)
   ```bash
   cd bioinformatics-app
   npm run dev
   ```

#### Option 2: Automated Setup (Cross-Platform)

You can run these commands to automate the setup process:

**Install all dependencies:**

```bash
# Install frontend dependencies
cd bioinformatics-app && npm install && cd ..

# Install backend dependencies
cd bioinformatics-backend && npm install && cd ..

# Install Python dependencies
cd bioinformatics-python-service && pip install -r requirements.txt && cd ..
```

**Create environment files:**

```bash
# Create frontend .env.local
cd bioinformatics-app
echo "NEXT_PUBLIC_API_URL=http://localhost:3001" > .env.local
cd ..

# Create backend .env
cd bioinformatics-backend
cat > .env << EOF
PORT=3001
PYTHON_SERVICE_URL=http://localhost:8000
MONGODB_URI=mongodb://localhost:27017/bioinformatics
JWT_SECRET=your-secret-key-change-this-in-production
EOF
cd ..
```

**Start all services:**

```bash
# Start Python service in background
cd bioinformatics-python-service
python main.py > python_service.log 2>&1 &
cd ..

# Wait for Python service to start
sleep 3

# Start Nest.js backend in background
cd bioinformatics-backend
npm run start:dev > backend.log 2>&1 &
cd ..

# Wait for backend to start
sleep 3

# Start Next.js frontend in background
cd bioinformatics-app
npm run dev > frontend.log 2>&1 &
cd ..
```

### 5. Access the Application

Once all services are running, open your browser and navigate to:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Python Service**: http://localhost:8000

### 6. Verify Installation

Check if all services are running correctly:

```bash
# Check Python service
curl -s http://localhost:8000 && echo "✅ Python service running"

# Check Nest.js backend
curl -s http://localhost:3001 && echo "✅ Backend running"

# Check Next.js frontend (should return HTML)
curl -s http://localhost:3000 | head -1 && echo "✅ Frontend running"
```

## Service Details

### Python Service (Biopython Analysis)

The Python service provides the core bioinformatics analysis functionality using Biopython.

**Start the service:**

```bash
cd bioinformatics-python-service
python main.py
```

**Available endpoints:**

- `GET /` - Service status
- `POST /analyze` - Sequence analysis
- `POST /restriction` - Restriction enzyme analysis
- `GET /available-enzymes` - List available enzymes

### Nest.js Backend (API Gateway)

The Nest.js backend acts as an API gateway, forwarding requests to the Python service.

**Start the service:**

```bash
cd bioinformatics-backend
npm run start:dev
```

**Available endpoints:**

- `GET /` - Service status
- `POST /api/analyze` - Forward to Python analysis
- `POST /api/analyze/restriction` - Forward to Python restriction analysis
- `GET /api/enzymes` - Get available enzymes

### Next.js Frontend (User Interface)

The frontend provides a modern, interactive interface for the bioinformatics tools.

**Start the service:**

```bash
cd bioinformatics-app
npm run dev
```

**Available routes:**

- `/` - Main application page
- `/api/analyze` - API proxy to backend
- `/api/analyze/restriction` - API proxy to backend restriction analysis
- `/api/enzymes` - API proxy to get enzymes

## Troubleshooting

### Common Issues

1. **Port already in use**
   - Check if services are already running
   - Use different ports in environment files

2. **Python dependencies not found**
   - Ensure Python and pip are installed
   - Run `pip install -r requirements.txt` in the Python service directory

3. **Node.js dependencies not found**
   - Ensure Node.js and npm are installed
   - Run `npm install` in both frontend and backend directories

4. **Services not communicating**
   - Check environment variables are set correctly
   - Verify all services are running on expected ports

### Service Status Check

You can check if all services are running with this simple test:

```bash
# Check Python service
curl http://localhost:8000

# Check Nest.js backend
curl http://localhost:3001

# Check Next.js frontend (should return HTML)
curl http://localhost:3000
```

### Log Files

If services fail to start, check the log files:

```bash
# Python service logs
tail -f bioinformatics-python-service/python_service.log

# Backend logs
tail -f bioinformatics-backend/backend.log

# Frontend logs
tail -f bioinformatics-app/frontend.log
```

## Development

### Adding New Features

1. **Frontend**: Modify components in `bioinformatics-app/app/page.tsx`
2. **Backend**: Add endpoints in `bioinformatics-backend/src/app.controller.ts`
3. **Python Service**: Add endpoints in `bioinformatics-python-service/main.py`

### Environment Variables

**Frontend (.env.local):**

```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

**Backend (.env):**

```
PORT=3001
PYTHON_SERVICE_URL=http://localhost:8000
MONGODB_URI=mongodb://localhost:27017/bioinformatics
JWT_SECRET=your-secret-key-change-this-in-production
```

## Production Deployment

### Build Commands

```bash
# Build frontend
cd bioinformatics-app
npm run build

# Build backend
cd bioinformatics-backend
npm run build
```

### Docker Deployment

The project includes Docker support for easy deployment:

```bash
# Build all services
docker-compose build

# Start all services
docker-compose up -d
```

## Dependencies

### Frontend Dependencies

- react
- react-dom
- next
- typescript
- tailwindcss
- lucide-react
- swr

### Backend Dependencies

- @nestjs/core
- @nestjs/common
- @nestjs/platform-express
- axios
- typescript

### Python Dependencies

- fastapi
- uvicorn
- biopython
- pydantic
- numpy
- pandas

## Support

If you encounter any issues or have questions, please:

1. Check the troubleshooting section above
2. Review the service logs for error messages
3. Create an issue in the repository with detailed information

## Next Steps

After successful setup, you can:

1. **Explore the application** at http://localhost:3000
2. **Test the API endpoints** using tools like Postman
3. **Contribute to the project** by following the contribution guidelines
4. **Deploy to production** using the provided deployment instructions
