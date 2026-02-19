# Terminal 1 (Backend)
cd backend

source venv/bin/activate  # Activate virtual environment

uvicorn server:app --reload --port 8001  # Start backend server

# Terminal 2 (Frontend)
cd frontend

yarn install  # Or use npm install

npx expo start  # Start frontend server