import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import Link from 'next/link';

// 1. Fetch Helper
async function getClientData(slug) {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('slug', slug)
    .limit(1)
    .maybeSingle();
  return data;
}

// 2. SEO Generation (The "Head" part)
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const data = await getClientData(slug);

  if (!data) return { title: 'Not Found' };

  return {
    title: `${data.name} | View Menu`,
    description: data.description,
    keywords: data.seo_keywords, // Uses the new column
    icons: {
      icon: data.favicon_url || '/favicon.ico', // <--- Uses Client Favicon or Default
      shortcut: data.favicon_url || '/favicon.ico',
      apple: data.favicon_url || '/apple-icon.png', // Fallback if no specific apple icon
    },
    openGraph: {
      title: data.name,
      description: data.description,
      images: [data.og_image_url || data.logo_url], // Uses the social image
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: data.name,
      description: data.description,
      images: [data.og_image_url || data.logo_url],
    },
  };
}

// 3. The Page Body
export default async function ClientMenuPage({ params }) {
  const { slug } = await params;
  const data = await getClientData(slug);

  if (!data) return <div className="p-10 text-center">Client Not Found</div>;

  return (
    <>
      {/* 4. Inject JSON-LD Schema Script */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(data.json_ld) }}
      />

      <div className="bg-[#f2f2f2] min-h-screen flex flex-col items-center justify-center gap-8 px-6 py-3">

        {/* Dynamic Logo */}
        {data.logo_url ? (
          <Image
            className="w-full max-w-64 object-contain"
            src={data.logo_url}
            alt={`${data.name} Logo`}
            width={200}
            height={200}
            priority
            unoptimized
          />
        ) : (
          <h1 className="text-4xl font-bold text-[#603f36]">{data.name}</h1>
        )}

        {/* Dynamic PDF Link */}
        <Link
          href={data.pdf_url}
          target="_blank"
          className="bg-[#603f36] hover:bg-[#603f36]/90 text-white duration-300 text-lg font-bold px-8 py-4 text-center rounded shadow-lg uppercase tracking-wide"
        >
          View Our Menu
        </Link>

        <p className="text-gray-400 text-xs mt-10">Powered by Jayraj Rana</p>
      </div>
    </>
  );
}