'use client';

import React, { useCallback, useEffect } from 'react';
import NextLink from 'next/link';
import { useParams as useNextParams, usePathname, useRouter } from 'next/navigation';

export function Link({ to, href, children, replace: _replace, state: _state, ...props }) {
  const destination = href || to || '#';
  return (
    <NextLink href={destination} {...props}>
      {children}
    </NextLink>
  );
}

export function useNavigate() {
  const router = useRouter();

  return useCallback((to, options = {}) => {
    if (typeof to === 'number') {
      if (to < 0) router.back();
      return;
    }

    if (options?.replace) {
      router.replace(to);
    } else {
      router.push(to);
    }
  }, [router]);
}

export function useParams() {
  return useNextParams();
}

export function useLocation() {
  const pathname = usePathname() || '/';
  return { pathname };
}

export function Navigate({ to, replace = false }) {
  const router = useRouter();

  useEffect(() => {
    if (replace) router.replace(to);
    else router.push(to);
  }, [to, replace, router]);

  return null;
}
