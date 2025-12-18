import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  const { slug } = await params;

  // 1. Find the Client in Database
  const { data } = await supabase
    .from('clients')
    .select('pdf_url')
    .eq('slug', slug)
    .single();

  if (!data || !data.pdf_url) {
    return new NextResponse('PDF Not Found', { status: 404 });
  }

  // 2. Fetch the file from Supabase (Server-side)
  const fileResponse = await fetch(data.pdf_url);

  if (!fileResponse.ok) {
    return new NextResponse('Error fetching PDF', { status: 500 });
  }

  // 3. Serve it as if it came from YOUR website
  const blob = await fileResponse.blob();
  
  return new NextResponse(blob, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename="menu.pdf"', // 'inline' opens in browser, 'attachment' downloads it
      'Cache-Control': 'public, max-age=3600' // Cache for 1 hour to make it fast
    },
  });
}