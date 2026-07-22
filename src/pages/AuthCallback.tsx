import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase/client';
import { unlockReport, trackEvent } from '../lib/api';
import { Loader2 } from 'lucide-react';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    const processAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        const auditId = searchParams.get('auditId');

        if (session?.user?.email && auditId) {
          const email = session.user.email;
          await unlockReport(auditId, email);
          trackEvent(auditId, 'email_unlocked', { email, method: 'google' });
          if (mounted) navigate(`/report/${auditId}`, { replace: true });
        } else {
          if (mounted) navigate('/', { replace: true });
        }
      } catch (err: any) {
        console.error(err);
        if (mounted) setError(err.message || 'Failed to authenticate');
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        processAuth();
      }
    });

    processAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, searchParams]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 flex-col gap-4">
        <p className="text-error-500">{error}</p>
        <button onClick={() => navigate('/')} className="btn-secondary">Go Home</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
        <p className="text-neutral-500">Unlocking your report...</p>
      </div>
    </div>
  );
}
