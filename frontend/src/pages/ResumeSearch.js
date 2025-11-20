import React, { useState, useCallback } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FiUpload, FiFileText, FiX, FiDownload, FiAlertCircle } from 'react-icons/fi';

const ResumeSearch = () => {
  const navigate = useNavigate();
  const [resume, setResume] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [resumeAnalysis, setResumeAnalysis] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const ACCEPTED_FILE_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

  const validateFile = (file) => {
    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      toast.error('Please upload a valid file (PDF, DOC, or DOCX)');
      return false;
    }
    
    if (file.size > MAX_FILE_SIZE) {
      toast.error('File size should be less than 5MB');
      return false;
    }
    
    return true;
  };

  const handleResumeUpload = useCallback(async (file) => {
    if (!file || !validateFile(file)) return;
    if (!file || !validateFile(file)) return;

    setUploading(true);
    setError("");
    setUploadProgress(0);
    
    try {
      const formData = new FormData();
      formData.append("resume", file);

      const res = await axios.post(
        `${process.env.REACT_APP_ML_API_URL}/ml/match`,
        formData,
        {
          headers: { 
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          onUploadProgress: (progressEvent) => {
            const progress = Math.round(
              (progressEvent.loaded * 100) / (progressEvent.total || 1)
            );
            setUploadProgress(progress);
          },
        }
      );

      if (res.data.success) {
        setRecommendations(res.data.recommendations || []);
        setResumeAnalysis(res.data.resume_analysis || null);
        setResume(file);
        toast.success('Resume analyzed successfully!');
      } else {
        setError(res.data.message || "Failed to analyze resume");
        toast.error(res.data.message || 'Failed to analyze resume');
      }
    } catch (err) {
      console.error("Error analyzing resume:", err);
      const errorMsg = err.response?.data?.message || "Failed to analyze resume. Please try again.";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) handleResumeUpload(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleResumeUpload(file);
  };

  const removeFile = () => {
    setResume(null);
    setResumeAnalysis(null);
    setRecommendations([]);
    setError('');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <button 
          onClick={() => navigate("/seeker/home")} 
          className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </button>
      </div>
      
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Resume-Based Job Search</h1>
      <p className="text-gray-600 mb-8">Upload your resume to find the best matching jobs</p>
      
      {/* Resume Upload Card */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8 transition-all duration-200 hover:shadow-lg">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Upload Your Resume</h2>
          
          <div 
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <FiUpload className="w-6 h-6 text-blue-600" />
              </div>
              
              <div className="space-y-1 text-center">
                <p className="text-sm text-gray-600">
                  <label 
                    htmlFor="resume-upload" 
                    className="relative cursor-pointer text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Click to upload
                  </label>{' '}
                  or drag and drop
                </p>
                <p className="text-xs text-gray-500">
                  PDF, DOC, or DOCX (max. 5MB)
                </p>
              </div>
              
              <input
                id="resume-upload"
                name="resume-upload"
                type="file"
                className="sr-only"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                disabled={uploading}
              />
              
              {uploading && (
                <div className="w-full mt-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-md flex items-start">
              <FiAlertCircle className="flex-shrink-0 mr-2 mt-0.5" />
              {error}
            </div>
          )}
          
          {resume && (
            <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200 flex items-center justify-between">
              <div className="flex items-center">
                <FiFileText className="w-5 h-5 text-green-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{resume.name}</p>
                  <p className="text-xs text-gray-500">
                    {(resume.size / 1024).toFixed(1)} KB • {resume.type.split('/')[1].toUpperCase()}
                  </p>
                </div>
              </div>
              <div className="flex space-x-2">
                <a 
                  href={URL.createObjectURL(resume)} 
                  download={resume.name}
                  className="p-1.5 text-gray-500 hover:text-blue-600 rounded-full hover:bg-gray-100"
                  title="Download"
                >
                  <FiDownload className="w-4 h-4" />
                </a>
                <button 
                  onClick={removeFile}
                  className="p-1.5 text-gray-500 hover:text-red-600 rounded-full hover:bg-gray-100"
                  disabled={uploading}
                  title="Remove"
                >
                  <FiX className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Resume Analysis */}
      {resumeAnalysis && (
        <div className="bg-white rounded shadow p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Resume Analysis</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-700 mb-3">Skills Detected</h4>
              <div className="flex flex-wrap gap-2">
                {resumeAnalysis.skills && resumeAnalysis.skills.length > 0 ? (
                  resumeAnalysis.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No skills detected</p>
                )}
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-700 mb-3">Experience Level</h4>
              <div className="space-y-2">
                <p><strong>Level:</strong> {resumeAnalysis.experience_level}</p>
                <p><strong>Years:</strong> {resumeAnalysis.experience_years || 'Not specified'}</p>
              </div>
            </div>

            {resumeAnalysis.projects && resumeAnalysis.projects.length > 0 && (
              <div className="md:col-span-2">
                <h4 className="font-medium text-gray-700 mb-3">Projects Detected</h4>
                <div className="space-y-2">
                  {resumeAnalysis.projects.map((project, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded">
                      <p className="text-sm">{project}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Job Recommendations */}
      {recommendations.length > 0 && (
        <div className="bg-white rounded shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Recommended Jobs Based on Your Resume</h3>
          <div className="space-y-4">
            {recommendations.map((rec, index) => (
              <div key={index} className="border rounded p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-blue-600 text-lg">{rec.job.title}</h4>
                    <p className="text-gray-700 font-medium">{rec.job.company?.name}</p>
                    <p className="text-sm text-gray-500">
                      {rec.job.location?.city}, {rec.job.location?.country} • {rec.job.workType} • {rec.job.jobType}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-medium">
                      {Math.round(rec.similarity)}% Match
                    </span>
                  </div>
                </div>
                
                <p className="text-gray-600 mb-3">
                  {rec.job.summary || rec.job.description.substring(0, 200)}...
                </p>
                
                {/* Skill Match Details */}
                {rec.skill_match && (
                  <div className="mb-3">
                    <h5 className="font-medium text-gray-700 mb-2">Skill Match Analysis</h5>
                    <div className="grid md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <strong className="text-green-600">Matching Skills:</strong>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {rec.skill_match.matching_skills && rec.skill_match.matching_skills.length > 0 ? (
                            rec.skill_match.matching_skills.map((skill, skillIndex) => (
                              <span
                                key={skillIndex}
                                className="bg-green-100 text-green-800 text-xs px-1 py-0.5 rounded"
                              >
                                {skill}
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-500">None</span>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <strong className="text-blue-600">Project Skills:</strong>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {rec.skill_match.project_matching_skills && rec.skill_match.project_matching_skills.length > 0 ? (
                            rec.skill_match.project_matching_skills.map((skill, skillIndex) => (
                              <span
                                key={skillIndex}
                                className="bg-blue-100 text-blue-800 text-xs px-1 py-0.5 rounded"
                              >
                                {skill}
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-500">None</span>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <strong className="text-red-600">Missing Skills:</strong>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {rec.skill_match.missing_skills && rec.skill_match.missing_skills.length > 0 ? (
                            rec.skill_match.missing_skills.map((skill, skillIndex) => (
                              <span
                                key={skillIndex}
                                className="bg-red-100 text-red-800 text-xs px-1 py-0.5 rounded"
                              >
                                {skill}
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-500">None</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      <strong>Skill Match:</strong> {Math.round(rec.skill_match.match_percentage)}%
                    </p>
                  </div>
                )}
                
                {/* Experience Match */}
                {rec.experience_match && (
                  <div className="mb-3">
                    <h5 className="font-medium text-gray-700 mb-2">Experience Match</h5>
                    <div className="text-sm">
                      <p><strong>Job Level:</strong> {rec.experience_match.job_level}</p>
                      <p><strong>Your Level:</strong> {rec.experience_match.resume_level}</p>
                      <p><strong>Match:</strong> {Math.round(rec.experience_match.score * 100)}%</p>
                      <p className="text-gray-600 italic">{rec.experience_match.reason}</p>
                    </div>
                  </div>
                )}
                
                {/* Job Requirements */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {rec.job.requirements?.skills?.slice(0, 5).map((skill, skillIndex) => (
                    <span
                      key={skillIndex}
                      className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                    >
                      {skill}
                    </span>
                  ))}
                  {rec.job.requirements?.skills?.length > 5 && (
                    <span className="text-gray-500 text-xs">+{rec.job.requirements.skills.length - 5} more</span>
                  )}
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    <span>Posted {new Date(rec.job.createdAt).toLocaleDateString()}</span>
                    {rec.job.applicationDeadline && (
                      <span className="ml-4">
                        Deadline: {new Date(rec.job.applicationDeadline).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <Link
                    to={`/apply/${rec.job._id}`}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                  >
                    Apply Now
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!recommendations.length && !uploading && (
        <div className="bg-white rounded shadow p-6 text-center">
          <h3 className="text-lg font-semibold mb-4">Get Started</h3>
          <p className="text-gray-600 mb-4">
            Upload your resume to get personalized job recommendations based on your skills and experience.
          </p>
          <div className="text-sm text-gray-500">
            <p>✓ AI-powered job matching</p>
            <p>✓ Skills-based recommendations</p>
            <p>✓ Experience level matching</p>
            <p>✓ Project-based skill detection</p>
          </div>
        </div>
      )}
      <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} newestOnTop closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
    </div>
  );
};

export default ResumeSearch;