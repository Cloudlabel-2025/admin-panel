'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AbsencePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/absence-management');
  }, [router]);

  return null;
}
