import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';
import Logo from '../components/Logo';
import AuthDivider from '../components/AuthDivider';
import { Mail, Lock, ArrowRight, Loader2, Eye, EyeOff, ShieldCheck, User, ArrowLeft } from 'lucide-react';

const Login = () => {
  const [loginType, setLoginType] = useState<'client' | 'admin'>('client');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      if (loginType === 'admin' && user.role !== 'admin') {
        navigate('/dashboard');
      } else {
        navigate(user.role === 'admin' ? '/admin' : '/dashboard');
      }
    }
  }, [user, navigate, loginType]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'Google login failed');
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;
      // Navigation is handled by the useEffect watching the user state
    } catch (err: any) {
      if (err.message === 'Email not confirmed') {
        setError('Please verify your email address before logging in.');
      } else {
        setError(err.message || 'Login failed');
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfcfc] flex items-center justify-center p-6 relative">
      <div className="absolute top-8 left-8 z-50">
        <Link 
          to="/" 
          className="flex items-center gap-2 px-6 py-3 bg-brand-primary text-brand-secondary rounded-full text-[11px] font-black uppercase tracking-widest shadow-xl shadow-brand-primary/20 hover:scale-105 hover:shadow-brand-primary/30 transition-all group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back to Website
        </Link>
      </div>

      <div className="absolute top-0 left-0 w-full h-full -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-primary/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-secondary/5 blur-[120px] rounded-full" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white p-10 rounded-3xl border border-black/5 shadow-2xl shadow-black/5"
      >
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <Logo />
          </Link>
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            Welcome back
          </h1>
          <div className="flex items-center justify-center p-1 bg-black/5 rounded-2xl mt-4">
            <button 
              type="button"
              onClick={() => setLoginType('client')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all duration-300 ${
                loginType === 'client' 
                  ? 'bg-white text-black shadow-sm' 
                  : 'text-black/40 hover:text-black/60'
              }`}
            >
              <User size={14} />
              Client
            </button>
            <button 
              type="button"
              onClick={() => setLoginType('admin')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all duration-300 ${
                loginType === 'admin' 
                  ? 'bg-brand-primary text-brand-secondary shadow-sm' 
                  : 'text-black/40 hover:text-brand-primary'
              }`}
            >
              <ShieldCheck size={14} />
              Admin
            </button>
          </div>
          <p className="mt-6 text-sm font-medium text-black/40 min-h-[20px]">
            {loginType === 'client' ? 'Access your project portal' : 'Manage your business operations'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 text-sm font-bold rounded-xl border bg-red-50 text-red-500 border-red-100">
            {error}
          </div>
        )}

        <div className="mb-6">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-4 bg-white border border-black/10 text-black rounded-2xl font-bold text-lg hover:bg-black/5 transition-all flex items-center justify-center gap-3 shadow-sm disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </button>
        </div>

        <AuthDivider subtext="or login with email" />

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold uppercase tracking-widest text-black/40 mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-black/20" size={20} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-black/5 border border-transparent rounded-2xl focus:border-black/10 focus:bg-white transition-all outline-none font-medium"
                placeholder="name@company.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold uppercase tracking-widest text-black/40 mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-black/20" size={20} />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-12 py-4 bg-black/5 border border-transparent rounded-2xl focus:border-black/10 focus:bg-white transition-all outline-none font-medium"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-black/20 hover:text-black/40 transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-brand-primary text-brand-secondary rounded-2xl font-bold text-lg hover:bg-brand-secondary hover:text-brand-primary transition-all flex items-center justify-center gap-2 shadow-xl shadow-brand-primary/10 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" /> : (
              <>
                Log In
                <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-sm font-medium text-black/40">
          Don't have an account?{' '}
          <Link to="/register" className="text-black font-bold hover:underline">
            Sign up for free
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
