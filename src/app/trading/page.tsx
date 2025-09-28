'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TradingPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to bot-trading page
    router.replace('/bot-trading');
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400 mx-auto mb-4"></div>
        <p className="text-gray-400">Redirecting to Bot Trading...</p>
      </div>
    </div>
  );
}
