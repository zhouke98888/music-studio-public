# Music Studio Management System

A comprehensive web application for managing music studio operations, including student management, lesson scheduling, instrument inventory, and billing.

## Features

### Student Portal
- **Login & Authentication**: Login with username/password or Google account
- **Lesson Management**: 
  - View scheduled lessons
  - Filter lessons by date range
  - Confirm attendance ("I am here" button)
  - Request lesson reschedule with reason
  - Request lesson cancellation with reason
- **Invoice Management**: View monthly invoices
- **Instrument Management**:
  - Browse available instruments
  - Search instruments
  - Check out/check in instruments
  - View instrument details

### Teacher Portal
- **Student Management**:
  - View and edit student details (name, birthday, grade, school, contact info)
  - Add new students
  - Mark students as graduated
  - Send notifications to students and parents
  - Send group notices
- **Lesson Management**:
  - View all lessons (private, masterclass, group practice)
  - Filter lessons by date range
  - Approve/deny reschedule requests
  - Approve/deny cancellation requests
  - Create new lessons
  - Cancel lessons with reason
  - Reschedule lessons
  - Bulk cancel multiple lessons
- **Invoice Management**:
  - View invoices for each student
  - Update invoice details
  - Mark invoices as paid
  - Send invoices to students
- **Instrument Management**:
  - View and edit instrument details
  - Mark instruments as lost/broken
  - Message instrument borrowers

## Technology Stack

### Backend
- **Node.js** with **Express.js**
- **TypeScript** for type safety
- **MongoDB** with **Mongoose** ODM
- **JWT** for authentication
- **bcryptjs** for password hashing
- **Passport.js** for Google OAuth (planned)

### Frontend
- **React.js** with **TypeScript**
- **Material-UI (MUI)** for UI components
- **React Router** for navigation
- **Axios** for API calls
- **date-fns** for date handling

## Project Structure

```
music-studio/
├── backend/
│   ├── src/
│   │   ├── controllers/     # Request handlers
│   │   ├── models/         # MongoDB models
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Custom middleware
│   │   ├── config/         # Configuration files
│   │   ├── services/       # Business logic
│   │   ├── types/          # TypeScript types
│   │   └── index.ts        # Entry point
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── contexts/       # React contexts
│   │   ├── services/       # API services
│   │   ├── types/          # TypeScript types
│   │   └── App.tsx         # Main app component
│   ├── package.json
│   └── public/
└── package.json            # Root package.json
```

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd music-studio
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Setup environment variables**
   
   Backend (.env):
   ```bash
   cd backend
   cp .env.example .env
   ```
   
  Edit `backend/.env` with your configuration:
  ```
  PORT=5000
  NODE_ENV=development
  MONGODB_URI=mongodb://localhost:27017/music-studio
  JWT_SECRET=your-super-secret-jwt-key
  FRONTEND_URL=http://localhost:3000
  GOOGLE_CLIENT_ID=your-google-client-id
  ```

  Frontend (.env):
  ```bash
  cd frontend
  # create .env file (must be inside the frontend directory)
  ```

  Add the following to `frontend/.env`:
  ```
  REACT_APP_API_URL=http://localhost:5001/api
  REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id
  ```
  > **Note:** Environment variables for the React app must live in the `frontend/.env` file. A `.env` placed at the project root will not be picked up by `react-scripts`.

4. **Start MongoDB**
   Make sure MongoDB is running on your system.

5. **Run the application**
   
   Development mode (runs both backend and frontend):
   ```bash
   npm run dev
   ```
   
   Or run separately:
   ```bash
   # Terminal 1 - Backend
   npm run server
   
   # Terminal 2 - Frontend
   npm run client
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000/api

### First Time Setup

1. **Create your first account**
   - Navigate to http://localhost:3000/register
   - Register as either a student or teacher
   - Login with your credentials

2. **Test the system**
   - Explore the dashboard
   - Create some test data (lessons, instruments, etc.)

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Lessons
- `GET /api/lessons` - Get lessons (filtered by role)
- `GET /api/lessons/:id` - Get lesson details
- `POST /api/lessons/:id/confirm-attendance` - Confirm attendance
- `POST /api/lessons/:id/request-reschedule` - Request reschedule
- `POST /api/lessons/:id/request-cancel` - Request cancellation
- `POST /api/lessons/:id/approve-reschedule` - Approve reschedule (teacher)
- `POST /api/lessons/:id/approve-cancel` - Approve cancellation (teacher)
- `POST /api/lessons` - Create new lesson (teacher)

### Instruments
- `GET /api/instruments` - Get all instruments
- `GET /api/instruments/my-instruments` - Get user's checked out instruments
- `GET /api/instruments/:id` - Get instrument details
- `POST /api/instruments/:id/checkout` - Check out instrument
- `POST /api/instruments/:id/checkin` - Check in instrument
- `POST /api/instruments` - Create instrument (teacher/admin)
- `PUT /api/instruments/:id` - Update instrument (teacher/admin)
- `DELETE /api/instruments/:id` - Delete instrument (teacher/admin)

## Development

### Adding New Features

1. **Backend**:
   - Add models in `backend/src/models/`
   - Create controllers in `backend/src/controllers/`
   - Define routes in `backend/src/routes/`
   - Update types in `backend/src/types/`

2. **Frontend**:
   - Create components in `frontend/src/components/`
   - Add pages in `frontend/src/pages/`
   - Update API services in `frontend/src/services/`
   - Add types in `frontend/src/types/`

### Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## Deployment

### Backend Deployment
1. Build the application: `npm run build`
2. Set production environment variables
3. Deploy to your preferred platform (Heroku, AWS, etc.)

### Frontend Deployment
1. Build the application: `npm run build`
2. Deploy the `build` folder to your web server

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support or questions, please contact the development team or create an issue in the repository.