# EcoTrack AI Dashboard (Bill-Tracker-with-AI)

EcoTrack AI Dashboard is a comprehensive web application designed to track household utility bills (electricity, water, gas) and provide actionable, AI-driven recommendations for energy optimization. 

## Features

- **Utility Tracking:** Log and monitor monthly electricity, water, and gas usage.
- **AI Recommendations:** Get personalized, actionable advice on how to optimize your energy consumption and reduce costs using an integrated AI service.
- **Modern UI:** A clean, responsive, and intuitive dashboard built with React and Tailwind CSS.
- **Robust Backend:** A fast and scalable backend API powered by FastAPI and SQL Server.

## Technology Stack

- **Frontend:** React, Vite, Tailwind CSS
- **Backend:** Python, FastAPI, SQLAlchemy, SQL Server
- **AI Integration:** Leveraging advanced LLMs for energy optimization suggestions

## Getting Started

### Prerequisites

- Node.js & npm (for the frontend)
- Python 3.8+ (for the backend)
- Microsoft SQL Server

### Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd EnergyOptimization
   ```

2. **Backend Setup:**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows use `venv\Scripts\activate`
   pip install -r requirements.txt
   # Set up your .env file with necessary configurations (e.g., database connection, AI model details)
   uvicorn main:app --reload
   ```

3. **Frontend Setup:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```