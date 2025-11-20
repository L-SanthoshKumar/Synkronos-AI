import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const AppliedJobs = () => {
  const { currentUser, applications, fetchApplications, withdrawApplication } = useApp();
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const location = useLocation();

  const loadApplications = async () => {
    setLoading(true);
    await fetchApplications();
    setLoading(false);
  };

  useEffect(() => {
    loadApplications();
  }, [location.pathname]);

  // Refresh when page becomes visible (user navigates back)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadApplications();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Auto-refresh applications every 30 seconds to catch status updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (!document.hidden) {
        loadApplications();
      }
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status) => {
    const colors = {
      applied: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800',
      reviewing: 'bg-blue-100 text-blue-800',
      interviewing: 'bg-purple-100 text-purple-800',
      shortlisted: 'bg-green-100 text-green-800',
      offered: 'bg-indigo-100 text-indigo-800',
      hired: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      withdrawn: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const handleWithdraw = async (applicationId) => {
    if (!window.confirm('Are you sure you want to withdraw this application? This action cannot be undone.')) {
      return;
    }

    setWithdrawing(applicationId);
    setError(null);
    setSuccess(null);
    try {
      const result = await withdrawApplication(applicationId);
      // Refresh applications to get updated data
      await fetchApplications();
      // Show success message
      const successMessage = result?.message || 'Application withdrawn successfully!';
      setSuccess(successMessage);
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      console.error('Withdraw error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to withdraw application. Please try again.';
      setError(errorMessage);
      setTimeout(() => setError(null), 5000);
    } finally {
      setWithdrawing(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">My Applications</h1>
            <p className="text-gray-600">Track the status of all your job applications</p>
          </div>
          <button
            onClick={loadApplications}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium transition disabled:opacity-50"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading applications...</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Applications Yet</h3>
            <p className="text-gray-600 mb-6">You haven't applied to any jobs yet. Start exploring opportunities!</p>
            <Link
              to="/seeker/home"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition"
            >
              Browse Jobs
            </Link>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                ✓ {success}
              </div>
            )}
            <div className="space-y-4">
              {applications.map((app) => (
                <div key={app._id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-blue-600 mb-2">{app.job?.title}</h3>
                      <p className="text-lg font-medium text-gray-700 mb-1">{app.job?.company?.name}</p>
                      <p className="text-sm text-gray-500 mb-3">
                        {app.job?.location?.city}, {app.job?.location?.country} • {app.job?.workType} • {app.job?.jobType}
                      </p>
                      <div className="text-sm text-gray-600">
                        <p>Applied on: {new Date(app.appliedAt || app.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded text-sm font-medium ${getStatusColor(app.status)}`}>
                      {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                    </span>
                  </div>

                  {app.job?.summary && (
                    <p className="text-gray-600 text-sm mb-4">
                      {app.job.summary.substring(0, 200)}...
                    </p>
                  )}

                  <div className="flex justify-between items-center pt-4 border-t">
                    <div className="text-sm text-gray-500">
                      {app.resume?.filename && (
                        <span>Resume: {app.resume.filename}</span>
                      )}
                    </div>
                    {app.status !== 'withdrawn' && app.status !== 'hired' && app.status !== 'rejected' && (
                      <button
                        onClick={() => handleWithdraw(app._id)}
                        disabled={withdrawing === app._id}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {withdrawing === app._id ? 'Withdrawing...' : 'Withdraw Application'}
                      </button>
                    )}
                    {app.status === 'withdrawn' && (
                      <span className="text-gray-500 text-sm italic">Application withdrawn</span>
                    )}
                    {(app.status === 'hired' || app.status === 'rejected') && (
                      <span className="text-gray-500 text-sm italic">Cannot withdraw</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AppliedJobs;

