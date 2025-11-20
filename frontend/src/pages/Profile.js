import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(process.env.REACT_APP_API_URL + "/auth/profile", {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Fix: setUser to res.data.data.user if present
      setUser(res.data.data.user || res.data.data);
    } catch (err) {
      console.error("Error fetching profile:", err);
    }
    setLoading(false);
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div>
      <div className="mb-4">
        <button 
          type="button" 
          onClick={() => {
            const role = localStorage.getItem('role');
            if (role === 'recruiter') {
              navigate('/recruiter/home');
            } else if (role === 'jobseeker') {
              navigate('/seeker/home');
            } else {
              navigate('/');
            }
          }} 
          className="text-blue-600 hover:underline flex items-center"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          Back to Dashboard
        </button>
      </div>
      <h2 className="text-2xl font-bold mb-6">Profile</h2>
      
      {/* User Information */}
      <div className="bg-white rounded shadow p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
        {user && (
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-700 mb-3">Basic Information</h4>
              <div className="space-y-2">
                <p><strong>Name:</strong> {user.firstName} {user.lastName}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Role:</strong> {user.role}</p>
                <p><strong>Phone:</strong> {user.phone || 'Not provided'}</p>
              </div>
            </div>
            {/* Only show company info for recruiters */}
            {user.role === 'recruiter' && (
              <div>
                <h4 className="font-medium text-gray-700 mb-3">Company Information</h4>
                <div className="space-y-2">
                  <p><strong>Company Name:</strong> {user.company?.name || 'Not provided'}</p>
                  <p><strong>Industry:</strong> {user.company?.industry || 'Not provided'}</p>
                  <p><strong>Company Size:</strong> {user.company?.size || 'Not provided'}</p>
                  {user.company?.website && (
                    <p><strong>Website:</strong> <a href={user.company.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">Visit Website</a></p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Account Information */}
      <div className="bg-white rounded shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Account Information</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <p><strong>Account Created:</strong> {user && new Date(user.createdAt).toLocaleDateString()}</p>
            <p><strong>Last Updated:</strong> {user && new Date(user.updatedAt).toLocaleDateString()}</p>
            <p><strong>Account Status:</strong> <span className="text-green-600 font-medium">Active</span></p>
          </div>
          <div>
            <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              Edit Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile; 