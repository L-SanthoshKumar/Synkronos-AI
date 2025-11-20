import React, { useState } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";

const TABS = ["Job Seeker", "Recruiter"];

const Register = () => {
  const [activeTab, setActiveTab] = useState("Job Seeker");
  const [showLogin, setShowLogin] = useState(false);
  const { register, handleSubmit, formState: { errors }, setError, reset } = useForm();
  const { register: loginRegister, handleSubmit: handleLoginSubmit, formState: { errors: loginErrors }, setError: setLoginError, reset: resetLogin } = useForm();
  const navigate = useNavigate();
  const { login } = useApp();

  // Registration submit
  const onSubmit = async (data) => {
    try {
      const payload = {
        firstName: data.firstName,
        lastName: data.lastName,
        contactNumber: data.contactNumber,
        email: data.email,
        password: data.password,
        confirmPassword: data.confirmPassword,
        role: activeTab === "Recruiter" ? "recruiter" : "jobseeker"
      };
      const res = await axios.post(
        process.env.REACT_APP_API_URL + "/auth/register",
        payload
      );
      login(res.data.data.token, res.data.data.user);
      if (res.data.data.user.role === "recruiter") {
        navigate("/recruiter/home");
      } else {
        navigate("/seeker/home");
      }
    } catch (err) {
      setError("api", { message: err.response?.data?.errors?.[0]?.msg || err.response?.data?.message || "Registration failed" });
    }
  };

  // Login submit
  const onLogin = async (data) => {
    try {
      const payload = {
        email: data.email,
        password: data.password,
      };
      const res = await axios.post(
        process.env.REACT_APP_API_URL + "/auth/login",
        payload
      );
      login(res.data.data.token, res.data.data.user);
      if (res.data.data.user.role === "recruiter") {
        navigate("/recruiter/home");
      } else {
        navigate("/seeker/home");
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || "Login failed. Please check your credentials and try again.";
      setLoginError("api", { message: errorMessage });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center">
      {/* Banner/Header */}
      <div className="relative h-40 bg-gray-800 flex items-center justify-center">
        <div className="absolute inset-0 bg-black opacity-40"></div>
        <div className="relative z-10 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Welcome to the AI Job Portal!</h1>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center py-8">
        <div className="w-full max-w-md bg-white rounded-lg shadow p-8">
          {/* Tabs */}
          {!showLogin && (
            <div className="flex mb-6 border-b">
              {TABS.map(tab => (
                <button
                  key={tab}
                  className={`flex-1 py-2 text-lg font-medium focus:outline-none ${activeTab === tab ? "text-white bg-blue-600 rounded-t" : "text-gray-700 bg-gray-100"}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
          )}
          {/* Registration Form */}
          {!showLogin ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <input type="text" placeholder="First Name" {...register("firstName", { required: true, minLength: 2, maxLength: 50 })} className="w-full border rounded px-3 py-2" />
              {errors.firstName && <span className="text-red-500 text-sm">First name must be between 2 and 50 characters</span>}
              <input type="text" placeholder="Last Name" {...register("lastName", { required: true, minLength: 2, maxLength: 50 })} className="w-full border rounded px-3 py-2" />
              {errors.lastName && <span className="text-red-500 text-sm">Last name must be between 2 and 50 characters</span>}
              <input type="text" placeholder="Contact Number" {...register("contactNumber", { required: true, pattern: /^\+?\d{7,15}$/ })} className="w-full border rounded px-3 py-2" />
              {errors.contactNumber && <span className="text-red-500 text-sm">Valid contact number is required</span>}
              <input type="email" placeholder="Email" {...register("email", { required: true })} className="w-full border rounded px-3 py-2" />
              {errors.email && <span className="text-red-500 text-sm">Email is required</span>}
              <input type="password" placeholder="Password" {...register("password", { required: true, minLength: 6 })} className="w-full border rounded px-3 py-2" />
              {errors.password && <span className="text-red-500 text-sm">Password is required (min 6 chars)</span>}
              <input type="password" placeholder="Confirm Password" {...register("confirmPassword", { required: true, validate: (value) => value === (document.querySelector('input[name=\"password\"]')?.value) })} className="w-full border rounded px-3 py-2" />
              {errors.confirmPassword && <span className="text-red-500 text-sm">Passwords must match</span>}
              {errors.api && <div className="text-red-500 text-sm">{errors.api.message}</div>}
              <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">SIGN UP</button>
            </form>
          ) : (
            // Login Form
            <form onSubmit={handleLoginSubmit(onLogin)} className="space-y-4">
              <input type="email" placeholder="Email" {...loginRegister("email", { required: true })} className="w-full border rounded px-3 py-2" />
              {loginErrors.email && <span className="text-red-500 text-sm">Email is required</span>}
              <input type="password" placeholder="Password" {...loginRegister("password", { required: true })} className="w-full border rounded px-3 py-2" />
              {loginErrors.password && <span className="text-red-500 text-sm">Password is required</span>}
              {loginErrors.api && <div className="text-red-500 text-sm">{loginErrors.api.message}</div>}
              <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">SIGN IN</button>
            </form>
          )}
          {/* Toggle link */}
          <div className="text-center mt-6">
            {!showLogin ? (
              <span className="text-gray-500">Already Registered? <button className="text-blue-600 hover:underline" onClick={() => { setShowLogin(true); resetLogin(); }}>Sign in</button></span>
            ) : (
              <span className="text-gray-500">New here? <button className="text-blue-600 hover:underline" onClick={() => { setShowLogin(false); reset(); }}>Create an account</button></span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
