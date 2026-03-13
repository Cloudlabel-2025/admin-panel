'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TeamAbsencePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/absence-management');
  }, [router]);

  return null;
}
