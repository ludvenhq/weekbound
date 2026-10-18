'use client';

import { Link } from '@chakra-ui/react';
import NextLink from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

export function NavLink({ href, children }: { href: string; children: ReactNode }) {
  const path = usePathname();
  // A road's page sits under the roads.
  const here = path === href || path.startsWith(`${href}/`);
  return (
    <Link
      asChild
      color={here ? 'text' : 'textMuted'}
      textDecoration="none"
      _hover={{ color: 'text', textDecoration: 'none' }}
      _focusVisible={{ outline: '2px solid {colors.text}', outlineOffset: '3px' }}
    >
      <NextLink href={href} aria-current={here ? 'page' : undefined}>
        {children}
      </NextLink>
    </Link>
  );
}
