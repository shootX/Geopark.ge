'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';

const EXCLUDED_PATHS = ['/onboarding/vehicle', '/login', '/register'];

export function RequireVehicle({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // Don't redirect if:
    // 1. User is not authenticated
    // 2. We're on an excluded path
    // 3. User already has a vehicle (or has_vehicle is undefined — legacy users)
    if (!isAuthenticated) {
      setChecked(true);
      return;
    }

    if (EXCLUDED_PATHS.includes(pathname)) {
      setChecked(true);
      return;
    }

    // has_vehicle can be undefined for legacy users — treat as "we don't know", don't redirect
    if (user?.has_vehicle !== false) {
      setChecked(true);
      return;
    }

    // User is authenticated, not on excluded path, and has_vehicle === false → redirect
    router.replace('/onboarding/vehicle');
  }, [isAuthenticated, pathname, user?.has_vehicle, router]);

  // Show nothing until the check is complete to prevent flash
  if (!checked) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Загрузка...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
