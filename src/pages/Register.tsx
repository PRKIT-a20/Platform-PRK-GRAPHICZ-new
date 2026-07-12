import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, ArrowLeft, Loader2, User, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import Logo from '../components/Logo';
import { AuthDivider } from '../components/AuthDivider';
import { useAuth } from '../context/AuthContext';

const validatePassword = (password: string) => {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  
  if (score < 2) return { score, label: 'Weak', color: 'bg-red-500' };
  if (score < 3) return { score, label: 'Fair', color: 'bg-yellow-500' };
  if (score < 4) return { score, label: 'Good', color: 'bg-blue-500' };
  return { score, label: 'Strong', color: 'bg-green-500' };
};

const Register = () => {
  const navigate = useNavigate();
  const { user, login } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'register' | 'confirm'>('register');

  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    }
  }, [user, navigate]);

  const strength = validatePassword(password);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (strength.score < 2) {
      setError('Please choose a stronger password');
      setLoading(false);
      return;
    }

    // Mock registration logic
    setTimeout(() => {
      setLoading(false);
      
      // We automatically login the user for this mock
      login('dummy-token', {
         id: 'user-' + Math.random().toString(36).substr(2, 9),
         email,
         role: 'client',
         full_name: fullName
      });
      setStep('confirm');
    }, 500);
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
            {step === 'register' ? 'Create an account' : 'Check your email'}
          </h1>
          <p className="text-sm font-medium text-black/40">
            {step === 'register' ? 'Join the client portal to manage your projects' : 'We sent a verification link'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 text-sm font-bold rounded-xl border bg-red-50 text-red-500 border-red-100">
            {error}
          </div>
        )}

        {step === 'register' ? (
          <>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-bold uppercase tracking-widest text-black/40 mb-2">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-black/20" size={20} />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-black/5 border border-transparent rounded-2xl focus:border-black/10 focus:bg-white transition-all outline-none font-medium"
                    placeholder="John Doe"
                  />
                </div>
              </div>

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
                    placeholder="yourname@gmail.com"
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
                {password && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-black/40">Strength: {strength.label}</span>
                    </div>
                    <div className="flex gap-1 h-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div 
                          key={i}
                          className={`flex-1 rounded-full transition-all duration-500 ${
                            i <= strength.score ? strength.color : 'bg-black/5'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold uppercase tracking-widest text-black/40 mb-2">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-black/20" size={20} />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-4 bg-black/5 border border-transparent rounded-2xl focus:border-black/10 focus:bg-white transition-all outline-none font-medium"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-black/20 hover:text-black/40 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
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
                    Create Account
                    <ArrowRight size={20} />
                  </>
                )}
              </button>
            </form>
          </>
        ) : (
          <div className="space-y-6">
            <div className="p-6 bg-black/5 rounded-2xl text-center">
              <CheckCircle2 size={48} className="mx-auto text-green-500 mb-4" />
              <p className="text-sm font-medium text-black/60 mb-4">
                Mock registration successful! You are now logged in.
              </p>
            </div>
            <Link
              to="/dashboard"
              className="w-full py-4 bg-brand-primary text-brand-secondary rounded-2xl font-bold text-lg hover:bg-brand-secondary hover:text-brand-primary transition-all flex items-center justify-center gap-2 shadow-xl shadow-brand-primary/10"
            >
              Go to Dashboard
              <ArrowRight size={20} />
            </Link>
          </div>
        )}

        {step === 'register' && (
          <p className="mt-8 text-center text-sm font-medium text-black/40">
            Already have an account?{' '}
            <Link to="/login" className="text-black font-bold hover:underline">
              Log in instead
            </Link>
          </p>
        )}
      </motion.div>
    </div>
  );
};

export default Register;
