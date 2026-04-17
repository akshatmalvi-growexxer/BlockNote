# FluxNotes

A modern, browser-based collaborative note editor with real-time block-based document editing, sharing capabilities, and persistence.

## Features

### Core Editor
- **Block-based editing** - Write using flexible paragraph, heading, todo, code, divider, and image blocks
- **Drag-and-drop reordering** - Drag blocks to reorganize your document with smooth visual feedback
- **Slash commands** - Type `/` to access a menu of block types and formatting options
- **Keyboard shortcuts** - Enter to split blocks, Backspace to delete, Tab in code blocks
- **Todo blocks** - Check off tasks as you complete them
- **Code blocks** - Write and display code with proper formatting
- **Image blocks** - Embed images with URLs and alt text support

### Editor UX
- **Auto-save** - Your work saves automatically as you type with visual save indicators
- **Block selection and focus** - Click to select, keyboard navigation support
- **Active block highlighting** - Clear visual feedback on which block you're editing
- **Drag-and-drop feedback** - Dragging blocks becomes semi-transparent and shows where they'll land
- **Toast notifications** - Instant feedback for copy-to-clipboard and error messages

### Sharing & Collaboration
- **Public share links** - Generate read-only share links for your documents
- **Easy sharing toggle** - Enable/disable public access with one click
- **Copy link to clipboard** - Quick copying with toast confirmation

### Account & Dashboard
- **User authentication** - Secure JWT-based login and registration
- **Document dashboard** - List, create, rename, and delete documents
- **Quick access** - Jump between your documents from the dashboard

### UI/UX Polish
- **Dark mode support** - Toggle between light and dark themes
- **Responsive design** - Works on desktop and tablet browsers
- **Clean interface** - Minimal, focused design that gets out of your way
- **Error handling** - User-friendly error messages for connection issues

## Tech Stack

### Frontend
- **Next.js 15** - React framework for production
- **React 19** - UI library
- **CSS** - Custom styling with theme variables

### Backend
- **Express.js** - Node.js server framework
- **Prisma ORM** - Database abstraction and migrations
- **PostgreSQL** - Relational database
- **JWT** - Secure authentication

### Deployment
- **Vercel** - Frontend hosting
- **Render** - Backend and database hosting

## Project Structure

```
FluxNotes/
├── apps/
│   ├── web/                 # Next.js frontend application
│   │   ├── app/
│   │   │   ├── dashboard/   # Document dashboard page
│   │   │   ├── documents/   # Document editor page
│   │   │   ├── login/       # Login page
│   │   │   ├── register/    # Registration page
│   │   │   ├── share/       # Public share page
│   │   │   ├── globals.css  # Global styles and theme
│   │   │   └── layout.js    # Root layout
│   │   ├── components/      # Reusable React components
│   │   ├── lib/             # Utilities and API client
│   │   └── package.json
│   │
│   └── api/                 # Express backend application
│       ├── src/
│       │   ├── routes/      # API endpoints
│       │   ├── middleware/  # Auth and request handlers
│       │   ├── db/          # Database client
│       │   ├── config/      # Configuration
│       │   └── app.js       # Express app setup
│       ├── prisma/
│       │   ├── schema.prisma # Database schema
│       │   └── migrations/   # Database migrations
│       └── package.json
│
├── docs/                    # Architecture and design documentation
├── .env.example            # Environment variables template
├── package.json            # Monorepo configuration
└── render.yaml             # Render deployment configuration
```

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database (local or remote)

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd FluxNotes
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Copy the example file
   cp .env.example .env
   
   # Edit .env with your local database URL and configuration
   ```

4. **Set up the database**
   ```bash
   # Run Prisma migrations
   cd apps/api
   npx prisma migrate dev
   ```

5. **Start development servers**
   ```bash
   # From the root directory, start both frontend and backend
   npm run dev
   
   # Or start them separately:
   npm run dev:web  # Frontend on http://localhost:3000
   npm run dev:api  # Backend on http://localhost:4000
   ```

6. **Access the application**
   - Open http://localhost:3000 in your browser
   - Create an account or login
   - Start creating and editing documents!

### Building for Production

```bash
# Build both frontend and backend
npm run build

