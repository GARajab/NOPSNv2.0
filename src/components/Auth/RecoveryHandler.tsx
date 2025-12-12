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
        // Get the token from URL
        const token = searchParams.get('token');
        const type = searchParams.get('type');
        
        console.log('Recovery handler params:', { token, type });
        
        if (type !== 'recovery' || !token) {
          console.error('Invalid recovery link - missing token or wrong type');
          navigate('/forgot-password?error=invalid_link');
          return;
        }

        // IMPORTANT: Verify the token and get a session
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: 'recovery',
        });

        console.log('Verify OTP response:', { data, error });

        if (error) {
          console.error('Token verification failed:', error);
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
        console.error('Error in recovery handler:', err);
        navigate('/forgot-password?error=unexpected');
      }
    };

    handleRecoveryLink();
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Spinner size="lg" className="mx-auto mb-4" />
        <p className="text-gray-600">Processing password recovery link...</p>
      </div>
    </div>
  );
console.log('Full URL search params:', Object.fromEntries(searchParams.entries()));
};

export default RecoveryHandler;