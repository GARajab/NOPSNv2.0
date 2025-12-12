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
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setError('No active session. Please use a valid recovery link.');
        setCheckingSession(false);
        return;
      }

      // Check if this is a recovery flow
      const recoveryFlag = searchParams.get('recovery');
      if (recoveryFlag === 'true') {
        setIsRecoveryFlow(true);
      } else {
        // If not recovery, maybe user accessed directly - check if we should redirect
        navigate('/dashboard');
        return;
      }
      
      setCheckingSession(false);
    };

    checkSessionAndRecovery();
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
        
        // IMPORTANT FOR RECOVERY: Sign out immediately
        await supabase.auth.signOut();
        
        // Clear all storage
        localStorage.clear();
        sessionStorage.clear();
        
        // Redirect to login
        setTimeout(() => {
          navigate('/login?message=password_reset_success');
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
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error && !isRecoveryFlow) {
    return (
      <AuthLayout
        title="Session Error"
        subtitle="Unable to process password reset"
      >
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <AlertCircle className="h-12 w-12 text-red-500" />
          </div>
          <p className="text-gray-600">{error}</p>
          <Button
            variant="primary"
            onClick={() => navigate('/forgot-password')}
          >
            Request New Reset Link
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Set New Password"
      subtitle="Create a new password for your account"
    >
      {success ? (
        <div className="text-center space-y-4 animate-fade-in">
          <div className="flex justify-center">
            <CheckCircle className="h-12 w-12 text-green-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900">
            Password Updated Successfully!
          </h3>
          <p className="text-gray-600">
            You will be redirected to login in a moment...
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
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800">
                <strong>Password Reset:</strong> Please enter your new password below.
                After updating, you will be logged out and redirected to the login page.
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
            Update Password
          </Button>

          <div className="text-center pt-4">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-sm font-medium text-primary-600 hover:text-primary-500"
              disabled={loading}
            >
              Back to Login
            </button>
          </div>
        </form>
      )}
    </AuthLayout>
  );
};

export default UpdatePassword;