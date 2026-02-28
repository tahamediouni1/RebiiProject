'use client';

import { useEffect } from 'react';
import { setCookie } from 'cookies-next/client';
import { useRouter } from 'next/navigation';
import { serializeSessionUserCookie, normalizeRole } from '@/lib/auth-role';

type SearchParams = Record<string, string | string[] | undefined>;

const parseBoolean = (value: string | undefined): boolean =>
  value === 'true' || value === '1';

const firstValue = (value: string | string[] | undefined): string | undefined =>
  Array.isArray(value) ? value[0] : value;

const parseUserParam = (
  userParam: string | undefined
): { id?: string; role?: string; isAdmin?: boolean } | undefined => {
  if (!userParam) return undefined;

  try {
    return JSON.parse(userParam) as {
      id?: string;
      role?: string;
      isAdmin?: boolean;
    };
  } catch {
    return undefined;
  }
};

export default function OAuthCallbackClient({
  lang,
  searchParams,
}: {
  lang: string;
  searchParams: SearchParams;
}) {
  const router = useRouter();

  useEffect(() => {
    const accessToken = firstValue(searchParams.accessToken);
    const refreshToken = firstValue(searchParams.refreshToken) ?? '';
    const accessTokenExpiresAt =
      firstValue(searchParams.accessTokenExpiresAt) ??
      firstValue(searchParams.expiresAt) ??
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    if (!accessToken) {
      router.replace(`/${lang}/login`);
      return;
    }

    const parsedUser = parseUserParam(firstValue(searchParams.user));
    const userId =
      firstValue(searchParams.userId) ??
      firstValue(searchParams.id) ??
      parsedUser?.id;

    if (!userId) {
      router.replace(`/${lang}/login`);
      return;
    }

    const role = normalizeRole(
      firstValue(searchParams.role) ?? parsedUser?.role,
      parseBoolean(firstValue(searchParams.isAdmin)) || parsedUser?.isAdmin === true
    );

    const expiresAtMs = new Date(accessTokenExpiresAt).getTime();
    const maxAge =
      Number.isFinite(expiresAtMs) && expiresAtMs > Date.now()
        ? Math.floor((expiresAtMs - Date.now()) / 1000)
        : 7 * 24 * 60 * 60;

    setCookie(
      'token',
      JSON.stringify({
        token: accessToken,
        refreshToken,
        expires_at: accessTokenExpiresAt,
        expires_at_ts: expiresAtMs,
      }),
      {
        path: '/',
        maxAge,
        sameSite: 'lax',
      }
    );

    setCookie(
      'user',
      serializeSessionUserCookie({
        userId,
        role,
        isAdmin: role === 'admin',
      }),
      {
        path: '/',
        maxAge,
        sameSite: 'lax',
      }
    );

    router.replace(role === 'admin' ? `/${lang}/admin` : `/${lang}`);
  }, [lang, router, searchParams]);

  return (
    <main className="bg-muted/30 flex min-h-[calc(100vh-var(--header-footer-height))] items-center justify-center py-8">
      <div className="text-muted-foreground text-sm">Authenticating...</div>
    </main>
  );
}
