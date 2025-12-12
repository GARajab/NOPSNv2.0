import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import Spinner from '../Common/Spinner';

const RecoveryHandler: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const handleRecovery = async () => {
      const type = searchParams.get('type');
      const access_token = searchParams.get('access_token');
      
      if (type === 'recovery' && access_token) {
        // Set the session from the token
        const { data, error } = await supabase.auth.setSession({
          access_token,
          refresh_token: '',
        });
        
        if (!error && data.session) {
          // Redirect to password update page
          navigate('/update-password?recovery=true');
        } else {
          navigate('/forgot-password?error=invalid_token');
        }
      } else {
        navigate('/login');
      }
    };

    handleRecovery();
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Spinner size="lg" />
      <p className="ml-3">Processing recovery link...</p>
    </div>
  );
};

export default RecoveryHandler;