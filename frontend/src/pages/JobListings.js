import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useLocation, useNavigate } from "react-router-dom";

const JobListings = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [filters, setFilters] = useState({ 
    jobTitle: "", 
    companyName: "",
    q: ""
  });
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);

  // Check authentication status
  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    setIsAuthenticated(!!token);
    setUserRole(role);
  }, []);

  // Parse URL parameters on component mount
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const urlQuery = searchParams.get('q');
    
    if (urlQuery) {
      setFilters(prev => ({ ...prev, q: urlQuery }));
    }
  }, [location.search]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.jobTitle) params.jobTitle = filters.jobTitle;
      if (filters.companyName) params.companyName = filters.companyName;
      if (filters.q) params.q = filters.q;
      
      const res = await axios.get(process.env.REACT_APP_API_URL + "/jobs", { params });
      setJobs(res.data.data);
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setJobs([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchJobs();
    // eslint-disable-next-line
  }, []);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    fetchJobs();
  };

  const clearFilters = () => {
    setFilters({ 
      jobTitle: "", 
      companyName: "",
      q: ""
    });
  };

  const handleApplyClick = (jobId) => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/apply/${jobId}` } });
      return;
    }
    
    if (userRole !== 'jobseeker') {
      alert('Only job seekers can apply to jobs.');
      return;
    }
    
    navigate(`/apply/${jobId}`);
  };

  const handleResumeSearchClick = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/resume-search' } });
      return;
    }
    
    if (userRole !== 'jobseeker') {
      alert('Resume-based search is only available for job seekers.');
      return;
    }
    
    navigate('/resume-search');
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Job Listings</h2>
        {/* Remove Resume-Based Search button for jobseekers */}
      </div>
      
      {/* Authentication Notice */}
      {!isAuthenticated && (
        <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-6">
          <p className="text-blue-800">
            <strong>Note:</strong> You need to be logged in as a job seeker to apply to jobs or use resume-based search.
            <Link to="/login" className="text-blue-600 hover:text-blue-800 underline ml-2">
              Login here
            </Link>
          </p>
        </div>
      )}
      
      {/* Search Filters */}
      <div className="bg-white rounded shadow p-6 mb-6">
        <form onSubmit={handleFilterSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Job Title</label>
              <input
                type="text"
                name="jobTitle"
                value={filters.jobTitle}
                onChange={handleFilterChange}
                className="w-full border rounded px-3 py-2"
                placeholder="e.g., Software Engineer"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Company Name</label>
              <input
                type="text"
                name="companyName"
                value={filters.companyName}
                onChange={handleFilterChange}
                className="w-full border rounded px-3 py-2"
                placeholder="e.g., Google"
              />
            </div>
          </div>
          
          <div className="flex gap-4">
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
            >
              Search Jobs
            </button>
            <button
              type="button"
              onClick={clearFilters}
              className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
            >
              Clear Filters
            </button>
          </div>
        </form>
      </div>

      {/* Search Results Info */}
      {filters.q && (
        <div className="mb-4 p-3 bg-blue-50 rounded">
          <p className="text-blue-800">
            Showing results for: <strong>"{filters.q}"</strong>
            <button
              onClick={() => setFilters(prev => ({ ...prev, q: "" }))}
              className="ml-2 text-blue-600 hover:text-blue-800 underline"
            >
              Clear search
            </button>
          </p>
        </div>
      )}

      {/* Job Listings */}
      {loading ? (
        <div className="text-center py-8">Loading jobs...</div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {filters.q || filters.jobTitle || filters.companyName ? 
            "No jobs found matching your search criteria." :
            "No jobs found matching your criteria."
          }
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <div key={job._id} className="bg-white rounded shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-blue-600 mb-2">
                    {job.title}
                  </h3>
                  <p className="text-lg font-medium text-gray-700 mb-1">{job.company?.name}</p>
                  <p className="text-gray-600 mb-2">
                    {job.location?.city}, {job.location?.country} • {job.workType} • {job.jobType}
                  </p>
                  <p className="text-gray-600 mb-3">{job.summary || job.description.substring(0, 200)}...</p>
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    {job.requirements?.skills?.slice(0, 5).map((skill, index) => (
                      <span
                        key={index}
                        className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                      >
                        {skill}
                      </span>
                    ))}
                    {job.requirements?.skills?.length > 5 && (
                      <span className="text-gray-500 text-xs">+{job.requirements.skills.length - 5} more</span>
                    )}
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-500">
                    <span>Posted {new Date(job.createdAt).toLocaleDateString()}</span>
                    {job.applicationDeadline && (
                      <span className="ml-4">
                        Deadline: {new Date(job.applicationDeadline).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="text-right">
                  {isAuthenticated && userRole === 'jobseeker' ? (
                    <button
                      onClick={() => handleApplyClick(job._id)}
                      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                    >
                      Apply Now
                    </button>
                  ) : !isAuthenticated ? (
                    <button
                      onClick={() => handleApplyClick(job._id)}
                      className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                    >
                      Login to Apply
                    </button>
                  ) : (
                    <span className="text-gray-500 text-sm">Recruiters cannot apply</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default JobListings; 