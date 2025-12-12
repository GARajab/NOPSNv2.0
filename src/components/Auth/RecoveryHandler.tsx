import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import Spinner from '../Common/Spinner';

const RecoveryHandler: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const handleRecoveryLink = async () => {
      try {
        // Get ALL parameters from the URL for debugging
        const allParams = Object.fromEntries(searchParams.entries());
        console.log('All URL parameters:', allParams);
        
        // Supabase recovery links typically have these parameters:
        const token = searchParams.get('token'); // Try 'token' first
        const type = searchParams.get('type');
        
        console.log('Token from URL:', token);
        console.log('Type from URL:', type);
        
        if (type !== 'recovery') {
          console.error('Not a recovery link, type is:', type);
          navigate('/forgot-password?error=not_recovery_link');
          return;
        }

        if (!token) {
          // Sometimes Supabase uses '#access_token=' in the URL fragment
          // Check the hash part of the URL
          const hash = window.location.hash.substring(1);
          const hashParams = new URLSearchParams(hash);
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          
          console.log('Hash params:', hashParams.toString());
          console.log('Access token from hash:', accessToken);
          
          if (accessToken && refreshToken) {
            // Set session from hash tokens
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            
            if (error) {
              console.error('Error setting session from hash:', error);
              navigate('/forgot-password?error=invalid_session');
            } else if (data?.session) {
              navigate('/update-password?recovery=true');
            } else {
              navigate('/forgot-password?error=no_session_created');
            }
            return;
          }
          
          console.error('No token found in URL or hash');
          navigate('/forgot-password?error=missing_token');
          return;
        }

        // Try to verify the token as OTP
        console.log('Attempting to verify token as OTP...');
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: 'recovery',
        });

        console.log('Verify OTP response:', { data, error });

        if (error) {
          console.error('OTP verification failed, trying alternative method:', error);
          
          // Alternative: The token might be a direct session token
          // Try to exchange it for a session
          try {
            const response = await fetch(`https://${import.meta.env.VITE_SUPABASE_URL}/auth/v1/verify`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                token,
                type: 'recovery'
              }),
            });
            
            const verifyData = await response.json();
            console.log('Direct verify response:', verifyData);
            
            if (verifyData.access_token) {
              // Set the session
              const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
                access_token: verifyData.access_token,
                refresh_token: verifyData.refresh_token || '',
              });
              
              if (sessionError) {
                throw sessionError;
              }
              
              if (sessionData?.session) {
                navigate('/update-password?recovery=true');
                return;
              }
            }
          } catch (fetchError) {
            console.error('Direct verification also failed:', fetchError);
          }
          
          navigate('/forgot-password?error=invalid_token');
          return;
        }

        if (data?.session) {
          // Success! Redirect to password update page
          navigate('/update-password?recovery=true');
        } else {
          console.error('No session created from recovery token');
          navigate('/forgot-password?error=no_session');
        }
      } catch (err) {
        console.error('Unexpected error in recovery handler:', err);
        navigate('/forgot-password?error=unexpected');
      }
    };

    // Small delay to ensure URL is fully loaded
    setTimeout(() => {
      handleRecoveryLink();
    }, 100);
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Spinner size="lg" className="mx-auto mb-4" />
        <p className="text-gray-600">Processing password recovery link...</p>
        <p className="text-sm text-gray-500 mt-2">
          If you're not redirected automatically, please wait a moment.
        </p>
      </div>
    </div>
  );
};

export default RecoveryHandler;