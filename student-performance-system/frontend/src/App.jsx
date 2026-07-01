import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import ResetPasswordPage from './pages/ResetPasswordPage';
import OAuthCallbackPage from './pages/OAuthCallbackPage';
import Profile from './pages/Profile';
import Messages from './pages/Messages';
import AdminDashboard from './pages/AdminDashboard';
import AdminStudents from './pages/AdminStudents';
import AdminFaculty from './pages/AdminFaculty';
import FacultyDashboard from './pages/FacultyDashboard';
import FacultyAttendance from './pages/FacultyAttendance';
import FacultyMarks from './pages/FacultyMarks';
import FacultyAnalytics from './pages/FacultyAnalytics';
import FacultyCreateAssessment from './pages/FacultyCreateAssessment';
import StudentDashboard from './pages/StudentDashboard';
import Assessment from './pages/Assessment';
import AICareerCoach from './pages/AICareerCoach';
import ResumeBuilder from './pages/ResumeBuilder';
import Analytics from './pages/Analytics';
import AuditLogs from './pages/AuditLogs';
import Settings from './pages/Settings';
import { AdminCalendar, AdminMessages, AdminProjects, AdminTasks, AdminTeam } from './pages/AdminWorkspaces';
import AICopilot from './components/AICopilot';

import AdminAcademicSetup from './pages/AdminAcademicSetup';
import AdminDepartments from './pages/AdminDepartments';
import AdminCourses from './pages/AdminCourses';
import AdminSubjects from './pages/AdminSubjects';
import AdminAcademicYears from './pages/AdminAcademicYears';
import AdminSemesters from './pages/AdminSemesters';
import AdminFacultyAllocation from './pages/AdminFacultyAllocation';

import { Menu } from 'lucide-react';

// Dashboard layout wrapping Sidebar and child dashboards
const DashboardLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  return (
    <div className="flex h-screen w-screen bg-slate-50 text-slate-900 overflow-hidden">
      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-40 flex items-center px-4 justify-between">
        <div className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white">
            <span className="font-bold text-lg font-sans">A.</span>
          </div>
          <span className="text-sm font-semibold text-slate-900">PredictEdu</span>
        </div>
        <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-slate-600">
          <Menu size={24} />
        </button>
      </div>

      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      <div className="flex-1 flex flex-col overflow-hidden pt-16 md:pt-0">
        {children}
      </div>
    </div>
  );
};

// Root Router Redirector based on role
const RootRedirect = () => {
  const { user, token } = useAuth();

  if (!token || !user) {
    return <Navigate to="/home" replace />;
  }

  // Redirect based on user role
  return <Navigate to={`/${user.role}`} replace />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* ── Public Routes ────────────────────────────────────────── */}
          <Route path="/home" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ResetPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/oauth-callback" element={<OAuthCallbackPage />} />

          {/* ── Admin Protected Routes ───────────────────────────────── */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout>
                  <AdminDashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/academic-setup"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout>
                  <AdminAcademicSetup />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/departments"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout>
                  <AdminDepartments />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/courses"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout>
                  <AdminCourses />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/subjects"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout>
                  <AdminSubjects />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/academic-years"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout>
                  <AdminAcademicYears />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/semesters"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout>
                  <AdminSemesters />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/faculty-allocation"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout>
                  <AdminFacultyAllocation />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/analytics"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout>
                  <Analytics />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/students"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout>
                  <AdminStudents />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/faculty"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout>
                  <AdminFaculty />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/projects"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout>
                  <AdminProjects />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/tasks"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout>
                  <AdminTasks />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/calendar"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout>
                  <AdminCalendar />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/team"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout>
                  <AdminTeam />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/logs"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout>
                  <AuditLogs />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout>
                  <Settings />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* ── Faculty Protected Routes ─────────────────────────────── */}
          <Route
            path="/faculty"
            element={
              <ProtectedRoute allowedRoles={['faculty']}>
                <DashboardLayout>
                  <FacultyDashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/faculty/attendance"
            element={
              <ProtectedRoute allowedRoles={['faculty']}>
                <DashboardLayout>
                  <FacultyAttendance />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/faculty/marks"
            element={
              <ProtectedRoute allowedRoles={['faculty']}>
                <DashboardLayout>
                  <FacultyMarks />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/faculty/analytics"
            element={
              <ProtectedRoute allowedRoles={['faculty']}>
                <DashboardLayout>
                  <FacultyAnalytics />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/faculty/create-assessment"
            element={
              <ProtectedRoute allowedRoles={['faculty']}>
                <DashboardLayout>
                  <FacultyCreateAssessment />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* ── Student Protected Routes ─────────────────────────────── */}
          <Route
            path="/student"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <DashboardLayout>
                  <StudentDashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/assessment"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <DashboardLayout>
                  <Assessment />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/ai-coach"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <DashboardLayout>
                  <AICareerCoach />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/resume-builder"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <DashboardLayout>
                  <ResumeBuilder />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* ── Fallbacks ────────────────────────────────────────────── */}
          <Route path="/" element={<RootRedirect />} />
          <Route path="*" element={<Navigate to="/" replace />} />
          
          <Route
            path="/profile"
            element={
              <ProtectedRoute allowedRoles={['admin', 'faculty', 'student']}>
                <DashboardLayout>
                  <Profile />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/messages"
            element={
              <ProtectedRoute allowedRoles={['admin', 'faculty', 'student']}>
                <DashboardLayout>
                  <Messages />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
        <AICopilot />
      </Router>
    </AuthProvider>
  );
}

export default App;
