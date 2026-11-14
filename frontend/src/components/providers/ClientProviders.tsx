'use client';

import React from 'react';
import { XenonProvider, ToastProvider } from '@xenon-kit/web';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <XenonProvider defaultTheme="dark" defaultAccent="lime" defaultRadius={5}>
      {/* @ts-expect-error Xenon ToastProvider typings omit children in d.ts but implementation wraps them */}
      <ToastProvider placement="bottom-center" maxToasts={5}>
        {children}
      </ToastProvider>
    </XenonProvider>
  );
}
