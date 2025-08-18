# Insurance Application

## Overview
This project is an insurance application designed to manage various aspects of insurance services, including user authentication, database management, PDF processing, and vector storage integration.

## Directory Structure
```
insurance/
├── alembic/                # Database migration scripts and configuration
│   ├── env.py              # Alembic environment configuration
│   └── versions/           # Migration versions
│       └── 20250805_init.py # Initial migration script
├── alembic.ini             # Alembic configuration file
├── app/                    # Main application code
│   ├── __init__.py         # Application package initialization
│   ├── auth.py             # Authentication logic (JWT, password hashing)
│   ├── crud.py             # CRUD operations for database models
│   ├── database.py         # Database connection and session management
│   ├── dependencies.py     # FastAPI dependency definitions
│   ├── main.py             # FastAPI application entry point
│   ├── models.py           # SQLAlchemy database models
│   ├── schemas.py          # Pydantic schemas for data validation
│   ├── utils.py            # Utility functions (e.g., password hashing)
│   └── vector_store_utils.py # Vector storage and retrieval utilities
├── companies/              # Placeholder for company-related features
├── vector_store/           # Placeholder for vector storage features
├── .env                    # Environment variables (API keys, DB URL, etc.)
├── requirements.txt        # Python dependencies
├── data.db                 # SQLite database (auto-created)
└── README.md               # Project documentation
```

## Setup Instructions

1. **Clone the repository:**
   ```sh
   git clone <repository-url>
   cd insurance
   ```

2. **Create a virtual environment:**
   ```sh
   python -m venv venv
   ```

3. **Activate the virtual environment:**
   - On Windows:
     ```sh
     venv\Scripts\activate
     ```
   - On macOS/Linux:
     ```sh
     source venv/bin/activate
     ```

4. **Install the required dependencies:**
   ```sh
   pip install -r requirements.txt
   ```

5. **Configure environment variables:**
   - Copy `.env.example` to `.env` and update values as needed (e.g., database URL, OpenAI API key).

6. **Run database migrations:**
   ```sh
   alembic upgrade head
   ```

7. **Run the application:**
   ```sh
   uvicorn app.main:app --reload
   ```

## Usage

- Access the FastAPI application at the specified server URL (default: `http://127.0.0.1:8000`).
- Use authentication endpoints for user login and registration.
- Upload and process PDF files using integrated PDF and OCR tools.
- Interact with the database through CRUD endpoints.
- Utilize vector storage features for advanced search and retrieval.

## Dependencies

Key packages used:
- `fastapi`, `uvicorn` — Web framework and ASGI server
- `sqlalchemy`, `alembic` — ORM and migrations
- `python-jose`, `passlib[bcrypt]` — Authentication and password hashing
- `pymupdf`, `pdfplumber`, `pytesseract`, `Pillow` — PDF and OCR processing
- `langchain`, `openai`, `faiss-cpu`, `tiktoken` — LLM and vector storage integration
- `python-dotenv` — Environment variable management

## Contributing

Contributions are welcome! Please submit a pull request or open an issue for any enhancements or bug fixes.