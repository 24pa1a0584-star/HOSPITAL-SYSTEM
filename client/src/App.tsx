import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';

import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { NotificationDrawer } from './components/notifications/NotificationDrawer';

// Public Pages
import { LandingPage } from './pages/public/LandingPage';
import { FindDoctorsPage } from './pages/public/FindDoctorsPage';
import { DoctorDetailsPage } from './pages/public/DoctorDetailsPage';
import { SpecialtiesPage } from './pages/public/SpecialtiesPage';
import { HospitalsPage } from './pages/public/HospitalsPage';
import { HowItWorksPage } from './pages/public/HowItWorksPage';
import { PrivacyPolicyPage } from './pages/public/PrivacyPolicyPage';

// Auth Pages
import { PatientLoginPage } from './pages/auth/PatientLoginPage';
import { PatientRegisterPage } from './pages/auth/PatientRegisterPage';
import { StaffLoginPage } from './pages/auth/StaffLoginPage';
import { DoctorRegistrationRequestPage } from './pages/auth/DoctorRegistrationRequestPage';

// Portal Dashboards
import { PatientDashboard } from './pages/patient/PatientDashboard';
import { DoctorDashboard } from './pages/doctor/DoctorDashboard';
import { ReceptionistDashboard } from './pages/receptionist/ReceptionistDashboard';
import { AdminDashboard } from './pages/admin/AdminDashboard';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,
    },
  },
});

export const App: React.FC = () => {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="flex flex-col min-h-screen bg-cloud-white text-navy-deep selection:bg-teal-100 selection:text-teal-900">
            {/* Real-time Toast Notifications */}
            <Toaster position="top-right" richColors closeButton />

            {/* Persistent Navbar */}
            <Navbar onOpenNotifications={() => setIsNotificationOpen(true)} />

            {/* In-app Socket Notification Drawer */}
            <NotificationDrawer
              isOpen={isNotificationOpen}
              onClose={() => setIsNotificationOpen(false)}
            />

            {/* Main Content Router */}
            <main className="flex-1">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/doctors" element={<FindDoctorsPage />} />
                <Route path="/doctors/:id" element={<DoctorDetailsPage />} />
                <Route path="/specialties" element={<SpecialtiesPage />} />
                <Route path="/hospitals" element={<HospitalsPage />} />
                <Route path="/how-it-works" element={<HowItWorksPage />} />
                <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />

                {/* Authentication Routes */}
                <Route path="/login" element={<PatientLoginPage />} />
                <Route path="/register" element={<PatientRegisterPage />} />
                <Route path="/staff-login" element={<StaffLoginPage />} />
                <Route path="/doctor-registration" element={<DoctorRegistrationRequestPage />} />

                {/* Protected Patient Portal */}
                <Route
                  path="/patient/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['PATIENT', 'RECEPTIONIST', 'ADMIN']}>
                      <PatientDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Protected Doctor Portal */}
                <Route
                  path="/doctor"
                  element={
                    <ProtectedRoute allowedRoles={['DOCTOR']}>
                      <DoctorDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Protected Receptionist Portal */}
                <Route
                  path="/receptionist"
                  element={
                    <ProtectedRoute allowedRoles={['RECEPTIONIST', 'ADMIN']}>
                      <ReceptionistDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Protected Admin Portal */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>

            {/* Footer with Healthcare Notices */}
            <Footer />
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
