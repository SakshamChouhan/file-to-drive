# LetterDrive

LetterDrive is a modern web application that allows users to create, edit, and save letters directly to their Google Drive. Built with React, TypeScript, and Express, it provides a seamless experience for managing your documents with Google Drive integration.

![LetterDrive Screenshot](/images/LandingPage.png)

## Features

- 🔐 Secure Google OAuth2.0 Authentication
- 📝 Create and Edit Letters
- ☁️ Direct Google Drive Integration
- 🎨 Modern UI with Dark/Light Mode
- 🔄 Real-time Auto-save
- 📱 Responsive Design
- 🔍 Document Search and Organization
- 👥 User Management
- 🎯 Role-based Access Control

## Tech Stack

### Frontend
- React
- TypeScript
- Tailwind CSS
- Radix UI Components
- React Query
- Wouter (Routing)

### Backend
- Node.js
- Express
- PostgreSQL
- Drizzle ORM
- Google Drive API
- Express Session with PostgreSQL

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v20 or higher)
- PostgreSQL
- Google Cloud Platform account with Drive API enabled

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=no-verify

# PostgreSQL Configuration (Optional - if using separate PostgreSQL config)
PGUSER=your_postgres_user
PGPASSWORD=your_postgres_password
PGHOST=your_postgres_host
PGPORT=5432

# Google OAuth (Required for Google Drive integration)
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Session Configuration
SESSION_SECRET=your_secure_session_secret_key

# Application Settings
PORT=5000
NODE_ENV=development  # or 'production' for production environment
```

### Setting up Environment Variables

1. **Database URL**: Your PostgreSQL connection string. Format:
   ```
   postgresql://username:password@host:port/database?sslmode=no-verify
   ```

2. **Google OAuth Credentials**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable the Google Drive API
   - Create OAuth 2.0 credentials
   - Add authorized redirect URIs:
     - Development: `http://localhost:5000/api/auth/google/callback`
     - Production: `https://your-domain.com/api/auth/google/callback`

3. **Session Secret**: Generate a secure random string for session encryption. You can use:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

4. **Port**: Default is 5000. Change if needed.

5. **Node Environment**: Set to 'development' or 'production'

> **Important**: Never commit your `.env` file to version control. Make sure it's listed in your `.gitignore`.

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/SakshamChouhan/file-to-drive.git
   cd file-to-drive
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up the database:
   ```bash
   # Run database migrations
   node run_migration.js
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Building for Production

1. Build the application:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```

## Project Structure

```
letter-drive/
├── client/                # Frontend React application
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── contexts/     # React contexts
│   │   ├── hooks/        # Custom hooks
│   │   ├── lib/          # Utility functions
│   │   ├── pages/        # Page components
│   │   └── styles/       # Global styles
├── server/               # Backend Express application
│   ├── auth.ts          # Authentication logic
│   ├── storage.ts       # Database operations
│   └── index.ts         # Server entry point
├── dist/                # Production build
└── shared/              # Shared types and utilities
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Radix UI](https://www.radix-ui.com/) for the accessible component primitives
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework
- [Google Drive API](https://developers.google.com/drive) for cloud storage integration

## CodeLikeARed❤️
