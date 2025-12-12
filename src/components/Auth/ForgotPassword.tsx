import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import AuthLayout from './AuthLayout';
import Button from '../Common/Button';
import Input from '../Common/Input';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);

    try {
      // First, verify the email exists
      const { data: userData } = await supabase
        .from('user_profiles')
        .select('email')
        .eq('email', email)
        .single();

      if (!userData) {
        setError('No account found with this email address');
        setLoading(false);
        return;
      }

      // Send OTP to email
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/reset-password`,
          shouldCreateUser: false,
        },
      });
      
      if (otpError) {
        setError(otpError.message);
      } else {
        setOtpSent(true);
        setSuccess(true);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!otp.trim()) {
      setError('Please enter the OTP sent to your email');
      return;
    }

    if (!newPassword.trim()) {
      setError('Please enter a new password');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      // First verify OTP
      const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'recovery',
      });

      if (verifyError) {
        setError('Invalid or expired OTP. Please request a new one.');
        setLoading(false);
        return;
      }

      if (!verifyData.session) {
        setError('Unable to create session. Please try again.');
        setLoading(false);
        return;
      }

      // Now update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      
      if (updateError) {
        setError(updateError.message);
      } else {
        // Sign out immediately after password change
        await supabase.auth.signOut();
        setSuccess(true);
        setOtpSent(false);
        
        setTimeout(() => {
          window.location.href = '/login';
        }, 3000);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Reset your password"
      subtitle={otpSent ? "Enter OTP and new password" : "Enter your email to receive a reset OTP"}
    >
      {success && !otpSent ? (
        <div className="text-center space-y-4 animate-fade-in">
          <div className="flex justify-center">
            <div className="bg-green-100 p-3 rounded-full">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-gray-900">
            Password Reset Successful!
          </h3>
          <p className="text-gray-600">
            Your password has been updated successfully. Redirecting to login...
          </p>
        </div>
      ) : (
        <form className="space-y-6" onSubmit={otpSent ? handleResetPassword : handleSendOtp}>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          )}

          {!otpSent ? (
            <>
              <p className="text-sm text-gray-600">
                Enter the email address associated with your account and we'll send you a One-Time Password (OTP) to reset your password.
              </p>

              <Input
                label="Email address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={Mail}
                placeholder="you@example.com"
                required
                disabled={loading}
              />

              <Button
                type="submit"
                variant="primary"
                loading={loading}
                fullWidth
              >
                Send OTP
              </Button>
            </>
          ) : (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  We've sent a 6-digit OTP to <strong>{email}</strong>. Check your inbox and enter it below along with your new password.
                </p>
              </div>

              <Input
                label="OTP Code"
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                required
                disabled={loading}
              />

              <Input
                label="New Password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
              />

              <Input
                label="Confirm New Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
              />

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Password requirements:</p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li className={newPassword.length >= 6 ? 'text-green-600' : ''}>
                    • At least 6 characters
                  </li>
                  <li className={newPassword && newPassword === confirmPassword ? 'text-green-600' : ''}>
                    • Passwords must match
                  </li>
                </ul>
              </div>

              <Button
                type="submit"
                variant="primary"
                loading={loading}
                fullWidth
              >
                Reset Password
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setOtpSent(false)}
                  className="text-sm font-medium text-primary-600 hover:text-primary-500"
                  disabled={loading}
                >
                  Back to email entry
                </button>
              </div>
            </>
          )}

          <div className="text-center pt-4">
            <Link
              to="/login"
              className="text-sm font-medium text-primary-600 hover:text-primary-500 transition-colors"
            >
              Back to login
            </Link>
          </div>
        </form>
      )}
    </AuthLayout>
  );
};

export default ForgotPassword;