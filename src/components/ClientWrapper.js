"use client";
import dynamic from 'next/dynamic';
import ErrorBoundary from './ErrorBoundary';
import LoadingScreen from './LoadingScreen';

// Dynamic import untuk menghindari masalah SSR
const PoliceFloorMap = dynamic(() => import('./PoliceFloorMap'), {
  ssr: false,
  loading: () => <LoadingScreen message="Memuat Peta Lantai..." />
});

export default function ClientWrapper() {
  return (
    <ErrorBoundary>
      <PoliceFloorMap />
    </ErrorBoundary>
  );
}