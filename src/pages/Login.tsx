import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, ArrowLeft, Loader2, User, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import Logo from '../components/Logo';
import AuthDivider from '../components/AuthDivider';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { user, login } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loginType, setLoginType] = useState<'client' | 'admin'>('client');

  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase(), password })
      });
      
      const dataResponse = await response.json();
      if (!response.ok) {
        throw new Error(dataResponse.error || 'Failed to login');
      }

      const { data } = dataResponse;

      // Make sure admin logs in via client portal if they haven't explicitly set their role to admin and the role isn't admin
      if (loginType === 'admin' && data.user.role !== 'admin') {
        throw new Error('This account does not have admin privileges');
      }
      if (loginType === 'client' && data.user.role === 'admin') {
        // Technically an admin can log in as a client, but we'll allow it and just log them in as admin
      }

      login(data.token, {
         id: String(data.user.id),
         email: data.user.email,
         role: data.user.role,
         full_name: data.user.full_name
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while logging in.');
    } finally {
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
