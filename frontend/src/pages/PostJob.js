import React from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import api from '../api';

const PostJob = () => {
  const { addJob, fetchRecruiterJobs, fetchJobs } = useApp();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors }, setError } = useForm();

  const onSubmitJob = async (data) => {
    try {
      const jobData = {
        title: data.title,
        summary: data.summary || data.description.substring(0, 200), // Use summary or first 200 chars of description
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
          currency: data.currency || 'USD',
          period: data.salaryPeriod || 'yearly'
        },
        requirements: {
          skills: data.skills.split(',').map(s => s.trim().toLowerCase())
        },
        applicationDeadline: data.applicationDeadline ? new Date(data.applicationDeadline).toISOString() : null,
        contact: {
          email: data.contactEmail
        }
      };

      const res = await api.post('/jobs', jobData);

      if (res.data.success) {
        addJob(res.data.data);
        // Refresh both recruiter jobs and public jobs
        await Promise.all([
          fetchRecruiterJobs(),
          fetchJobs()
        ]);
        alert('Job posted successfully!');
        navigate('/recruiter/home');
      }
    } catch (err) {
      console.error('Error posting job:', err);
      let errorMessage = 'Failed to post job. Please check all required fields and try again.';
      
      if (err.response?.data) {
        if (err.response.data.message) {
          errorMessage = err.response.data.message;
        } else if (err.response.data.errors && Array.isArray(err.response.data.errors)) {
          errorMessage = err.response.data.errors.map(e => e.msg || e.message || JSON.stringify(e)).join(', ');
        }
      }
      setError('api', { message: errorMessage });
      alert(errorMessage);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Post a New Job</h1>
          <p className="text-gray-600">Create a new job listing to attract top talent</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <form onSubmit={handleSubmit(onSubmitJob)} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-1">Job Title *</label>
                <input
                  type="text"
                  {...register('title', { required: 'Job title is required' })}
                  className="w-full border rounded px-3 py-2"
                  placeholder="e.g., Senior Software Engineer"
                />
                {errors.title && <span className="text-red-500 text-sm">{errors.title.message}</span>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Job Type *</label>
                <select
                  {...register('jobType', { required: 'Job type is required' })}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">Select Job Type</option>
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
                  {...register('level', { required: 'Job level is required' })}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">Select Level</option>
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
                  {...register('workType', { required: 'Work type is required' })}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">Select Work Type</option>
                  <option value="onsite">On-site</option>
                  <option value="remote">Remote</option>
                  <option value="hybrid">Hybrid</option>
                </select>
                {errors.workType && <span className="text-red-500 text-sm">{errors.workType.message}</span>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Job Summary *</label>
              <textarea
                {...register('summary', { required: 'Job summary is required', minLength: { value: 20, message: 'Summary must be at least 20 characters' } })}
                className="w-full border rounded px-3 py-2"
                rows="3"
                placeholder="Brief summary of the job (20+ characters)..."
              />
              {errors.summary && <span className="text-red-500 text-sm">{errors.summary.message}</span>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Job Description *</label>
              <textarea
                {...register('description', { required: 'Job description is required', minLength: { value: 50, message: 'Description must be at least 50 characters' } })}
                className="w-full border rounded px-3 py-2"
                rows="6"
                placeholder="Detailed job description (50+ characters)..."
              />
              {errors.description && <span className="text-red-500 text-sm">{errors.description.message}</span>}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-1">Company Name *</label>
                <input
                  type="text"
                  {...register('companyName', { required: 'Company name is required' })}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Company name"
                />
                {errors.companyName && <span className="text-red-500 text-sm">{errors.companyName.message}</span>}
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium mb-1">City *</label>
                <input
                  type="text"
                  {...register('city', { required: 'City is required' })}
                  className="w-full border rounded px-3 py-2"
                  placeholder="City"
                />
                {errors.city && <span className="text-red-500 text-sm">{errors.city.message}</span>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">State/Province</label>
                <input
                  type="text"
                  {...register('state')}
                  className="w-full border rounded px-3 py-2"
                  placeholder="State"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Country *</label>
                <input
                  type="text"
                  {...register('country', { required: 'Country is required' })}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Country"
                />
                {errors.country && <span className="text-red-500 text-sm">{errors.country.message}</span>}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-1">Minimum Salary *</label>
                <input
                  type="number"
                  {...register('salaryMin', { required: 'Minimum salary is required' })}
                  className="w-full border rounded px-3 py-2"
                  placeholder="50000"
                />
                {errors.salaryMin && <span className="text-red-500 text-sm">{errors.salaryMin.message}</span>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Maximum Salary *</label>
                <input
                  type="number"
                  {...register('salaryMax', { required: 'Maximum salary is required' })}
                  className="w-full border rounded px-3 py-2"
                  placeholder="80000"
                />
                {errors.salaryMax && <span className="text-red-500 text-sm">{errors.salaryMax.message}</span>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Currency</label>
                <select
                  {...register('currency')}
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
                  {...register('salaryPeriod')}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="yearly">Yearly</option>
                  <option value="monthly">Monthly</option>
                  <option value="hourly">Hourly</option>
                </select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-1">Required Skills *</label>
                <input
                  type="text"
                  {...register('skills', { required: 'Skills are required' })}
                  className="w-full border rounded px-3 py-2"
                  placeholder="javascript, react, node.js (comma separated)"
                />
                {errors.skills && <span className="text-red-500 text-sm">{errors.skills.message}</span>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Application Deadline</label>
                <input
                  type="date"
                  {...register('applicationDeadline')}
                  className="w-full border rounded px-3 py-2"
                  min={new Date().toISOString().split('T')[0]}
                />
                <p className="text-xs text-gray-500 mt-1">Leave empty if no deadline</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Contact Email *</label>
              <input
                type="email"
                {...register('contactEmail', { required: 'Contact email is required' })}
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
                onClick={() => navigate('/recruiter/home')}
                className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PostJob;

