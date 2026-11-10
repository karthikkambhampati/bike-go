import { useState, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { KeyRound, ArrowRight, RefreshCw } from 'lucide-react';
import { API_ENDPOINTS } from '../config/api';

const VerifyOtp = () => {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const { verifyOtpUser } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  // Retrieve the email passed from the Signup page
  const email = location.state?.email || '';

  // 1. Handle OTP Verification
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      if (otp.length !== 6) {
        throw new Error('Please enter a valid 6-digit OTP.');
      }
      await verifyOtpUser(email, otp);
      
      // Verification successful -> redirect to home page dashboard
      navigate('/');
    } catch (err) {
      setError(err.message || 'OTP verification failed.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Handle Resending OTP
  const handleResend = async () => {
    setError('');
    setSuccessMessage('');
    setResending(true);

    try {
      const res = await fetch(API_ENDPOINTS.AUTH.RESEND_OTP, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Failed to resend OTP.');
      }
      
      setSuccessMessage('A new OTP has been sent. Please check your verification code.');
    } catch (err) {
      setError(err.message || 'Error resending OTP.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800 text-white p-8 rounded-2xl shadow-2xl w-full max-w-md border border-slate-700">
        
        {/* Header/Icon */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-emerald-500 p-3 rounded-full mb-3 shadow-lg shadow-emerald-500/20">
            <KeyRound className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight">Verify Email</h2>
          <p className="text-slate-400 text-sm mt-2 text-center">
            We sent a verification code to <br />
            <span className="text-emerald-400 font-semibold">{email || 'your email'}</span>
          </p>
        </div>

        {/* Error Alert Box */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        {/* Success Alert Box */}
        {successMessage && (
          <div className="bg-emerald-500/10 border border-emerald-500/50 text-emerald-200 p-3 rounded-lg mb-6 text-sm">
            {successMessage}
          </div>
        )}

        {/* OTP Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 text-center">
              Enter 6-Digit Code
            </label>
            <input
              type="text"
              maxLength="6"
              required
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} // Only allow numbers
              className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 px-4 text-center text-3xl font-bold tracking-[0.5em] focus:outline-none focus:border-emerald-500 transition duration-200"
              placeholder="000000"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white font-bold py-3 rounded-xl transition duration-150 shadow-lg shadow-emerald-500/20 disabled:bg-emerald-700 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2"
          >
            {loading ? 'Verifying...' : 'Verify Code'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Resend Code Section */}
        <div className="text-center mt-8">
          <p className="text-sm text-slate-400">
            Didn't receive the code?{' '}
            <button
              onClick={handleResend}
              disabled={resending}
              className="text-emerald-400 hover:text-emerald-300 font-semibold transition duration-150 inline-flex items-center gap-1 disabled:text-emerald-700 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
              Resend OTP
            </button>
          </p>
        </div>

      </div>
    </div>
  );
};

export default VerifyOtp;
