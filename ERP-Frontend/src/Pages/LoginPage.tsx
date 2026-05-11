import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { LifeBuoy, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../Services/helpdesk/authService';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [view, setView] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // register state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [regRole, setRegRole] = useState<'Admin' | 'Agent' | 'Client' | 'SubClient'>('Agent');

  const redirectTo = (location.state as any)?.from?.pathname || '/';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Veuillez renseigner email et mot de passe.');
      return;
    }
    setSubmitting(true);
    try {
      await login(email, password);
      navigate(redirectTo, { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Identifiants invalides.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!regName || !regEmail || !regPassword) {
      setError('Veuillez remplir tous les champs.');
      return;
    }
    if (regPassword !== regConfirm) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    if (regPassword.length < 6) {
      setError('Le mot de passe doit faire au moins 6 caractères.');
      return;
    }
    setSubmitting(true);
    try {
      await authService.register({ email: regEmail, password: regPassword, role: regRole });
      setSuccessMessage('Compte créé avec succès. Vous pouvez vous connecter.');
      setView('login');
      setEmail(regEmail);
      setRegName(''); setRegEmail(''); setRegPassword(''); setRegConfirm('');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Inscription impossible.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('Si un compte existe, un email vient d\'être envoyé.');
    setTimeout(() => setView('login'), 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <div className="hidden lg:flex lg:w-[480px] bg-slate-900 text-white flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 -left-10 w-64 h-64 rounded-full border border-white" />
          <div className="absolute bottom-32 -right-20 w-96 h-96 rounded-full border border-white" />
          <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full border border-white" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center mb-16">
            <div className="bg-[#ef7c21] p-2.5 rounded-xl mr-3">
              <LifeBuoy className="h-7 w-7 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight">HelpDesk Pro</span>
          </div>
          <h1 className="text-4xl font-bold leading-tight mb-6">Streamline your<br />support workflow</h1>
          <p className="text-slate-400 text-lg leading-relaxed max-w-sm">
            Manage tickets, track time, and deliver exceptional support — all in one place.
          </p>
        </div>
        <p className="text-xs text-slate-600 relative z-10">© 2024 HelpDesk Pro.</p>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center justify-center mb-10">
            <div className="bg-[#ef7c21] p-2 rounded-xl mr-2.5">
              <LifeBuoy className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">HelpDesk Pro</span>
          </div>

          {successMessage && (
            <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">{successMessage}</div>
          )}
          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
          )}

          {view === 'login' && (
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-1">Welcome back</h2>
              <p className="text-slate-500 mb-8">Sign in to your account to continue</p>

              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Email address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(''); setSuccessMessage(''); }}
                      placeholder="you@company.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-[#ef7c21] focus:border-transparent placeholder-slate-400"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-sm font-medium text-slate-700">Password</label>
                    <button
                      type="button"
                      onClick={() => { setView('forgot'); setError(''); setSuccessMessage(''); }}
                      className="text-xs text-[#ef7c21] hover:text-[#d96a1a] font-medium"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(''); }}
                      placeholder="Enter your password"
                      className="w-full pl-10 pr-11 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-[#ef7c21] focus:border-transparent placeholder-slate-400"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" disabled={submitting} className="w-full h-11 text-sm font-medium">
                  {submitting ? 'Connexion…' : 'Sign in'}
                  {!submitting && <ArrowRight className="h-4 w-4 ml-2" />}
                </Button>
              </form>

              <p className="mt-8 text-center text-sm text-slate-500">
                Don't have an account?{' '}
                <button onClick={() => { setView('register'); setError(''); }} className="text-[#ef7c21] hover:text-[#d96a1a] font-medium">
                  Create one
                </button>
              </p>
            </div>
          )}

          {view === 'register' && (
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-1">Create an account</h2>
              <p className="text-slate-500 mb-8">Get started with HelpDesk Pro</p>

              <form onSubmit={handleRegister} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Full name</label>
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => { setRegName(e.target.value); setError(''); }}
                    placeholder="Jean Dupont"
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-[#ef7c21] focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Email address</label>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => { setRegEmail(e.target.value); setError(''); }}
                    placeholder="you@company.com"
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-[#ef7c21] focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Role</label>
                  <select
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value as 'Admin' | 'Agent' | 'Client' | 'SubClient')}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-[#ef7c21] focus:border-transparent"
                  >
                    <option value="Agent">Agent</option>
                    <option value="Admin">Admin</option>
                    <option value="Client">Client</option>
                    <option value="SubClient">SubClient</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => { setRegPassword(e.target.value); setError(''); }}
                    placeholder="Au moins 6 caractères"
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-[#ef7c21] focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm password</label>
                  <input
                    type="password"
                    value={regConfirm}
                    onChange={(e) => { setRegConfirm(e.target.value); setError(''); }}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-[#ef7c21] focus:border-transparent"
                    required
                  />
                </div>

                <Button type="submit" disabled={submitting} className="w-full h-11 text-sm font-medium">
                  {submitting ? 'Création…' : 'Create account'}
                  {!submitting && <ArrowRight className="h-4 w-4 ml-2" />}
                </Button>
              </form>

              <p className="mt-8 text-center text-sm text-slate-500">
                Already have an account?{' '}
                <button onClick={() => { setView('login'); setError(''); }} className="text-[#ef7c21] hover:text-[#d96a1a] font-medium">
                  Sign in
                </button>
              </p>
            </div>
          )}

          {view === 'forgot' && (
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-1">Reset your password</h2>
              <p className="text-slate-500 mb-8">Enter your email and we'll send you a reset link</p>

              <form onSubmit={handleForgotPassword} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Email address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-[#ef7c21] focus:border-transparent"
                    required
                  />
                </div>
                <Button type="submit" className="w-full h-11 text-sm font-medium">
                  Send reset link
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </form>

              <p className="mt-8 text-center text-sm text-slate-500">
                Remember your password?{' '}
                <button onClick={() => { setView('login'); setError(''); }} className="text-[#ef7c21] hover:text-[#d96a1a] font-medium">
                  Back to sign in
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
