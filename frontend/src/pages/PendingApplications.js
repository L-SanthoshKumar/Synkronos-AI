import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import api from '../api';

const PendingApplications = () => {
  const { currentUser } = useApp();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState([]);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const location = useLocation();

  const loadPendingApplications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/applications/pending');
      if (res.data.success) {
        setApplications(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching pending applications:', err);
      setApplications([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadPendingApplications();
  }, [location.pathname]);

  // Refresh when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadPendingApplications();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!document.hidden) {
        loadPendingApplications();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleViewApplication = async (applicationId) => {
    try {
      const res = await api.get(`/applications/${applicationId}`);
      setSelectedApplication(res.data.data);
      setShowApplicationModal(true);
    } catch (err) {
      console.error('Error fetching application details:', err);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      interviewing: 'bg-purple-100 text-purple-800',
      shortlisted: 'bg-green-100 text-green-800',
      offered: 'bg-indigo-100 text-indigo-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status) => {
    const labels = {
      interviewing: 'Interviewing',
      shortlisted: 'Shortlisted',
      offered: 'Offered',
      rejected: 'Rejected'
    };
    return labels[status] || status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Pending Applications</h1>
            <p className="text-gray-600">Applications where you have taken action</p>
          </div>
          <button
            onClick={loadPendingApplications}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium transition disabled:opacity-50"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading pending applications...</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Pending Applications</h3>
            <p className="text-gray-600">Applications will appear here once you take action (schedule interview, select, or hire).</p>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => (
              <div key={app._id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-blue-600 mb-2">{app.job?.title}</h3>
                    <p className="text-lg font-medium text-gray-700 mb-1">
                      {app.applicantInfo?.firstName} {app.applicantInfo?.lastName}
                    </p>
                    <p className="text-sm text-gray-500 mb-3">
                      {app.applicant?.email} • {app.applicant?.phone || 'No phone'}
                    </p>
                    {app.lastAction && (
                      <div className="text-sm text-gray-600">
                        <p>Last Action: {app.lastAction.description}</p>
                        <p>Time: {new Date(app.lastAction.timestamp).toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded text-sm font-medium ${getStatusColor(app.status)}`}>
                      {getStatusLabel(app.status)}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t">
                  <div className="text-sm text-gray-500">
                    Applied on: {new Date(app.appliedAt || app.createdAt).toLocaleDateString()}
                  </div>
                  <button
                    onClick={() => handleViewApplication(app._id)}
                    className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Application Details Modal */}
        {showApplicationModal && selectedApplication && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Application Details</h3>
                <button
                  onClick={() => setShowApplicationModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-700">Job Information</h4>
                  <div className="bg-gray-50 p-3 rounded mt-2">
                    <p><strong>Title:</strong> {selectedApplication.job?.title}</p>
                    <p><strong>Company:</strong> {selectedApplication.job?.company?.name || 'N/A'}</p>
                    <p><strong>Location:</strong> {selectedApplication.job?.location || 'N/A'}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-700">Applicant Information</h4>
                  <div className="bg-gray-50 p-3 rounded mt-2">
                    <p><strong>Name:</strong> {selectedApplication.applicantInfo?.firstName} {selectedApplication.applicantInfo?.lastName}</p>
                    <p><strong>Email:</strong> {selectedApplication.applicantInfo?.email || selectedApplication.applicant?.email}</p>
                    <p><strong>Phone:</strong> {selectedApplication.applicantInfo?.phone || selectedApplication.applicant?.phone || 'N/A'}</p>
                    {selectedApplication.applicantInfo?.qualifications && (
                      <>
                        <p><strong>Degree:</strong> {selectedApplication.applicantInfo.qualifications.degree}</p>
                        <p><strong>Major:</strong> {selectedApplication.applicantInfo.qualifications.major}</p>
                        <p><strong>College:</strong> {selectedApplication.applicantInfo.qualifications.college}</p>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-700">Resume</h4>
                  <div className="bg-gray-50 p-3 rounded mt-2">
                    <div><strong>File:</strong> {selectedApplication.resume?.filename}</div>
                    <div><strong>Uploaded:</strong> {new Date(selectedApplication.resume?.uploadedAt).toLocaleDateString()}</div>
                    <a
                      href={`${process.env.REACT_APP_API_URL?.replace(/\/api$/, '') || 'http://localhost:5000'}/${selectedApplication.resume?.path?.replace(/^.*uploads[\/\\]/, 'uploads/') || 'uploads/' + selectedApplication.resume?.path}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm mt-2 inline-block"
                    >
                      View Resume
                    </a>
                  </div>
                </div>

                {selectedApplication.interviews && selectedApplication.interviews.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-700">Scheduled Interviews</h4>
                    <div className="bg-gray-50 p-3 rounded mt-2 space-y-2">
                      {selectedApplication.interviews.map((interview, idx) => (
                        <div key={idx} className="border-b pb-2 last:border-b-0 last:pb-0">
                          <div><strong>Type:</strong> {interview.type.charAt(0).toUpperCase() + interview.type.slice(1)}</div>
                          <div><strong>Scheduled:</strong> {new Date(interview.scheduledAt).toLocaleString()}</div>
                          <div><strong>Duration:</strong> {interview.duration} minutes</div>
                          {interview.location && <div><strong>Location:</strong> {interview.location}</div>}
                          <div><strong>Status:</strong> <span className={`px-2 py-1 rounded text-xs ${interview.status === 'scheduled' ? 'bg-blue-100 text-blue-800' : interview.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{interview.status}</span></div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedApplication.history && selectedApplication.history.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-700">Action History</h4>
                    <div className="bg-gray-50 p-3 rounded mt-2 space-y-2">
                      {selectedApplication.history.slice().reverse().map((action, idx) => (
                        <div key={idx} className="border-b pb-2 last:border-b-0 last:pb-0">
                          <div><strong>Action:</strong> {action.action}</div>
                          <div><strong>Description:</strong> {action.description}</div>
                          <div><strong>Time:</strong> {new Date(action.timestamp).toLocaleString()}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PendingApplications;

