import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const RecruiterHome = () => {
  const { currentUser, recruiterJobs, applications, fetchRecruiterJobs, fetchApplications } = useApp();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([
      fetchRecruiterJobs(),
      fetchApplications()
    ]);
    setLoading(false);
  };

  const myJobs = recruiterJobs;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Welcome back, {currentUser?.firstName}!
          </h1>
          <p className="text-gray-600">Manage your job postings and applications</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Total Jobs Posted</p>
                <p className="text-3xl font-bold text-blue-600">{myJobs.length}</p>
              </div>
              <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Total Applications</p>
                <p className="text-3xl font-bold text-green-600">{applications.length}</p>
              </div>
              <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Pending Reviews</p>
                <p className="text-3xl font-bold text-yellow-600">
                  {applications.filter(app => app.status === 'pending').length}
                </p>
              </div>
              <div className="bg-yellow-100 w-12 h-12 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Link
            to="/recruiter/post-job"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
          >
            <div className="flex items-center mb-4">
              <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold">Post a New Job</h3>
            </div>
            <p className="text-gray-600 text-sm">Create a new job listing to attract top talent</p>
          </Link>

          <Link
            to="/recruiter/applications"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
          >
            <div className="flex items-center mb-4">
              <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold">View Applications</h3>
            </div>
            <p className="text-gray-600 text-sm">Review and manage job applications</p>
          </Link>
        </div>

        {/* Recent Jobs */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">My Job Postings</h2>
            <Link
              to="/recruiter/post-job"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Post New Job →
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : myJobs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>You haven't posted any jobs yet.</p>
              <Link
                to="/recruiter/post-job"
                className="text-blue-600 hover:text-blue-800 font-medium mt-2 inline-block"
              >
                Post your first job →
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {myJobs.slice(0, 5).map((job) => (
                <div key={job._id} className="border rounded-lg p-4 hover:bg-gray-50 transition">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-blue-600 mb-1">{job.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {job.company?.name} • {job.location?.city}, {job.location?.country}
                      </p>
                      <p className="text-xs text-gray-500">
                        Posted {new Date(job.createdAt).toLocaleDateString()} • 
                        {applications.filter(app => app.job?._id === job._id).length} applications
                      </p>
                    </div>
                    <Link
                      to={`/job/${job._id}`}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecruiterHome;

