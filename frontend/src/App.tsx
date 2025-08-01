import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Layout from './components/layout/Layout';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './pages/Dashboard';
import LessonsPage from './pages/Lessons';
import CalendarPage from './pages/Calendar';
import InstrumentsPage from './pages/Instruments';
import InvoicesPage from './pages/Invoices';
import StudentsPage from './pages/Students';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/lessons" element={
              <ProtectedRoute>
                <Layout>
                  <LessonsPage />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/calendar" element={
              <ProtectedRoute>
                <Layout>
                  <CalendarPage />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/instruments" element={
              <ProtectedRoute>
                <Layout>
                  <InstrumentsPage />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/invoices" element={
              <ProtectedRoute>
                <Layout>
                  <InvoicesPage />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/students" element={
              <ProtectedRoute requiredRole={['teacher', 'admin']}>
                <Layout>
                  <StudentsPage />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/profile" element={
              <ProtectedRoute>
                <Layout>
                  <div>Profile page coming soon...</div>
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/settings" element={
              <ProtectedRoute>
                <Layout>
                  <div>Settings page coming soon...</div>
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/unauthorized" element={
              <div>Unauthorized - You don't have permission to access this page</div>
            } />
            
            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
