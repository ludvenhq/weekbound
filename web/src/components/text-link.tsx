import { Link } from '@chakra-ui/react';
import NextLink from 'next/link';
import type { ReactNode } from 'react';

// Underlined at 4px with a faint line that turns solid on hover (DESIGN.md, Components).
export function TextLink({
  href,
  external,
  children,
}: {
  href: string;
  external?: boolean;
  children: ReactNode;
}) {
  const style = {
    color: 'inherit',
    textDecoration: 'underline',
    textUnderlineOffset: '4px',
    textDecorationColor: 'lineStrong',
    _hover: { textDecorationColor: 'text' },
    _focusVisible: { outline: '2px solid {colors.text}', outlineOffset: '3px' },
  } as const;
  if (external) {
    return (
      <Link href={href} target="_blank" rel="noopener noreferrer" {...style}>
        {children}
      </Link>
    );
  }
  return (
    <Link asChild {...style}>
      <NextLink href={href}>{children}</NextLink>
    </Link>
  );
}
