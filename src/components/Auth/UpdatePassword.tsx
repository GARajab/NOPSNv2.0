import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import AuthLayout from './AuthLayout';
import Button from '../Common/Button';
import Input from '../Common/Input';
import Spinner from '../Common/Spinner';

const UpdatePassword: React.FC = () => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [checkingSession, setCheckingSession] = useState(true);
    const [isRecoveryFlow, setIsRecoveryFlow] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);

    const navigate = useNavigate();

    useEffect(() => {
        const checkSessionAndRecovery = async () => {
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                setError('No active session');
                setCheckingSession(false);
                return;
            }

            // Check for recovery parameter
            const recoveryParam = new URLSearchParams(window.location.search).get('recovery');
            console.log('URL recovery param:', recoveryParam);

            if (recoveryParam === 'true') {
                setIsRecoveryFlow(true);
                setCheckingSession(false);
            } else {
                navigate('/dashboard');
            }
        };

        checkSessionAndRecovery();

        // Give it a small delay to ensure URL is processed
        setTimeout(() => {
            checkSessionAndRecovery();
        }, 300);
    }, [navigate]);

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

                // Clear recovery flags if they exist
                const { data: { user } } = await supabase.auth.getUser();
                if (user?.email) {
                    localStorage.removeItem(`recovery_pending_${user.email}`);
                    localStorage.removeItem(`recovery_timestamp_${user.email}`);
                }

                // IMPORTANT: Sign out immediately after password change in recovery flow
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
                    <p className="text-gray-600">Checking session...</p>
                </div>
            </div>
        );
    }

    if (!isRecoveryFlow && !success) {
        // This shouldn't happen due to redirect, but just in case
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
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <p className="text-sm text-yellow-800">
                                <strong>Password Reset:</strong> You are setting a new password after requesting a reset.
                                After updating, you will be logged out and must sign in again.
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
                        {isRecoveryFlow ? 'Reset Password' : 'Update Password'}
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