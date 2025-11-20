import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useApp } from "../context/AppContext";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, logout } = useApp();
  
  const isAuthenticated = !!currentUser;
  const role = currentUser?.role;

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Public navbar (when NOT logged in)
  if (!isAuthenticated) {
    return (
      <nav className="bg-white shadow">
        <div className="container mx-auto flex justify-between items-center py-4 px-4">
          <Link to="/" className="text-2xl font-bold text-blue-600">
            Synkronos AI
          </Link>
          <div className="flex gap-6 items-center">
            <Link to="/" className="hover:text-blue-600 font-medium">Home</Link>
            <Link to="/jobs" className="hover:text-blue-600 font-medium">Jobs</Link>
            <Link to="/login" className="hover:text-blue-600 font-medium">Sign In</Link>
            <Link to="/register" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-medium">
              Register
            </Link>
          </div>
        </div>
      </nav>
    );
  }

  // Job Seeker Navbar
  if (role === "jobseeker") {
    return (
      <nav className="bg-white shadow">
        <div className="container mx-auto flex justify-between items-center py-4 px-4">
          <Link to="/seeker/home" className="text-2xl font-bold text-blue-600">
            Synkronos AI
          </Link>
          <div className="flex gap-6 items-center">
            <Link to="/seeker/home" className="hover:text-blue-600 font-medium">Dashboard</Link>
            <Link to="/seeker/resume-search" className="hover:text-blue-600 font-medium">Resume-Based Search</Link>
            <Link to="/seeker/applied" className="hover:text-blue-600 font-medium">Applied Jobs</Link>
            <Link to="/seeker/profile" className="hover:text-blue-600 font-medium">Profile</Link>
            <button 
              onClick={handleLogout} 
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>
    );
  }

  // Recruiter Navbar
  if (role === "recruiter") {
    return (
      <nav className="bg-white shadow">
        <div className="container mx-auto flex justify-between items-center py-4 px-4">
          <Link to="/recruiter/home" className="text-2xl font-bold text-blue-600">
            Synkronos AI
          </Link>
          <div className="flex gap-6 items-center">
            <Link to="/recruiter/home" className="hover:text-blue-600 font-medium">Dashboard</Link>
            <Link to="/recruiter/applications" className="hover:text-blue-600 font-medium">Applications</Link>
            <Link to="/recruiter/post-job" className="hover:text-blue-600 font-medium">Post a New Job</Link>
            <Link to="/recruiter/profile" className="hover:text-blue-600 font-medium">Profile</Link>
            <button 
              onClick={handleLogout} 
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>
    );
  }

  // Fallback
  return (
    <nav className="bg-white shadow">
      <div className="container mx-auto flex justify-between items-center py-4 px-4">
        <Link to="/" className="text-2xl font-bold text-blue-600">
          Synkronos AI
        </Link>
        <div className="flex gap-6 items-center">
          <Link to="/" className="hover:text-blue-600 font-medium">Home</Link>
          <Link to="/login" className="hover:text-blue-600 font-medium">Sign In</Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 