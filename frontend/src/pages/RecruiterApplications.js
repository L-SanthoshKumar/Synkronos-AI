import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useForm } from 'react-hook-form';
import api from '../api';

const RecruiterApplications = () => {
  const { currentUser, applications: allApplications, fetchApplications, updateApplication } = useApp();
  // Show all applications - they remain visible even after actions are taken
  const applications = allApplications || [];
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [interviewLoading, setInterviewLoading] = useState(false);
  const { register: registerInterview, handleSubmit: handleSubmitInterview, formState: { errors: interviewErrors }, reset: resetInterview } = useForm();
  const location = useLocation();

  const loadApplications = async () => {
    setLoading(true);
    try {
      await fetchApplications();
      // Applications are filtered in the component render
      console.log('[RecruiterApplications] Loaded applications');
    } catch (err) {
      console.error('[RecruiterApplications] Error loading applications:', err);
    }
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

  // Auto-refresh applications every 30 seconds to catch new applications
  useEffect(() => {
    const interval = setInterval(() => {
      if (!document.hidden) {
        loadApplications();
      }
    }, 30000); // Refresh every 30 seconds

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

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const handleSelect = async (applicationId) => {
    setStatusLoading(true);
    try {
      const res = await api.post(`/applications/${applicationId}/select`);
      if (res.data.success) {
        showToast(res.data.message || 'Candidate shortlisted. Email sent successfully!');
        await loadApplications();
      }
    } catch (err) {
      console.error('Error selecting candidate:', err);
      showToast(err.response?.data?.message || 'Failed to shortlist candidate', 'error');
    }
    setStatusLoading(false);
  };

  const handleHire = async (applicationId) => {
    setStatusLoading(true);
    try {
      const res = await api.post(`/applications/${applicationId}/hire`);
      if (res.data.success) {
        showToast(res.data.message || 'Candidate hired. Email sent successfully!');
        await loadApplications();
      }
    } catch (err) {
      console.error('Error hiring candidate:', err);
      showToast(err.response?.data?.message || 'Failed to hire candidate', 'error');
    }
    setStatusLoading(false);
  };

  const handleReject = async (applicationId) => {
    if (!window.confirm('Are you sure you want to reject this candidate? An email will be sent to the applicant.')) {
      return;
    }
    setStatusLoading(true);
    try {
      const res = await api.post(`/applications/${applicationId}/reject`);
      if (res.data.success) {
        showToast(res.data.message || 'Application rejected. Email sent successfully!');
        await loadApplications();
      }
    } catch (err) {
      console.error('Error rejecting candidate:', err);
      showToast(err.response?.data?.message || 'Failed to reject candidate', 'error');
    }
    setStatusLoading(false);
  };


  const onSubmitInterview = async (data) => {
    setInterviewLoading(true);
    try {
      // Combine date and time into ISO string
      const scheduledAt = new Date(`${data.date}T${data.time}`).toISOString();
      
      await api.post(`/applications/${selectedApplication._id}/schedule-interview`, {
        type: data.type,
        scheduledAt: scheduledAt,
        duration: parseInt(data.duration),
        location: data.location || ''
      });
      
      setShowInterviewModal(false);
      resetInterview();
      await loadApplications();
      alert('Interview scheduled successfully!');
    } catch (err) {
      console.error('Error scheduling interview:', err);
      const errorMsg = err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Failed to schedule interview';
      alert(errorMsg);
    }
    setInterviewLoading(false);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      reviewing: 'bg-blue-100 text-blue-800',
      shortlisted: 'bg-green-100 text-green-800',
      interviewed: 'bg-purple-100 text-purple-800',
      offered: 'bg-indigo-100 text-indigo-800',
      hired: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      withdrawn: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Applications</h1>
            <p className="text-gray-600">Review and manage job applications</p>
            <p className="text-sm text-gray-500 mt-1">
              Current user: {currentUser?.firstName} {currentUser?.lastName} ({currentUser?.email})
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                console.log('[RecruiterApplications] Manual refresh triggered');
                console.log('[RecruiterApplications] Current applications in state:', applications.length);
                loadApplications();
              }}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium transition disabled:opacity-50"
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Toast Notification */}
        {toast && (
          <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${
            toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
          }`}>
            <div className="flex items-center gap-2">
              <span>{toast.type === 'error' ? '✕' : '✓'}</span>
              <span>{toast.message}</span>
            </div>
          </div>
        )}

        {/* Debug Info Panel */}
        <div className="mb-4 p-4 bg-gray-100 rounded-lg text-sm">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <strong>Applications in State:</strong> {applications.length}
            </div>
            <div>
              <strong>Loading:</strong> {loading ? 'Yes' : 'No'}
            </div>
            <div>
              <strong>User Role:</strong> {currentUser?.role || 'Unknown'}
            </div>
          </div>
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
            <p className="text-gray-600 mb-4">Applications will appear here once job seekers apply to your jobs.</p>
            <p className="text-sm text-gray-500 mb-4">Make sure you have posted jobs and job seekers have applied to them.</p>
            <p className="text-xs text-gray-400 italic">This page auto-refreshes every 30 seconds to show new applications.</p>
          </div>
        ) : (
          <>
            <div className="mb-4 text-sm text-gray-600">
              Total Applications: <span className="font-semibold">{applications.length}</span>
              {' | '}
              Withdrawn: <span className="font-semibold">{applications.filter(app => app.status === 'withdrawn').length}</span>
              {' | '}
              Active: <span className="font-semibold">{applications.filter(app => app.status !== 'withdrawn').length}</span>
            </div>
          <div className="space-y-4">
            {applications.map((app) => (
              <div key={app._id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="font-semibold text-lg text-blue-600">
                      {app.applicantInfo?.firstName || app.applicant?.firstName} {app.applicantInfo?.lastName || app.applicant?.lastName}
                    </div>
                    <div className="text-sm text-gray-700 font-medium mt-1">Applied for: {app.job?.title}</div>
                    <div className="text-xs text-gray-500 mt-2 space-y-1">
                      <div>📅 Applied: {new Date(app.appliedAt || app.createdAt).toLocaleDateString()}</div>
                      {app.applicantInfo?.email && (
                        <div>📧 Email: {app.applicantInfo.email}</div>
                      )}
                      {app.applicantInfo?.phone && (
                        <div>📞 Phone: {app.applicantInfo.phone}</div>
                      )}
                      {app.applicantInfo?.qualifications && (
                        <div>🎓 {app.applicantInfo.qualifications.degree} in {app.applicantInfo.qualifications.major}</div>
                      )}
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded text-sm font-medium ${getStatusColor(app.status)}`}>
                    {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                  </span>
                </div>
                {app.status === 'withdrawn' && (
                  <div className="mb-2 text-sm text-gray-500 italic">
                    This application was withdrawn by the applicant
                  </div>
                )}
                <div className="flex gap-2 mt-3 flex-wrap">
                  <button
                    onClick={() => handleViewApplication(app._id)}
                    className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => {
                      setSelectedApplication(app);
                      setShowInterviewModal(true);
                    }}
                    disabled={app.status === 'rejected' || app.status === 'withdrawn'}
                    className="bg-indigo-600 text-white px-4 py-2 rounded text-sm hover:bg-indigo-700 disabled:opacity-50"
                  >
                    Schedule Interview
                  </button>
                  <button
                    onClick={() => handleSelect(app._id)}
                    disabled={statusLoading || app.status === 'shortlisted' || app.status === 'offered' || app.status === 'rejected'}
                    className="bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700 disabled:opacity-50"
                  >
                    Select
                  </button>
                  <button
                    onClick={() => handleHire(app._id)}
                    disabled={statusLoading || app.status === 'offered' || app.status === 'rejected'}
                    className="bg-purple-600 text-white px-3 py-2 rounded text-sm hover:bg-purple-700 disabled:opacity-50"
                  >
                    Hire
                  </button>
                  <button
                    onClick={() => handleReject(app._id)}
                    disabled={statusLoading || app.status === 'rejected'}
                    className="bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700 disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
          </>
        )}

        {/* Application Details Modal */}
        {showApplicationModal && selectedApplication && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Application Details</h3>
                <button
                  onClick={() => setShowApplicationModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-700">Applicant Information</h4>
                  <div className="bg-gray-50 p-3 rounded mt-2">
                    <div><strong>Name:</strong> {selectedApplication.applicantInfo?.firstName || selectedApplication.applicant?.firstName} {selectedApplication.applicantInfo?.lastName || selectedApplication.applicant?.lastName}</div>
                    <div><strong>Email:</strong> {selectedApplication.applicantInfo?.email || selectedApplication.applicant?.email}</div>
                    <div><strong>Phone:</strong> {selectedApplication.applicantInfo?.phone || selectedApplication.applicant?.phone || 'Not provided'}</div>
                    
                    {selectedApplication.applicantInfo?.qualifications && (
                      <div className="mt-3">
                        <strong>Education:</strong>
                        <div className="ml-4 mt-1">
                          <div><strong>Degree:</strong> {selectedApplication.applicantInfo.qualifications.degree}</div>
                          <div><strong>Major:</strong> {selectedApplication.applicantInfo.qualifications.major}</div>
                          <div><strong>College:</strong> {selectedApplication.applicantInfo.qualifications.college}</div>
                          {selectedApplication.applicantInfo.qualifications.cgpa && (
                            <div><strong>CGPA:</strong> {selectedApplication.applicantInfo.qualifications.cgpa}</div>
                          )}
                          <div><strong>Graduation Year:</strong> {selectedApplication.applicantInfo.qualifications.graduationYear}</div>
                        </div>
                      </div>
                    )}
                    
                    {selectedApplication.applicantInfo?.experience && (
                      <div className="mt-3">
                        <strong>Experience:</strong>
                        <p className="text-sm mt-1 ml-4">{selectedApplication.applicantInfo.experience}</p>
                      </div>
                    )}
                    
                    {selectedApplication.applicantInfo?.skills && (
                      <div className="mt-3">
                        <strong>Skills:</strong>
                        <p className="text-sm mt-1 ml-4">{selectedApplication.applicantInfo.skills}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-700">Job Information</h4>
                  <div className="bg-gray-50 p-3 rounded mt-2">
                    <div><strong>Position:</strong> {selectedApplication.job?.title}</div>
                    <div><strong>Company:</strong> {selectedApplication.job?.company?.name}</div>
                    <div><strong>Location:</strong> {selectedApplication.job?.location?.city}, {selectedApplication.job?.location?.country}</div>
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

                <div>
                  <h4 className="font-medium text-gray-700">Quick Actions</h4>
                  <div className="flex gap-2 flex-wrap mt-2">
                    <button
                      onClick={() => {
                        setShowApplicationModal(false);
                        setSelectedApplication(selectedApplication);
                        setShowInterviewModal(true);
                      }}
                      disabled={selectedApplication.status === 'rejected' || selectedApplication.status === 'withdrawn'}
                      className="bg-indigo-600 text-white px-3 py-1 rounded text-sm hover:bg-indigo-700 disabled:opacity-50"
                    >
                      Schedule Interview
                    </button>
                    <button
                      onClick={() => {
                        setShowApplicationModal(false);
                        handleSelect(selectedApplication._id);
                      }}
                      disabled={statusLoading || selectedApplication.status === 'shortlisted' || selectedApplication.status === 'offered' || selectedApplication.status === 'rejected'}
                      className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50"
                    >
                      Select
                    </button>
                    <button
                      onClick={() => {
                        setShowApplicationModal(false);
                        handleHire(selectedApplication._id);
                      }}
                      disabled={statusLoading || selectedApplication.status === 'offered' || selectedApplication.status === 'rejected'}
                      className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700 disabled:opacity-50"
                    >
                      Hire
                    </button>
                    <button
                      onClick={() => {
                        setShowApplicationModal(false);
                        handleReject(selectedApplication._id);
                      }}
                      disabled={statusLoading || selectedApplication.status === 'rejected'}
                      className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Schedule Interview Modal */}
        {showInterviewModal && selectedApplication && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Schedule Interview</h3>
                <button
                  onClick={() => {
                    setShowInterviewModal(false);
                    resetInterview();
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              <form onSubmit={handleSubmitInterview(onSubmitInterview)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Interview Type *</label>
                  <select
                    {...registerInterview('type', { required: 'Interview type is required' })}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="">Select type</option>
                    <option value="phone">Phone Interview</option>
                    <option value="video">Video Interview</option>
                    <option value="onsite">On-site Interview</option>
                    <option value="technical">Technical Interview</option>
                    <option value="behavioral">Behavioral Interview</option>
                  </select>
                  {interviewErrors.type && (
                    <p className="text-red-500 text-xs mt-1">{interviewErrors.type.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Date *</label>
                  <input
                    type="date"
                    {...registerInterview('date', { required: 'Date is required' })}
                    className="w-full border rounded px-3 py-2"
                    min={new Date().toISOString().split('T')[0]}
                  />
                  {interviewErrors.date && (
                    <p className="text-red-500 text-xs mt-1">{interviewErrors.date.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Time *</label>
                  <input
                    type="time"
                    {...registerInterview('time', { required: 'Time is required' })}
                    className="w-full border rounded px-3 py-2"
                  />
                  {interviewErrors.time && (
                    <p className="text-red-500 text-xs mt-1">{interviewErrors.time.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Duration (minutes) *</label>
                  <input
                    type="number"
                    {...registerInterview('duration', { 
                      required: 'Duration is required',
                      min: { value: 15, message: 'Minimum 15 minutes' },
                      max: { value: 480, message: 'Maximum 480 minutes' }
                    })}
                    className="w-full border rounded px-3 py-2"
                    placeholder="e.g., 30"
                  />
                  {interviewErrors.duration && (
                    <p className="text-red-500 text-xs mt-1">{interviewErrors.duration.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Mode *</label>
                  <select
                    {...registerInterview('mode', { required: 'Mode is required' })}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="">Select mode</option>
                    <option value="Online">Online</option>
                    <option value="Offline">Offline</option>
                  </select>
                  {interviewErrors.mode && (
                    <p className="text-red-500 text-xs mt-1">{interviewErrors.mode.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Location/Meeting Link *</label>
                  <input
                    type="text"
                    {...registerInterview('location', { required: 'Location or meeting link is required' })}
                    className="w-full border rounded px-3 py-2"
                    placeholder="Physical address or video call link (e.g., https://meet.google.com/xxx-yyyy-zzz)"
                  />
                  {interviewErrors.location && (
                    <p className="text-red-500 text-xs mt-1">{interviewErrors.location.message}</p>
                  )}
                </div>

                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={interviewLoading}
                    className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {interviewLoading ? 'Scheduling...' : 'Schedule Interview'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowInterviewModal(false);
                      resetInterview();
                    }}
                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecruiterApplications;

