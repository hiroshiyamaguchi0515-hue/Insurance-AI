# Insurance PDF Analysis Frontend

A modern, responsive React frontend for the Insurance PDF Analysis System. This frontend provides both admin and customer interfaces for managing companies, documents, and AI-powered Q&A functionality.

## 🚀 Features

### Admin Features
- **Dashboard**: System overview with statistics and monitoring
- **Company Management**: Create, update, and delete companies with **required ChatGPT model selection**
- **User Management**: Manage system users and roles
- **PDF Management**: Upload, view, and manage PDF documents
- **Agent Management**: Monitor and manage AI agents
- **Vector Store Management**: Monitor vector store health and rebuild
- **System Health**: Real-time system status monitoring

### Customer Features
- **Document Access**: View and manage company documents
- **Q&A Interface**: Ask questions about uploaded documents
- **AI Agent Chat**: Interactive conversations with AI agents
- **Company Selection**: Switch between different companies

## 🛠️ Technology Stack

- **React 18** - Modern React with hooks
- **Material-UI (MUI) 5** - Professional UI components
- **React Router 6** - Client-side routing
- **React Query** - Server state management
- **Axios** - HTTP client with interceptors
- **React Hot Toast** - User notifications
- **Date-fns** - Date utilities
- **ESLint + Prettier** - Code quality and formatting

## 📋 Prerequisites

- Node.js 16+ and npm
- Backend API running on `http://localhost:8000`
- Modern web browser

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Environment Configuration

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# API Configuration
REACT_APP_API_URL=http://localhost:8000

# Application Configuration
REACT_APP_NAME=Insurance PDF Analysis
REACT_APP_VERSION=1.0.1
REACT_APP_ENV=development

# Feature Flags
REACT_APP_ENABLE_DEBUG=true
REACT_APP_ENABLE_ANALYTICS=false
```

### 3. Start Development Server

```bash
npm start
```

The frontend will open at `http://localhost:3000`

### 4. Build for Production

```bash
npm run build
```

## 🎯 ChatGPT Model Selection

**Important**: When creating or updating companies, users **must** select a ChatGPT model from the dropdown. The system:

- **Fetches available models** from the OpenAI API endpoint `/admin/openai/models`
- **Requires model selection** before form submission
- **Validates model names** against the official OpenAI model list
- **Prevents creation** without a valid model selection
- **Shows recommended models** with special indicators

### Model Selection Process:
1. User opens company creation/editing dialog
2. System automatically fetches available OpenAI models
3. User must select a model from the dropdown
4. Form validation ensures model is selected
5. Company is created/updated with the selected AI model

## 🧹 Code Quality Tools

### ESLint Configuration
- **React-specific rules** with hooks support
- **Accessibility rules** (jsx-a11y)
- **Prettier integration** for consistent formatting
- **Custom rules** for code quality

### Prettier Configuration
- **Consistent formatting** across the codebase
- **Single quotes** and **trailing commas**
- **80 character line width**
- **JSX formatting** support

### Available Scripts
```bash
npm run lint          # Check for linting issues
npm run lint:fix      # Fix auto-fixable linting issues
npm run format        # Format all code with Prettier
npm run format:check  # Check if code is properly formatted
```

## 🏗️ Project Structure

```
frontend/
├── public/                 # Static assets
├── src/
│   ├── components/         # Reusable UI components
│   │   └── Layout.js      # Main navigation layout
│   ├── contexts/          # React contexts
│   │   └── AuthContext.js # Authentication state
│   ├── pages/             # Page components
│   │   ├── Login.js       # Login page
│   │   ├── AdminDashboard.js    # Admin dashboard
│   │   ├── CustomerDashboard.js # Customer dashboard
│   │   ├── CompanyManagement.js # Company management (with model selection)
│   │   ├── UserManagement.js    # User management
│   │   ├── PDFManagement.js     # PDF management
│   │   ├── AgentManagement.js   # AI agent management
│   │   ├── VectorStoreManagement.js # Vector store management
│   │   └── SystemHealth.js      # System monitoring
│   ├── services/          # API services
│   │   └── api.js         # HTTP client and endpoints
│   ├── App.js             # Main app component
│   └── index.js           # Entry point
├── .env                   # Environment variables
├── .env.example          # Environment template
├── .eslintrc.js          # ESLint configuration
├── .prettierrc           # Prettier configuration
├── .prettierignore       # Prettier ignore patterns
├── package.json           # Dependencies and scripts
└── README.md              # This file
```

