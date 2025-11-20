import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";

const Apply = () => {
  const { jobId } = useParams();
  const { register, handleSubmit, formState: { errors }, setError } = useForm();
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [job, setJob] = useState(null);
  const [jobLoading, setJobLoading] = useState(true);
  const navigate = useNavigate();
  const { addApplication, fetchApplications } = useApp();

  useEffect(() => {
    fetchJobDetails();
  }, [jobId]);

  const fetchJobDetails = async () => {
    try {
      const res = await axios.get(process.env.REACT_APP_API_URL + `/jobs/${jobId}`);
      setJob(res.data.data);
    } catch (err) {
      console.error("Error fetching job details:", err);
    }
    setJobLoading(false);
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("resume", data.resume[0]);
      formData.append("firstName", data.firstName);
      formData.append("lastName", data.lastName);
      formData.append("email", data.email);
      formData.append("phone", data.phone);
      
      // Structured qualifications
      formData.append("degree", data.degree);
      formData.append("major", data.major);
      formData.append("college", data.college);
      formData.append("cgpa", data.cgpa);
      formData.append("graduationYear", data.graduationYear);
      
      // Optional experience
      if (data.experience) {
        formData.append("experience", data.experience);
      }
      
      formData.append("skills", data.skills);
      
      const token = localStorage.getItem("token");
      const res = await axios.post(
        process.env.REACT_APP_API_URL + `/applications/${jobId}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data", Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        // Add application to context
        addApplication(res.data.data);
        // Refresh applications list for job seeker
        await fetchApplications();
        setSuccess(true);
        // Navigate after a short delay to show success message
        setTimeout(() => {
          navigate("/seeker/applied");
        }, 2000);
      }
    } catch (err) {
      console.error("Error submitting application:", err);
      console.error("Error response:", err.response?.data);
      
      let errorMessage = "Application failed. Please try again.";
      
      if (err.response?.data) {
        // Use the message from backend if available
        if (err.response.data.message) {
          errorMessage = err.response.data.message;
        }
        // If there are validation errors, show them
        if (err.response.data.errors && Array.isArray(err.response.data.errors)) {
          const validationErrors = err.response.data.errors
            .map(e => e.msg || e.message || `${e.param || e.field}: ${e.msg || e.message}`)
            .join(', ');
          if (validationErrors) {
            errorMessage = `Validation errors: ${validationErrors}`;
          }
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError("api", { message: errorMessage });
      alert(errorMessage); // Show alert for better visibility
    }
    setLoading(false);
  };

  if (jobLoading) {
    return <div className="text-center py-8">Loading job details...</div>;
  }

  if (!job) {
    return <div className="text-center py-8">Job not found.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Apply for Job</h2>
      
      {/* Job Details */}
      <div className="bg-white rounded shadow p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Job Details</h3>
        <div className="space-y-2">
          <p><strong>Position:</strong> {job.title}</p>
          <p><strong>Company:</strong> {job.company?.name}</p>
          <p><strong>Location:</strong> {job.location?.city}, {job.location?.country}</p>
          <p><strong>Type:</strong> {job.jobType} • {job.workType}</p>
          <p><strong>Level:</strong> {job.level}</p>
        </div>
      </div>

      {success ? (
        <div className="bg-green-50 border border-green-200 rounded p-6 text-center">
          <h3 className="text-green-800 font-semibold mb-2">Application Submitted Successfully!</h3>
          <p className="text-green-700">You will be redirected to job listings in a few seconds...</p>
        </div>
      ) : (
        <div className="bg-white rounded shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Application Form</h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">First Name *</label>
                <input
                  type="text"
                  {...register("firstName", { required: "First name is required" })}
                  className="w-full border rounded px-3 py-2"
                />
                {errors.firstName && <span className="text-red-500 text-sm">{errors.firstName.message}</span>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Last Name *</label>
                <input
                  type="text"
                  {...register("lastName", { required: "Last name is required" })}
                  className="w-full border rounded px-3 py-2"
                />
                {errors.lastName && <span className="text-red-500 text-sm">{errors.lastName.message}</span>}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Email *</label>
                <input
                  type="email"
                  {...register("email", { 
                    required: "Email is required",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Invalid email address"
                    }
                  })}
                  className="w-full border rounded px-3 py-2"
                />
                {errors.email && <span className="text-red-500 text-sm">{errors.email.message}</span>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Phone *</label>
                <input
                  type="tel"
                  {...register("phone", { required: "Phone number is required" })}
                  className="w-full border rounded px-3 py-2"
                  placeholder="+1-555-123-4567"
                />
                {errors.phone && <span className="text-red-500 text-sm">{errors.phone.message}</span>}
              </div>
            </div>

            {/* Qualifications Section */}
            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-700 mb-3">Educational Qualifications</h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Degree *</label>
                  <select
                    {...register("degree", { required: "Degree is required" })}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="">Select Degree</option>
                    <option value="High School">High School</option>
                    <option value="Associate's">Associate's Degree</option>
                    <option value="Bachelor's">Bachelor's Degree</option>
                    <option value="Master's">Master's Degree</option>
                    <option value="PhD">PhD</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.degree && <span className="text-red-500 text-sm">{errors.degree.message}</span>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Major/Field of Study *</label>
                  <input
                    type="text"
                    {...register("major", { required: "Major is required" })}
                    className="w-full border rounded px-3 py-2"
                    placeholder="e.g., Computer Science, Engineering"
                  />
                  {errors.major && <span className="text-red-500 text-sm">{errors.major.message}</span>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">College/University *</label>
                  <input
                    type="text"
                    {...register("college", { required: "College/University is required" })}
                    className="w-full border rounded px-3 py-2"
                    placeholder="University name"
                  />
                  {errors.college && <span className="text-red-500 text-sm">{errors.college.message}</span>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">CGPA/GPA</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="4"
                    {...register("cgpa")}
                    className="w-full border rounded px-3 py-2"
                    placeholder="3.5"
                  />
                  <p className="text-xs text-gray-500 mt-1">Scale: 0-4.0 (optional)</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Graduation Year *</label>
                  <input
                    type="number"
                    min="1990"
                    max="2030"
                    {...register("graduationYear", { required: "Graduation year is required" })}
                    className="w-full border rounded px-3 py-2"
                    placeholder="2023"
                  />
                  {errors.graduationYear && <span className="text-red-500 text-sm">{errors.graduationYear.message}</span>}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Experience (Optional)</label>
              <textarea
                {...register("experience")}
                className="w-full border rounded px-3 py-2"
                rows="4"
                placeholder="Describe your relevant work experience, projects, and achievements (optional)..."
              />
              <p className="text-xs text-gray-500 mt-1">This field is optional. You can leave it blank if you're a fresh graduate.</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Skills *</label>
              <textarea
                {...register("skills", { required: "Skills are required" })}
                className="w-full border rounded px-3 py-2"
                rows="2"
                placeholder="List your technical skills, programming languages, tools, etc. (comma separated)"
              />
              {errors.skills && <span className="text-red-500 text-sm">{errors.skills.message}</span>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Resume (PDF) *</label>
              <input
                type="file"
                accept=".pdf"
                {...register("resume", { required: "Resume is required" })}
                className="w-full border rounded px-3 py-2"
              />
              {errors.resume && <span className="text-red-500 text-sm">{errors.resume.message}</span>}
              <p className="text-xs text-gray-500 mt-1">Upload your resume in PDF format</p>
            </div>

            {errors.api && <div className="text-red-500 text-sm">{errors.api.message}</div>}

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? "Submitting..." : "Submit Application"}
              </button>
              <button
                type="button"
                onClick={() => navigate("/jobs")}
                className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Apply; 