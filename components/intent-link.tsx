'use client';

import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import { type ComponentProps, useCallback, useRef } from 'react';

type IntentLinkProps = Omit<ComponentProps<'a'>, 'href'> & {
  href?: string;
  prefetch?: boolean | null;
};

// Prefetch on mouse intent, keeping mobile navigation lightweight.
export function IntentLink({ href = '#', prefetch, onPointerEnter, ...props }: IntentLinkProps) {
  const router = useRouter();
  const warmed = useRef<string | null>(null);
  const warm = useCallback(() => {
    if (warmed.current === href || !href.startsWith('/')) return;
    warmed.current = href;
    router.prefetch(href);
  }, [href, router]);

  return (
    <NextLink
      href={href}
      prefetch={prefetch ?? false}
      onPointerEnter={(event) => {
        if (event.pointerType === 'mouse') warm();
        onPointerEnter?.(event);
      }}
      {...props}
    />
  );
}