## 🔐 Authentication

The frontend uses JWT tokens for authentication:

- **Login**: POST `/auth/login` with username/password
- **Token Storage**: Access and refresh tokens stored in localStorage
- **Auto-refresh**: Automatic token refresh on 401 responses
- **Protected Routes**: Role-based access control

## 🎨 UI Components

### Material-UI Theme
- Custom color palette with primary/secondary colors
- Responsive design for mobile and desktop
- Professional card-based layouts
- Consistent spacing and typography

### Responsive Design
- Mobile-first approach
- Collapsible sidebar navigation
- Touch-friendly interface elements
- Adaptive grid layouts

## 📱 Pages Overview

### Admin Pages
1. **Dashboard** (`/`) - System overview and statistics
2. **Companies** (`/companies`) - Company management with **required model selection**
3. **Users** (`/users`) - User management
4. **Documents** (`/pdfs`) - PDF management
5. **Agents** (`/agents`) - AI agent management
6. **Vector Store** (`/vectorstore`) - Vector store management
7. **System Health** (`/health`) - System monitoring

### Customer Pages
1. **Dashboard** (`/`) - Document access and Q&A
2. **Documents** (`/documents`) - PDF management
3. **Q&A** (`/qa`) - Question answering interface

## 🔌 API Integration

### HTTP Client
- Axios with request/response interceptors
- Automatic token management
- Error handling and retry logic
- Request timeout configuration

### Endpoints
All API endpoints are centralized in `src/services/api.js`:
- Authentication endpoints
- Company management
- PDF operations
- Q&A functionality
- Agent management
- System monitoring
- **OpenAI models** (`/admin/openai/models`)

## 🎯 Key Features

### Real-time Updates
- Automatic data refresh every 10-30 seconds
- Live system status monitoring
- Real-time notifications

### Error Handling
- User-friendly error messages
- Toast notifications for success/error
- Graceful fallbacks for failed requests

### Performance
- React Query for efficient caching
- Lazy loading of components
- Optimized re-renders

## 🧪 Development

### Available Scripts
- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm eject` - Eject from Create React App
- `npm run lint` - Check code quality
- `npm run lint:fix` - Fix linting issues
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting

### Code Style
- ESLint configuration included
- Prettier for consistent formatting
- Consistent component structure
- Proper prop validation
- Clean separation of concerns

## 🚀 Deployment

### Build Process
1. Run `npm run build`
2. Deploy `build/` folder to web server
3. Configure reverse proxy for API calls
4. Set environment variables

### Environment Variables
- `REACT_APP_API_URL` - Backend API URL
- `REACT_APP_VERSION` - Application version
- `REACT_APP_ENV` - Environment (development/production)

## 🔧 Troubleshooting

### Common Issues

1. **API Connection Failed**
   - Check backend server is running
   - Verify API URL in `.env` file
   - Check CORS configuration

2. **Authentication Issues**
   - Clear localStorage and re-login
   - Check token expiration
   - Verify backend auth endpoints

3. **Build Errors**
   - Clear `node_modules` and reinstall
   - Check Node.js version compatibility
   - Verify all dependencies are installed

4. **Linting/Formatting Issues**
   - Run `npm run lint:fix` to auto-fix issues
   - Run `npm run format` to format code
   - Check ESLint and Prettier configurations

### Debug Mode
Enable debug logging by setting in browser console:
```javascript
localStorage.setItem('debug', 'true')
```

## 📚 Additional Resources

- [Material-UI Documentation](https://mui.com/)
- [React Query Guide](https://react-query.tanstack.com/)
- [React Router Documentation](https://reactrouter.com/)
- [ESLint Rules](https://eslint.org/docs/rules/)
- [Prettier Options](https://prettier.io/docs/en/options.html)

## 🤝 Contributing

1. Follow existing code structure
2. Use consistent naming conventions
3. Add proper error handling
4. Test on multiple devices
5. Update documentation
6. **Run linting and formatting** before committing:
   ```bash
   npm run lint:fix
   npm run format
   ```

## 📄 License

This project is part of the Insurance PDF Analysis System. 