# AI-powered Insurance Assistant System

A secure, intelligent AI-powered insurance assistance platform with multi-company support, featuring advanced authentication, AI-driven policy analysis, and comprehensive customer support capabilities.

## 🚀 Features

- **Multi-Company Support**: Separate knowledge bases for different insurance companies
- **AI-Powered Insurance Assistant**: Uses OpenAI GPT models for intelligent insurance policy assistance
- **Intelligent Agent System**: Conversational AI agents with memory and reasoning capabilities
- **Secure Authentication**: JWT-based authentication with role-based access control
- **Policy Analysis**: AI-powered analysis of insurance policies, contracts, and coverage documents
- **24/7 AI Support**: Round-the-clock intelligent assistance for insurance queries
- **Document Management**: Secure insurance document handling with AI analysis
- **Comprehensive Logging**: Detailed logging for monitoring and debugging
- **Database Migrations**: Alembic-based database schema management

## 🔒 Security Features

- JWT token authentication with configurable expiration
- Password hashing using bcrypt
- Role-based access control (admin/user users)
- Rate limiting on all endpoints
- Input validation and sanitization
- File upload security with size and type validation
- CORS protection
- Trusted host middleware
- HIPAA-compliant data handling
- Comprehensive error handling without information leakage

## 📋 Prerequisites

- Python 3.8+
- OpenAI API key
- SQLite (default) or PostgreSQL
- Tesseract OCR (for image text extraction)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd insurance
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your actual values
   ```

5. **Create initial migration**
   ```bash
   alembic revision --autogenerate -m "Initial"
   ```

6. **Run database migrations**
   ```bash
   alembic upgrade head
   ```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file with the following variables:

```env
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# JWT Security Configuration (CHANGE IN PRODUCTION!)
JWT_SECRET_KEY=your_secure_jwt_secret_key_here

# Database Configuration (optional - defaults to SQLite)
DATABASE_URL=sqlite:///./data.db

# Application Configuration
ENVIRONMENT=development
LOG_LEVEL=INFO

# Rate Limiting Configuration
RATE_LIMIT_ENABLED=true
```

### Security Configuration

**IMPORTANT**: For production deployment:

1. **Generate a secure JWT secret key**:
   ```bash
   python -c "import secrets; print(secrets.token_urlsafe(32))"
   ```

2. **Update CORS origins** in `main.py`:
   ```python
   allow_origins=["https://yourdomain.com", "https://app.yourdomain.com"]
   ```

3. **Update trusted hosts** in `main.py`:
   ```python
   allowed_hosts=["yourdomain.com", "*.yourdomain.com"]
   ```

## 🚀 Running the Application

### Development
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Production
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

## 📚 API Documentation

Once running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🔐 Authentication

### Creating Admin User

1. **Start the application**
2. **Use the API to create an admin user**:
   ```bash
   curl -X POST "http://localhost:8000/users" \
     -H "Content-Type: application/json" \
     -d '{
       "username": "admin",
       "email": "admin@example.com",
       "password": "SecurePass123",
       "role": "admin"
     }'
   ```

### Login

```bash
curl -X POST "http://localhost:8000/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=SecurePass123"
```

## 📖 API Usage Examples

### 1. Create a Company
```bash
curl -X POST "http://localhost:8000/companies" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Acme Corp"}'
```

### 2. Upload PDF
```bash
curl -X POST "http://localhost:8000/companies/1/pdfs" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@document.pdf"
```

### 3. Ask Questions
```bash
curl -X POST "http://localhost:8000/companies/1/ask" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"question": "What are the insurance terms?"}'
```

### 4. Use Agent
```bash
curl -X POST "http://localhost:8000/companies/1/agent/ask" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"question": "Explain the coverage details"}'
```

## 🛡️ Security Best Practices

### 1. Environment Variables
- Never commit `.env` files to version control
- Use different secrets for each environment
- Rotate secrets regularly

### 2. API Keys
- Store OpenAI API keys securely
- Monitor API usage and costs
- Implement API key rotation

### 3. File Uploads
- Validate file types and sizes
- Scan uploaded files for malware
- Store files securely

### 4. Database Security
- Use strong database passwords
- Enable database encryption
- Regular backups

### 5. Network Security
- Use HTTPS in production
- Configure firewall rules
- Implement proper CORS policies

## 🔧 Troubleshooting

### Common Issues

1. **Import Errors**
   - Ensure all dependencies are installed
   - Check Python version compatibility

2. **Database Errors**
   - Run `alembic upgrade head` to apply migrations
   - Check database file permissions

3. **OpenAI API Errors**
   - Verify API key is correct
   - Check API quota and billing
   - Ensure network connectivity

4. **File Upload Issues**
   - Check file size limits (50MB default)
   - Ensure PDF files are valid
   - Verify directory permissions

### Logs

Check application logs for detailed error information:
```bash
tail -f logs/app.log
```

## 📊 Monitoring

### Health Check
```bash
curl http://localhost:8000/health
```

### Metrics to Monitor
- API response times
- Error rates
- File upload success rates
- OpenAI API usage and costs
- Database performance

## 🚀 Deployment

### Docker Deployment

1. **Create Dockerfile**:
   ```dockerfile
   FROM python:3.9-slim
   
   WORKDIR /app
   COPY requirements.txt .
   RUN pip install -r requirements.txt
   
   COPY . .
   EXPOSE 8000
   
   CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
   ```

2. **Build and run**:
   ```bash
   docker build -t pdf-qa-api .
   docker run -p 8000:8000 --env-file .env pdf-qa-api
   ```

### Production Considerations

1. **Use a production WSGI server** (Gunicorn)
2. **Set up reverse proxy** (Nginx)
3. **Configure SSL/TLS certificates**
4. **Set up monitoring and alerting**
5. **Implement backup strategies**
6. **Use environment-specific configurations**

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the API documentation

## 🔄 Changelog

### v4.1.0
- Fixed circular import issues
- Added comprehensive error handling
- Implemented rate limiting
- Enhanced security features
- Added input validation
- Fixed database schema issues
- Added CORS and security middleware
- Improved logging and monitoring