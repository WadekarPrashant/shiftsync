import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  const redirectTo = NextResponse.redirect(`${origin}/dashboard`)

  if (code) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              redirectTo.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    try {
      const { data: { user } } = await supabase.auth.exchangeCodeForSession(code)

      if (user) {
        await prisma.profile.upsert({
          where: { id: user.id },
          update: { email: user.email! },
          create: {
            id: user.id,
            email: user.email!,
            fullName: user.user_metadata?.full_name ?? null,
          },
        })
      }
    } catch (err) {
      console.error('Auth callback error:', err)
    }
  }

  return redirectTo
}
