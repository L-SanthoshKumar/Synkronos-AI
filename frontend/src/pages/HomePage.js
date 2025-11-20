import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import api from '../api';

const HomePage = () => {
  const { currentUser, fetchJobs } = useApp();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [filters, setFilters] = useState({
    jobTitle: '',
    location: '',
    workType: '',
  });

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    setLoading(true);
    const data = await fetchJobs();
    setJobs(data);
    setLoading(false);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setIsSearchActive(true);
    const data = await fetchJobs(filters);
    setJobs(data);
    setLoading(false);
  };

  const handleApplyClick = (jobId) => {
    if (!currentUser) {
      navigate('/login', { state: { from: `/apply/${jobId}` } });
      return;
    }
    if (currentUser.role !== 'jobseeker') {
      alert('Only job seekers can apply to jobs.');
      return;
    }
    navigate(`/apply/${jobId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-5xl font-bold mb-4">Find Your Dream Job with Synkronos AI</h1>
            <p className="text-xl mb-8 text-blue-100">
              AI-powered job matching platform connecting talented professionals with top companies
            </p>
            
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="bg-white rounded-lg shadow-lg p-4 flex flex-col md:flex-row gap-3">
              <input
                type="text"
                placeholder="Job title, keywords..."
                value={filters.jobTitle}
                onChange={(e) => setFilters({ ...filters, jobTitle: e.target.value })}
                className="flex-1 px-4 py-2 rounded border text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <input
                type="text"
                placeholder="Location"
                value={filters.location}
                onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                className="flex-1 px-4 py-2 rounded border text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <select
                value={filters.workType}
                onChange={(e) => setFilters({ ...filters, workType: e.target.value })}
                className="px-4 py-2 rounded border text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="">All Work Types</option>
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
                <option value="onsite">On-site</option>
              </select>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-medium transition text-sm whitespace-nowrap"
              >
                Search Jobs
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Synkronos AI?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">AI-Powered Matching</h3>
              <p className="text-gray-600">Get personalized job recommendations based on your skills and experience</p>
            </div>
            <div className="text-center p-6">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Resume Analysis</h3>
              <p className="text-gray-600">Upload your resume and let AI find the perfect jobs for you</p>
            </div>
            <div className="text-center p-6">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Easy Application</h3>
              <p className="text-gray-600">Apply to multiple jobs with just a few clicks</p>
            </div>
          </div>
        </div>
      </section>

      {/* Jobs Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">Latest Job Opportunities</h2>
            {currentUser && currentUser.role === 'jobseeker' && (
              <Link
                to="/seeker/resume-search"
                className="text-blue-600 hover:text-blue-800 font-semibold"
              >
                Resume-Based Search →
              </Link>
            )}
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading jobs...</p>
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <p className="text-gray-600 text-lg">
                {isSearchActive 
                  ? 'No jobs found matching your search criteria. Try adjusting your filters.' 
                  : 'No jobs available at the moment. Please check back later.'}
              </p>
              {isSearchActive && (
                <button
                  onClick={() => {
                    setFilters({ jobTitle: '', location: '', workType: '' });
                    setIsSearchActive(false);
                    loadJobs();
                  }}
                  className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
                >
                  Clear filters and show all jobs
                </button>
              )}
            </div>
          ) : (
            <>
              {isSearchActive && (
                <div className="mb-4 flex justify-between items-center bg-blue-50 p-4 rounded-lg">
                  <p className="text-blue-800 font-medium">
                    Showing {jobs.length} job{jobs.length !== 1 ? 's' : ''} matching your search
                  </p>
                  <button
                    onClick={() => {
                      setFilters({ jobTitle: '', location: '', workType: '' });
                      setIsSearchActive(false);
                      loadJobs();
                    }}
                    className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                  >
                    Clear filters
                  </button>
                </div>
              )}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {jobs.map((job) => (
                <div key={job._id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-blue-600 mb-2">{job.title}</h3>
                      <p className="text-lg font-medium text-gray-700 mb-1">{job.company?.name}</p>
                      <p className="text-sm text-gray-500 mb-3">
                        {job.location?.city}, {job.location?.country} • {job.workType} • {job.jobType}
                      </p>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {job.summary || job.description?.substring(0, 150)}...
                  </p>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {job.requirements?.skills?.slice(0, 3).map((skill, index) => (
                      <span
                        key={index}
                        className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                      >
                        {skill}
                      </span>
                    ))}
                    {job.requirements?.skills?.length > 3 && (
                      <span className="text-gray-500 text-xs">+{job.requirements.skills.length - 3} more</span>
                    )}
                  </div>
                  
                  <div className="flex justify-between items-center pt-4 border-t">
                    <span className="text-xs text-gray-500">
                      Posted {new Date(job.createdAt).toLocaleDateString()}
                    </span>
                    {currentUser && currentUser.role === 'jobseeker' ? (
                      <button
                        onClick={() => handleApplyClick(job._id)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-medium transition"
                      >
                        Apply Now
                      </button>
                    ) : !currentUser ? (
                      <Link
                        to="/login"
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition"
                      >
                        Login to Apply
                      </Link>
                    ) : (
                      <Link
                        to={`/job/${job._id}`}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        View Details →
                      </Link>
                    )}
                  </div>
                </div>
              ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* CTA Section */}
      {!currentUser && (
        <section className="py-16 bg-blue-600 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-xl mb-8 text-blue-100">
              Join thousands of job seekers and recruiters on Synkronos AI
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                to="/register"
                className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
              >
                Sign Up as Job Seeker
              </Link>
              <Link
                to="/register"
                className="bg-blue-800 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-900 transition border-2 border-white"
              >
                Sign Up as Recruiter
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default HomePage;

