import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import HomePage from "./pages/HomePage";
import JobListings from "./pages/JobListings";
import JobDetail from "./pages/JobDetail";
import Apply from "./pages/Apply";
import JobSeekerDashboard from "./pages/JobSeekerDashboard";
import AppliedJobs from "./pages/AppliedJobs";
import ResumeSearch from "./pages/ResumeSearch";
import RecruiterHome from "./pages/RecruiterHome";
import RecruiterApplications from "./pages/RecruiterApplications";
import PendingApplications from "./pages/PendingApplications";
import PostJob from "./pages/PostJob";
import Profile from "./pages/Profile";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <AppProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/jobs" element={<JobListings />} />
            <Route path="/job/:jobId" element={<JobDetail />} />

            {/* Job Seeker Routes */}
            <Route
              path="/seeker/home"
              element={
                <ProtectedRoute allowedRoles={["jobseeker"]}>
                  <JobSeekerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/seeker/resume-search"
              element={
                <ProtectedRoute allowedRoles={["jobseeker"]}>
                  <ResumeSearch />
                </ProtectedRoute>
              }
            />
            <Route
              path="/seeker/applied"
              element={
                <ProtectedRoute allowedRoles={["jobseeker"]}>
                  <AppliedJobs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/seeker/profile"
              element={
                <ProtectedRoute allowedRoles={["jobseeker"]}>
                  <Profile />
                </ProtectedRoute>
              }
            />

            {/* Recruiter Routes */}
            <Route
              path="/recruiter/home"
              element={
                <ProtectedRoute allowedRoles={["recruiter"]}>
                  <RecruiterHome />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recruiter/applications"
              element={
                <ProtectedRoute allowedRoles={["recruiter"]}>
                  <RecruiterApplications />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recruiter/pending"
              element={
                <ProtectedRoute allowedRoles={["recruiter"]}>
                  <PendingApplications />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recruiter/post-job"
              element={
                <ProtectedRoute allowedRoles={["recruiter"]}>
                  <PostJob />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recruiter/profile"
              element={
                <ProtectedRoute allowedRoles={["recruiter"]}>
                  <Profile />
                </ProtectedRoute>
              }
            />

            {/* Application Route */}
            <Route
              path="/apply/:jobId"
              element={
                <ProtectedRoute allowedRoles={["jobseeker"]}>
                  <Apply />
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </Router>
    </AppProvider>
  );
}

export default App; 