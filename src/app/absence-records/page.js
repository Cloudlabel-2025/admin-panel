'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AbsenceRecordsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/absence-management');
  }, [router]);

  return null;
}
