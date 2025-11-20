import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [jobs, setJobs] = useState([]); // Public jobs (for job seekers)
  const [recruiterJobs, setRecruiterJobs] = useState([]); // Recruiter's posted jobs
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Initialize user from localStorage
  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    if (token && role) {
      fetchUserProfile();
    } else {
      setLoading(false);
    }
  }, []);

  // Fetch user profile
  const fetchUserProfile = async () => {
    try {
      const res = await api.get('/auth/profile');
      setCurrentUser(res.data.data.user || res.data.data);
    } catch (err) {
      console.error('Error fetching profile:', err);
      // Clear invalid token
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all jobs
  const fetchJobs = async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) params.append(key, filters[key]);
      });
      
      const res = await api.get(`/jobs?${params.toString()}`);
      setJobs(res.data.data || []);
      return res.data.data || [];
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setJobs([]);
      return [];
    }
  };

  // Fetch recruiter's posted jobs
  const fetchRecruiterJobs = async () => {
    try {
      const res = await api.get('/jobs/my-jobs');
      setRecruiterJobs(res.data.data || []);
      return res.data.data || [];
    } catch (err) {
      console.error('Error fetching recruiter jobs:', err);
      setRecruiterJobs([]);
      return [];
    }
  };

  // Fetch applications
  const fetchApplications = async () => {
    try {
      const role = localStorage.getItem('role');
      if (role === 'jobseeker') {
        // Job seekers should use the base route which is protected by isJobSeeker middleware
        console.log('[FRONTEND] Fetching job seeker applications...');
        const res = await api.get('/applications');
        console.log('[FRONTEND] Job seeker applications response:', {
          success: res.data.success,
          count: res.data.data?.length || 0,
          data: res.data.data
        });
        setApplications(res.data.data || []);
        return res.data.data || [];
      } else if (role === 'recruiter') {
        // Recruiters use the my-applications route
        console.log('[FRONTEND] Fetching recruiter applications...');
        const res = await api.get('/applications/my-applications');
        console.log('[FRONTEND] Recruiter applications response:', {
          success: res.data.success,
          count: res.data.data?.length || 0,
          data: res.data.data
        });
        setApplications(res.data.data || []);
        return res.data.data || [];
      }
    } catch (err) {
      console.error('[FRONTEND] Error fetching applications:', err);
      console.error('[FRONTEND] Error details:', err.response?.data);
      setApplications([]);
      return [];
    }
  };

  // Login
  const login = (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('role', user.role);
    setCurrentUser(user);
  };

  // Logout
  const logout = () => {
    localStorage.clear();
    setCurrentUser(null);
    setJobs([]);
    setRecruiterJobs([]);
    setApplications([]);
  };

  // Add job
  const addJob = (job) => {
    setRecruiterJobs(prev => [job, ...prev]);
    // Also add to public jobs if it's active
    if (job.status === 'active') {
      setJobs(prev => [job, ...prev]);
    }
  };

  // Add application
  const addApplication = (application) => {
    setApplications(prev => [application, ...prev]);
  };

  // Update application
  const updateApplication = (applicationId, updates) => {
    setApplications(prev =>
      prev.map(app =>
        app._id === applicationId ? { ...app, ...updates } : app
      )
    );
  };

  // Withdraw application
  const withdrawApplication = async (applicationId) => {
    try {
      console.log(`[FRONTEND] Attempting to withdraw application: ${applicationId}`);
      const res = await api.put(`/applications/${applicationId}/withdraw`);
      console.log(`[FRONTEND] Withdraw response:`, res.data);
      if (res.data.success) {
        // Update the application in state
        updateApplication(applicationId, { status: 'withdrawn' });
        // Refresh applications to ensure both dashboards are updated
        await fetchApplications();
        return res.data;
      }
      throw new Error(res.data.message || 'Failed to withdraw application');
    } catch (err) {
      console.error('[FRONTEND] Error withdrawing application:', err);
      throw err;
    }
  };

  const value = {
    currentUser,
    jobs,
    recruiterJobs,
    applications,
    loading,
    login,
    logout,
    fetchUserProfile,
    fetchJobs,
    fetchRecruiterJobs,
    fetchApplications,
    addJob,
    addApplication,
    updateApplication,
    withdrawApplication,
    setJobs,
    setRecruiterJobs,
    setApplications,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

