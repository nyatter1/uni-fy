import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';

export function SupabaseStatus() {
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');

  useEffect(() => {
    // Check initial connection
    const checkConnection = async () => {
      try {
        const { error } = await supabase.from('users').select('count', { count: 'exact', head: true }).limit(1);
        if (error) throw error;
        setStatus('connected');
      } catch (err) {
        console.error('Supabase connection error:', err);
        setStatus('disconnected');
      }
    };

    checkConnection();

    // Listen for realtime connection events if possible
    // Supabase JS doesn't have a direct "onStatusChange" for the whole client, 
    // but we can infer from channel subscriptions.
    const channel = supabase.channel('system-status')
      .on('system', { event: '*' }, (payload) => {
        console.log('System event:', payload);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setStatus('connected');
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setStatus('disconnected');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-[1000] flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-[10px] font-black uppercase tracking-widest transition-all">
      {status === 'connecting' && (
        <>
          <Loader2 size={12} className="animate-spin text-zinc-500" />
          <span className="text-zinc-500">Connecting...</span>
        </>
      )}
      {status === 'connected' && (
        <>
          <Wifi size={12} className="text-green-500" />
          <span className="text-green-500">Realtime Active</span>
        </>
      )}
      {status === 'disconnected' && (
        <>
          <WifiOff size={12} className="text-red-500" />
          <span className="text-red-500">Realtime Offline</span>
        </>
      )}
    </div>
  );
}
