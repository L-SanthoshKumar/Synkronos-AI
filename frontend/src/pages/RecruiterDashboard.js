import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";

const RecruiterDashboard = () => {
  const [activeTab, setActiveTab] = useState('applications');
  const [showJobForm, setShowJobForm] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(false);
  const [responseLoading, setResponseLoading] = useState(false);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const { register, handleSubmit, formState: { errors }, setError } = useForm();

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const token = localStorage.getItem("token");
      const [jobsRes, applicationsRes] = await Promise.all([
        axios.get(process.env.REACT_APP_API_URL + "/jobs/my-jobs", {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(process.env.REACT_APP_API_URL + "/applications/my-applications", {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      setJobs(jobsRes.data.data || []);
      setApplications(applicationsRes.data.data || []);
    } catch (err) {
      console.error("Error fetching dashboard:", err);
    }
    setLoading(false);
  };

  const onSubmitJob = async (data) => {
    try {
      const token = localStorage.getItem("token");
      const jobData = {
        title: data.title,
        description: data.description,
        jobType: data.jobType,
        level: data.level,
        workType: data.workType,
        company: {
          name: data.companyName
        },
        location: {
          city: data.city,
          state: data.state,
          country: data.country
        },
        salary: {
          min: Number(data.salaryMin),
          max: Number(data.salaryMax),
          currency: data.currency,
          period: data.salaryPeriod
        },
        requirements: {
          skills: data.skills.split(",").map(s => s.trim().toLowerCase())
        },
        applicationDeadline: data.applicationDeadline,
        contact: {
          email: data.contactEmail
        }
      };

      const res = await axios.post(
        process.env.REACT_APP_API_URL + "/jobs",
        jobData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (res.data.success) {
        setShowJobForm(false);
        fetchDashboard();
        alert("Job posted successfully!");
      }
    } catch (err) {
      console.error("Error posting job:", err);
      setError("api", { message: err.response?.data?.message || "Failed to post job" });
    }
  };

  const handleViewApplication = async (applicationId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        process.env.REACT_APP_API_URL + `/applications/${applicationId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSelectedApplication(res.data.data);
      setShowApplicationModal(true);
    } catch (err) {
      console.error("Error fetching application details:", err);
    }
  };

  const handleUpdateStatus = async (applicationId, newStatus) => {
    setStatusLoading(true);
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        process.env.REACT_APP_API_URL + `/applications/${applicationId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchDashboard();
    } catch (err) {
      console.error("Error updating status:", err);
    }
    setStatusLoading(false);
  };

  const onSubmitResponse = async (data) => {
    setResponseLoading(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        process.env.REACT_APP_API_URL + `/applications/${selectedApplication._id}/respond`,
        {
          subject: data.subject,
          message: data.message,
          responseType: data.responseType
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowResponseModal(false);
      fetchDashboard();
      alert("Response sent successfully!");
    } catch (err) {
      console.error("Error sending response:", err);
      setError("api", { message: err.response?.data?.message || "Failed to send response" });
    }
    setResponseLoading(false);
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
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Recruiter Dashboard</h2>
        <button
          onClick={() => setShowJobForm(!showJobForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {showJobForm ? "Cancel" : "Post New Job"}
        </button>
      </div>

      {/* Job Creation Form */}
      {showJobForm && (
        <div className="bg-white rounded shadow p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Create New Job</h3>
          <form onSubmit={handleSubmit(onSubmitJob)} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Basic Job Information */}
              <div>
                <label className="block text-sm font-medium mb-1">Job Title *</label>
                <input
                  type="text"
                  {...register("title", { required: "Job title is required" })}
                  className="w-full border rounded px-3 py-2"
                  placeholder="e.g., Senior Software Engineer"
                />
                {errors.title && <span className="text-red-500 text-sm">{errors.title.message}</span>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Job Type *</label>
                <select
                  {...register("jobType", { required: "Job type is required" })}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="contract">Contract</option>
                  <option value="internship">Internship</option>
                  <option value="freelance">Freelance</option>
                </select>
                {errors.jobType && <span className="text-red-500 text-sm">{errors.jobType.message}</span>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Job Level *</label>
                <select
                  {...register("level", { required: "Job level is required" })}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="entry">Entry Level</option>
                  <option value="mid">Mid Level</option>
                  <option value="senior">Senior Level</option>
                  <option value="lead">Lead</option>
                  <option value="executive">Executive</option>
                </select>
                {errors.level && <span className="text-red-500 text-sm">{errors.level.message}</span>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Work Type *</label>
                <select
                  {...register("workType", { required: "Work type is required" })}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="onsite">On-site</option>
                  <option value="remote">Remote</option>
                  <option value="hybrid">Hybrid</option>
                </select>
                {errors.workType && <span className="text-red-500 text-sm">{errors.workType.message}</span>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Job Description *</label>
              <textarea
                {...register("description", { required: "Job description is required" })}
                className="w-full border rounded px-3 py-2"
                rows="6"
                placeholder="Detailed job description..."
              />
              {errors.description && <span className="text-red-500 text-sm">{errors.description.message}</span>}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {/* Company Information */}
              <div>
                <label className="block text-sm font-medium mb-1">Company Name *</label>
                <input
                  type="text"
                  {...register("companyName", { required: "Company name is required" })}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Company name"
                />
                {errors.companyName && <span className="text-red-500 text-sm">{errors.companyName.message}</span>}
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {/* Location */}
              <div>
                <label className="block text-sm font-medium mb-1">City *</label>
                <input
                  type="text"
                  {...register("city", { required: "City is required" })}
                  className="w-full border rounded px-3 py-2"
                  placeholder="City"
                />
                {errors.city && <span className="text-red-500 text-sm">{errors.city.message}</span>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">State/Province</label>
                <input
                  type="text"
                  {...register("state")}
                  className="w-full border rounded px-3 py-2"
                  placeholder="State"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Country *</label>
                <input
                  type="text"
                  {...register("country", { required: "Country is required" })}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Country"
                />
                {errors.country && <span className="text-red-500 text-sm">{errors.country.message}</span>}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {/* Salary */}
              <div>
                <label className="block text-sm font-medium mb-1">Minimum Salary *</label>
                <input
                  type="number"
                  {...register("salaryMin", { required: "Minimum salary is required" })}
                  className="w-full border rounded px-3 py-2"
                  placeholder="50000"
                />
                {errors.salaryMin && <span className="text-red-500 text-sm">{errors.salaryMin.message}</span>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Maximum Salary *</label>
                <input
                  type="number"
                  {...register("salaryMax", { required: "Maximum salary is required" })}
                  className="w-full border rounded px-3 py-2"
                  placeholder="80000"
                />
                {errors.salaryMax && <span className="text-red-500 text-sm">{errors.salaryMax.message}</span>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Currency</label>
                <select
                  {...register("currency")}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="CAD">CAD</option>
                  <option value="AUD">AUD</option>
                  <option value="INR">INR</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Salary Period</label>
                <select
                  {...register("salaryPeriod")}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="yearly">Yearly</option>
                  <option value="monthly">Monthly</option>
                  <option value="hourly">Hourly</option>
                </select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {/* Requirements */}
              <div>
                <label className="block text-sm font-medium mb-1">Required Skills *</label>
                <input
                  type="text"
                  {...register("skills", { required: "Skills are required" })}
                  className="w-full border rounded px-3 py-2"
                  placeholder="javascript, react, node.js (comma separated)"
                />
                {errors.skills && <span className="text-red-500 text-sm">{errors.skills.message}</span>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Application Deadline</label>
                <input
                  type="date"
                  {...register("applicationDeadline")}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
            </div>

            {/* Contact Email */}
            <div>
              <label className="block text-sm font-medium mb-1">Contact Email *</label>
              <input
                type="email"
                {...register("contactEmail", { required: "Contact email is required" })}
                className="w-full border rounded px-3 py-2"
                placeholder="Contact email"
              />
              {errors.contactEmail && <span className="text-red-500 text-sm">{errors.contactEmail.message}</span>}
            </div>

            {errors.api && <div className="text-red-500 text-sm">{errors.api.message}</div>}

            <div className="flex gap-4">
              <button
                type="submit"
                className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
              >
                Post Job
              </button>
              <button
                type="button"
                onClick={() => setShowJobForm(false)}
                className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="bg-white rounded shadow mb-6">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('applications')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'applications'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Applications ({applications.length})
          </button>
        </div>
      </div>

      {/* Content based on active tab */}
      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <div>
          {activeTab === 'applications' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Job Applications</h3>
              {applications.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No applications yet.</p>
                  <p className="text-sm mt-2">Applications will appear here once job seekers apply to your jobs.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {applications.map((app) => (
                    <div key={app._id} className="bg-white rounded shadow p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-semibold">
                            {app.applicantInfo?.firstName || app.applicant?.firstName} {app.applicantInfo?.lastName || app.applicant?.lastName}
                          </div>
                          <div className="text-sm text-gray-500">Applied for: {app.job?.title}</div>
                          <div className="text-xs text-gray-400">
                            Applied: {new Date(app.appliedAt || app.createdAt).toLocaleDateString()}
                          </div>
                          {app.applicantInfo?.email && (
                            <div className="text-xs text-gray-500">Email: {app.applicantInfo.email}</div>
                          )}
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(app.status)}`}>
                          {app.status}
                        </span>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => handleViewApplication(app._id)}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => {
                            setSelectedApplication(app);
                            setShowResponseModal(true);
                          }}
                          className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                        >
                          Respond
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
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
                <div className="bg-gray-50 p-3 rounded">
                  <div><strong>Name:</strong> {selectedApplication.applicantInfo?.firstName || selectedApplication.applicant?.firstName} {selectedApplication.applicantInfo?.lastName || selectedApplication.applicant?.lastName}</div>
                  <div><strong>Email:</strong> {selectedApplication.applicantInfo?.email || selectedApplication.applicant?.email}</div>
                  <div><strong>Phone:</strong> {selectedApplication.applicantInfo?.phone || selectedApplication.applicant?.phone || 'Not provided'}</div>
                  
                  {/* Qualifications */}
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
                  
                  {/* Experience */}
                  {selectedApplication.applicantInfo?.experience && (
                    <div className="mt-3">
                      <strong>Experience:</strong>
                      <p className="text-sm mt-1 ml-4">{selectedApplication.applicantInfo.experience}</p>
                    </div>
                  )}
                  
                  {/* Skills */}
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
                <div className="bg-gray-50 p-3 rounded">
                  <div><strong>Position:</strong> {selectedApplication.job?.title}</div>
                  <div><strong>Company:</strong> {selectedApplication.job?.company?.name}</div>
                  <div><strong>Location:</strong> {selectedApplication.job?.location?.city}, {selectedApplication.job?.location?.country}</div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-700">Resume</h4>
                <div className="bg-gray-50 p-3 rounded">
                  <div><strong>File:</strong> {selectedApplication.resume?.filename}</div>
                  <div><strong>Uploaded:</strong> {new Date(selectedApplication.resume?.uploadedAt).toLocaleDateString()}</div>
                  <a
                    href={process.env.REACT_APP_API_URL.replace(/\/api$/, "") + "/" + selectedApplication.resume?.path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    View Resume
                  </a>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-700">Status Management</h4>
                <div className="flex gap-2 flex-wrap">
                  {['pending', 'reviewing', 'shortlisted', 'interviewed', 'offered', 'hired', 'rejected'].map((status) => (
                    <button
                      key={status}
                      onClick={() => handleUpdateStatus(selectedApplication._id, status)}
                      disabled={statusLoading || selectedApplication.status === status}
                      className={`px-3 py-1 rounded text-sm ${
                        selectedApplication.status === status
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      } disabled:opacity-50`}
                    >
                      {statusLoading ? "Updating..." : status}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Response Modal */}
      {showResponseModal && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Send Response</h3>
              <button
                onClick={() => setShowResponseModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmitResponse)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Response Type *</label>
                <select
                  {...register("responseType", { required: "Response type is required" })}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="forward">Forward to Next Stage</option>
                  <option value="reject">Reject Application</option>
                  <option value="interview">Schedule Interview</option>
                  <option value="offer">Make Offer</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Subject *</label>
                <input
                  type="text"
                  {...register("subject", { required: "Subject is required" })}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Application Update"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Message *</label>
                <textarea
                  {...register("message", { required: "Message is required" })}
                  className="w-full border rounded px-3 py-2"
                  rows="6"
                  placeholder="Dear [Applicant Name],&#10;&#10;Thank you for your application for the [Position] role at [Company].&#10;&#10;[Your message here]&#10;&#10;Best regards,&#10;[Your Name]"
                />
              </div>

              {errors.api && <div className="text-red-500 text-sm">{errors.api.message}</div>}

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={responseLoading}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                >
                  {responseLoading ? "Sending..." : "Send Response"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowResponseModal(false)}
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
  );
};

export default RecruiterDashboard; 