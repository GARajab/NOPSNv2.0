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
  const [isRecoverySession, setIsRecoverySession] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // Check if this is a recovery session by looking at the URL parameters
        const type = searchParams.get('type');
        if (type === 'recovery') {
          setIsRecoverySession(true);
        } else {
          // If not a recovery session, redirect to dashboard
          navigate('/dashboard');
        }
      } else {
        setError('Invalid or expired reset link. Please request a new password reset.');
      }
      
      setCheckingSession(false);
    };

    checkSession();
  }, [navigate, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

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
      // Update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      
      if (updateError) {
        setError(updateError.message);
      } else {
        setSuccess(true);
        
        // IMPORTANT: Force sign out immediately after password change
        await supabase.auth.signOut();
        
        // Clear all storage
        localStorage.clear();
        sessionStorage.clear();
        
        // Redirect to login with success message
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

  if (!isRecoverySession && !success) {
    return (
      <AuthLayout
        title="Invalid Access"
        subtitle="This page is only for password recovery"
      >
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="bg-blue-100 p-3 rounded-full">
              <AlertCircle className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <p className="text-gray-600">
            Redirecting you to your dashboard...
          </p>
          <Spinner size="md" />
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Set new password"
      subtitle="Create a new password for your account"
    >
      {success ? (
        <div className="text-center space-y-4 animate-fade-in">
          <div className="flex justify-center">
            <div className="bg-green-100 p-3 rounded-full">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-gray-900">
            Password Updated!
          </h3>
          <p className="text-gray-600">
            Your password has been successfully updated. You will be logged out and redirected to login...
          </p>
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

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>Important:</strong> You are currently logged in with a temporary recovery session. 
              After setting your new password, you will be automatically logged out and must sign in again.
            </p>
          </div>

          <Input
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            icon={Lock}
            placeholder="••••••••"
            required
            disabled={loading}
          />

          <Input
            label="Confirm New Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            icon={Lock}
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
            Update Password & Log Out
          </Button>
        </form>
      )}
    </AuthLayout>
  );
};

export default UpdatePassword;