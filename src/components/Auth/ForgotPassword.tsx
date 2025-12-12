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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);

    try {
      // Use resetPasswordForEmail (standard Supabase method)
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: `${window.location.origin}/update-password`,
        }
      );
      
      if (resetError) {
        setError(resetError.message);
      } else {
        setSuccess(true);
      }
    } catch (err: any) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your email to receive a reset link"
    >
      {success ? (
        <div className="text-center space-y-4 animate-fade-in">
          <div className="flex justify-center">
            <div className="bg-green-100 p-3 rounded-full">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-gray-900">
            Check your email!
          </h3>
          <p className="text-gray-600">
            We've sent password reset instructions to <strong>{email}</strong>.
          </p>
          <p className="text-sm text-gray-500">
            Click the link in the email to reset your password. The link will expire in 24 hours.
          </p>
          <div className="pt-4">
            <Link
              to="/login"
              className="inline-block text-sm font-medium text-primary-600 hover:text-primary-500"
            >
              Back to login
            </Link>
          </div>
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

          <p className="text-sm text-gray-600">
            Enter the email address associated with your account and we'll send you a link to reset your password.
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
            Send reset link
          </Button>

          <div className="text-center">
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