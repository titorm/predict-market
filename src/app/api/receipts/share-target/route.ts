import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const url = formData.get('url')?.toString() ?? '';
    const text = formData.get('text')?.toString() ?? '';
    const title = formData.get('title')?.toString() ?? '';

    const rawInput = url || text || title;
    const redirectUrl = new URL('/scanner', req.url);

    if (rawInput) {
      redirectUrl.searchParams.set('sharedInput', rawInput);
    }

    return NextResponse.redirect(redirectUrl, { status: 303 });
  } catch {
    return NextResponse.redirect(new URL('/scanner', req.url), { status: 303 });
  }
}
