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
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setError('No active session. Please use the password reset link from your email.');
        setCheckingSession(false);
        return;
      }

      // Check URL for recovery indicators
      const hash = window.location.hash;
      const hasRecoveryHash = hash.includes('type=recovery') || hash.includes('access_token');
      
      // Also check if user just came from a password reset
      // You can check localStorage or a timestamp
      const lastResetRequest = localStorage.getItem('last_password_reset_request');
      const now = Date.now();
      
      if (hasRecoveryHash || (lastResetRequest && (now - parseInt(lastResetRequest)) < 300000)) {
        // 5-minute window after reset request
        setIsRecoveryFlow(true);
      } else {
        // Not a recovery flow, redirect to dashboard
        navigate('/dashboard');
        return;
      }
      
      setCheckingSession(false);
    };

    checkSession();
  }, [navigate]);

  // ... rest of the UpdatePassword component remains the same