# Or build individually
npm run build:web   # Build Next.js frontend
npm run build:api   # Build Express backend
```

## API Endpoints

### Authentication
- `POST /auth/register` - Create a new account
- `POST /auth/login` - Login to existing account
- `POST /auth/logout` - Logout and invalidate session
- `POST /auth/refresh` - Refresh JWT token

### Documents
- `GET /documents` - List user's documents
- `POST /documents` - Create new document
- `GET /documents/:id` - Get document with blocks
- `PATCH /documents/:id` - Update document (title, etc.)
- `DELETE /documents/:id` - Delete document

### Blocks
- `POST /blocks` - Create a new block
- `PATCH /blocks/:id` - Update block content
- `DELETE /blocks/:id` - Delete a block
- `PATCH /blocks/:id/order` - Reorder blocks

### Sharing
- `POST /documents/:id/share` - Enable sharing (generate link)
- `DELETE /documents/:id/share` - Disable sharing
- `GET /share/:token` - View shared document (public)

## Data Model

### User
- Secure password hashing
- JWT-based authentication
- Refresh token rotation

### Document
- Owned by a single user
- Supports public sharing with token-based access
- Tracks revision for stale-write protection

### Block
- Flexible content JSON schema per block type
- Float-based order indices for reliable insertion between blocks
- Supports 7 block types: paragraph, heading_1, heading_2, todo, code, divider, image

### Block Content Types
- **Paragraph/Heading**: `{ text: string }`
- **Todo**: `{ text: string, checked: boolean }`
- **Code**: `{ text: string }`
- **Divider**: `{}`
- **Image**: `{ url: string, alt?: string }`

## Environment Variables

```env
# Frontend
NEXT_PUBLIC_API_URL=http://localhost:4000

# Backend
PORT=4000
DATABASE_URL=postgresql://user:password@localhost:5432/fluxnotes
ALLOWED_ORIGIN=http://localhost:3000
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
```

## Features in Progress

- [ ] Real-time collaboration
- [ ] Comments and mentions
- [ ] Version history
- [ ] Rich text formatting (bold, italic, underline)
- [ ] Markdown export
- [ ] Offline editing

## Testing

Run the provided test scripts:

```bash
# Test save ordering correctness
cd apps/api
npm run scripts/save-ordering-tests.js

# Test security (ownership protection, cross-account access)
npm run scripts/security-tests.js

# Test order_index operations
npm run scripts/order-index-tests.js
```

## Deployment

The project is configured for deployment on Vercel (frontend) and Render (backend + database).

### Vercel (Frontend)
- Connect your GitHub repository
- Set environment variable: `NEXT_PUBLIC_API_URL`
- Deploy on push to main

### Render (Backend & Database)
- Use the included `render.yaml` for deployment
- Set environment variables in Render dashboard
- Prisma migrations run automatically on deploy

See `docs/setup.md` for detailed deployment instructions.

## Architecture Decisions

### Monorepo Structure
- Single workspace for frontend and backend
- Shared environment configuration
- Simplified local development setup

### Block-based Document Model
- Flexible content structure
- Supports mixed content types in single document
- Order indices use floats for reliable insertion without renumbering

### Float Order Indices
- Enables insertion between blocks without renumbering
- Prevents concurrent write conflicts
- Supports efficient reordering operations

### Auto-save with Stale-Write Protection
- Changes saved immediately to database
- Revision tracking prevents overwriting concurrent edits
- User-friendly save state indicators

## License

This project was built as part of an internship practical assignment.

## Contributing

As this is an internship project, contributions are limited. For questions or feedback, please open an issue.
