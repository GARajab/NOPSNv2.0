import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import AuthLayout from './AuthLayout';
import Button from '../Common/Button';
import Input from '../Common/Input';
import Spinner from '../Common/Spinner';

const UpdatePassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [isRecoveryFlow, setIsRecoveryFlow] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const checkSessionAndRecovery = async () => {
      try {
        // Check for session first
        const { data: { session } } = await supabase.auth.getSession();
        
        console.log('Session:', session);
        console.log('URL Search Params:', Object.fromEntries(searchParams.entries()));
        
        if (!session) {
          setError('No active session. Please use the password reset link from your email.');
          setCheckingSession(false);
          return;
        }

        // Check URL parameter FIRST - this is the most reliable
        const recoveryParam = searchParams.get('recovery');
        console.log('Recovery parameter from URL:', recoveryParam);
        
        if (recoveryParam === 'true') {
          console.log('✅ Detected recovery from URL parameter');
          setIsRecoveryFlow(true);
          setCheckingSession(false);
          
          // Remove the parameter from URL without reloading (optional)
          window.history.replaceState({}, '', window.location.pathname);
          return;
        }

        // Also check window.location.search directly (fallback)
        const urlParams = new URLSearchParams(window.location.search);
        const directRecoveryParam = urlParams.get('recovery');
        if (directRecoveryParam === 'true') {
          console.log('✅ Detected recovery from direct URL check');
          setIsRecoveryFlow(true);
          setCheckingSession(false);
          window.history.replaceState({}, '', window.location.pathname);
          return;
        }

        // Check hash fragment as well (Supabase sometimes uses hash)
        const hash = window.location.hash;
        console.log('URL hash:', hash);
        if (hash.includes('type=recovery') || hash.includes('access_token')) {
          console.log('✅ Detected recovery from URL hash');
          setIsRecoveryFlow(true);
          setCheckingSession(false);
          window.history.replaceState({}, '', window.location.pathname);
          return;
        }

        // If no recovery indicators, redirect to dashboard
        console.log('❌ No recovery indicators found, redirecting to dashboard');
        navigate('/dashboard');
        
      } catch (err) {
        console.error('Error checking session:', err);
        setError('Failed to verify session. Please try again.');
        setCheckingSession(false);
      }
    };

    // Small delay to ensure URL is fully processed
    setTimeout(() => {
      checkSessionAndRecovery();
    }, 100);
  }, [navigate, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!newPassword.trim()) {
      setError('Password is required');
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
      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      
      if (updateError) {
        setError(updateError.message);
      } else {
        setSuccess(true);
        
        // IMPORTANT: For recovery flow, sign out immediately
        if (isRecoveryFlow) {
          await supabase.auth.signOut();
          localStorage.clear();
          sessionStorage.clear();
        }
        
        // Redirect based on flow
        setTimeout(() => {
          if (isRecoveryFlow) {
            navigate('/login?message=password_reset_success');
          } else {
            navigate('/dashboard?message=password_updated');
          }
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Spinner size="lg" className="mx-auto mb-4" />
          <p className="text-gray-600">Verifying your session...</p>
        </div>
      </div>
    );
  }

  // If not recovery flow and not success, we should have redirected already
  // But just in case, show a loading spinner
  if (!isRecoveryFlow && !success) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <AuthLayout
      title={isRecoveryFlow ? "Set New Password" : "Update Password"}
      subtitle={isRecoveryFlow ? "Create a new password for your account" : "Change your account password"}
    >
      {success ? (
        <div className="text-center space-y-4 animate-fade-in">
          <div className="flex justify-center">
            <div className="bg-green-100 p-3 rounded-full">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-gray-900">
            {isRecoveryFlow ? 'Password Reset Successful!' : 'Password Updated!'}
          </h3>
          <p className="text-gray-600">
            {isRecoveryFlow 
              ? 'You will be redirected to login...' 
              : 'Your password has been updated successfully.'}
          </p>
          <Spinner size="md" />
        </div>
      ) : (
        <form className="space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          )}

          {isRecoveryFlow && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Password Reset Mode:</strong> You are setting a new password after requesting a reset.
                After updating, you will be logged out and must sign in again with your new password.
              </p>
            </div>
          )}

          <Input
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            icon={Lock}
            placeholder="Enter new password"
            required
            disabled={loading}
          />

          <Input
            label="Confirm New Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            icon={Lock}
            placeholder="Confirm new password"
            required
            disabled={loading}
          />

          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Password Requirements:
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li className={newPassword.length >= 6 ? 'text-green-600 font-medium' : ''}>
                • At least 6 characters long
              </li>
              <li className={newPassword && newPassword === confirmPassword ? 'text-green-600 font-medium' : ''}>
                • Passwords must match
              </li>
            </ul>
          </div>

          <Button
            type="submit"
            variant="primary"
            loading={loading}
            fullWidth
            className="mt-4"
          >
            {isRecoveryFlow ? 'Reset Password & Log Out' : 'Update Password'}
          </Button>

          {!isRecoveryFlow && (
            <div className="text-center pt-4">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="text-sm font-medium text-primary-600 hover:text-primary-500"
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          )}
        </form>
      )}
    </AuthLayout>
  );
};

export default UpdatePassword;