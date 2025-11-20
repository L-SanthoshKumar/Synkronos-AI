import React from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { useApp } from "../context/AppContext";

const Login = () => {
  const { register, handleSubmit, formState: { errors }, setError } = useForm();
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useApp();

  const onSubmit = async (data) => {
    try {
      const res = await axios.post(
        process.env.REACT_APP_API_URL + "/auth/login",
        data
      );
      login(res.data.data.token, res.data.data.user);
      
      // Check if there's a redirect path from location state
      const from = location.state?.from;
      
      if (from) {
        // Redirect to the original intended destination
        navigate(from, { replace: true });
      } else {
        // Default redirect based on user role
        if (res.data.data.user.role === "recruiter") {
          navigate("/recruiter/home");
        } else {
          navigate("/seeker/home");
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      console.error('Login error response:', err.response?.data);
      
      let errorMessage = "Login failed. Please check your credentials and try again.";
      
      if (err.response?.data) {
        if (err.response.data.message) {
          errorMessage = err.response.data.message;
        } else if (err.response.data.errors && Array.isArray(err.response.data.errors)) {
          errorMessage = err.response.data.errors.map(e => e.msg || e.message).join(', ');
        }
      }
      
      setError("api", { message: errorMessage });
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded shadow">
      <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
      
      {/* Show redirect message if applicable */}
      {location.state?.from && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
          <p className="text-blue-800 text-sm">
            Please login to access this feature.
          </p>
        </div>
      )}
      
      <div className="mb-4">
        <button type="button" onClick={() => navigate("/")} className="text-blue-600 hover:underline flex items-center">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          Back to Welcome
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block mb-1">Email</label>
          <input type="email" {...register("email", { required: true })} className="w-full border rounded px-3 py-2" />
          {errors.email && <span className="text-red-500 text-sm">Email is required</span>}
        </div>
        <div>
          <label className="block mb-1">Password</label>
          <input type="password" {...register("password", { required: true })} className="w-full border rounded px-3 py-2" />
          {errors.password && <span className="text-red-500 text-sm">Password is required</span>}
        </div>
        {errors.api && <div className="text-red-500 text-sm">{errors.api.message}</div>}
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Login</button>
      </form>
    </div>
  );
};

export default Login; 