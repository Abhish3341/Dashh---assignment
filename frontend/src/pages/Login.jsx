import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';

const Login = () => {
  const { login, register, loading: authLoading, error: authError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      let result;
      if (isSignUp) {
        result = await register(email, password, name);
      } else {
        result = await login(email, password);
      }
      
      if (!result.success) {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(https://images.pexels.com/photos/1563356/pexels-photo-1563356.jpeg)',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-slate-800/85 to-slate-900/90"></div>
      </div>

      {/* Subtle animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 w-full max-w-md px-6">
        {/* Logo and Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mb-8 shadow-2xl">
            <span className="text-2xl font-bold text-white">D</span>
          </div>
          <h1 className="text-4xl font-light text-white mb-3 tracking-wide">
            Welcome to <span className="font-semibold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Dashh</span>
          </h1>
        
        </div>
        
        {/* Login Form */}
        <div className="backdrop-blur-xl bg-white/5 rounded-3xl p-8 shadow-2xl border border-white/10">
          {/* Toggle Sign In / Sign Up */}
          <div className="flex mb-6">
            <button
              type="button"
              onClick={() => setIsSignUp(false)}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-l-xl transition-all duration-300 ${
                !isSignUp 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setIsSignUp(true)}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-r-xl transition-all duration-300 ${
                isSignUp 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Error Message */}
          {(error || authError) && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
              <p className="text-red-400 text-sm">{error || authError}</p>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Name Field (only for sign up) */}
            {isSignUp && (
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium text-slate-200 tracking-wide">
                  Full Name
                </label>
                <div className="relative group">
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required={isSignUp}
                    className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 backdrop-blur-sm hover:bg-white/10"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onFocus={() => setFocusedField('name')}
                    onBlur={() => setFocusedField(null)}
                  />
                </div>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-slate-200 tracking-wide">
                Email Address
              </label>
              <div className="relative group">
                <Mail className={`absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 transition-all duration-300 ${
                  focusedField === 'email' ? 'text-blue-400 scale-110' : 'text-slate-400'
                }`} />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 backdrop-blur-sm hover:bg-white/10"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-slate-200 tracking-wide">
                Password
              </label>
              <div className="relative group">
                <Lock className={`absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 transition-all duration-300 ${
                  focusedField === 'password' ? 'text-blue-400 scale-110' : 'text-slate-400'
                }`} />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="w-full pl-12 pr-12 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 backdrop-blur-sm hover:bg-white/10"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-blue-400 transition-all duration-300 hover:scale-110"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading || authLoading}
              className="group relative w-full flex justify-center items-center py-4 px-6 border border-transparent text-lg font-medium rounded-2xl text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 disabled:hover:transform-none"
            >
              {(loading || authLoading) ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  <span className="font-light">{isSignUp ? 'Creating account...' : 'Signing in...'}</span>
                </div>
              ) : (
                <div className="flex items-center">
                  <span className="font-light">{isSignUp ? 'Create Account' : 'Sign in'}</span>
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                </div>
              )}
            </button>
          </form>

        </div>

      </div>
    </div>
  );
};

export default Login;