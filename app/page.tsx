'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('userToken');
    if (token) {
      router.replace('/predictions');
    } else {
      router.replace('/join');
    }
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="text-5xl mb-4">⚽</div>
        <p className="text-gray-500">Cargando...</p>
      </div>
    </div>
  );
}
