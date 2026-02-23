import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ProfilePage from './pages/ProfilePage';

import DashboardLayout from './components/DashboardLayout';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';
import CreateTestPage from './pages/CreateTestPage';
import TakeTestPage from './pages/TakeTestPage';
import ResultPage from './pages/ResultPage';
import PaymentPage from './pages/PaymentPage';
import SyllabusPage from './pages/SyllabusPage';
import TopicManagementPage from './pages/TopicManagementPage';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardRedirect from './components/DashboardRedirect';
import ChatWidget from './components/ChatWidget';
import EditTestPage from './pages/EditTestPage';
import { authService } from './services/auth';

import InactivityHandler from './components/InactivityHandler';
import BooksPage from './pages/BooksPage';
import SyllabusManagementPage from './pages/SyllabusManagementPage';
import AdminReportsPage from './pages/AdminReportsPage';
import HelpButton from './components/HelpButton';
import Footer from './components/Footer';

function App() {

  const handleContextMenu = (e) => {
    e.preventDefault();
  };

  return (
    <div
      className="min-h-screen flex flex-col font-sans bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300"
      onContextMenu={handleContextMenu}
    >
      <InactivityHandler />
      <HelpButton />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<><Navbar /><LoginPage /></>} />
        <Route path="/signup" element={<><Navbar /><SignupPage /></>} />

        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }>
          <Route index element={<DashboardRedirect />} />
          <Route path="student" element={<StudentDashboard />} />
          <Route path="student/syllabus" element={<SyllabusPage />} />
          <Route path="student/books" element={<BooksPage />} />
          <Route path="manage-topics" element={<TopicManagementPage />} />
          <Route path="admin/syllabus" element={<SyllabusManagementPage />} />
          <Route path="admin/reports" element={<AdminReportsPage />} />
          <Route path="create-test" element={<CreateTestPage />} />
          <Route path="my-tests" element={<TeacherDashboard />} />
          <Route path="edit-test/:testId" element={<EditTestPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        <Route path="/payment" element={
          <ProtectedRoute>
            <PaymentPage />
          </ProtectedRoute>
        } />

        <Route path="/dashboard/take-test/:testId" element={
          <ProtectedRoute allowedRoles={['student', 'teacher', 'admin', 'TEACHER', 'STUDENT']}>
            <TakeTestPage />
          </ProtectedRoute>
        } />

        <Route path="/dashboard/result/:resultId" element={
          <ProtectedRoute>
            <ResultPage />
          </ProtectedRoute>
        } />

        <Route path="*" element={<div className="p-8 text-center">404 - Not Found</div>} />
      </Routes>
      <Footer />
      <ChatWidget />
    </div>
  );
}

export default App;
