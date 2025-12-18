import { supabase } from '@/lib/supabase';

// 1. Fetch Helper (Same as your main page)
async function getClientData(slug) {
  const { data } = await supabase
    .from('clients')
    .select('*')
    .eq('slug', slug)
    .limit(1)
    .maybeSingle();
  return data;
}

// 2. SEO Generation (COPIED EXACTLY FROM YOUR MAIN PAGE)
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const data = await getClientData(slug);

  if (!data) return { title: 'Not Found' };

  // Use the uploaded URL or fallback to a default image
  const iconUrl = data.favicon_url || '/logo.png';

  return {
    title: data.seo_title || `${data.name}`,
    description: data.description,
    keywords: data.seo_keywords,

    // ⬇️ EXACT SAME ICON LOGIC
    icons: {
      icon: [
        { url: iconUrl, sizes: '32x32', type: 'image/png' },
        { url: iconUrl, sizes: '192x192', type: 'image/png' },
        { url: iconUrl, sizes: '512x512', type: 'image/png' },
      ],
      shortcut: [
        { url: iconUrl }
      ],
      apple: [
        { url: iconUrl, sizes: '180x180', type: 'image/png' },
      ],
    },
    // ⬆️ END ICON LOGIC

    openGraph: {
      title: data.seo_title || data.name,
      description: data.description,
      images: [data.og_image_url || data.logo_url], // Shows big image on WhatsApp
      type: 'website',
    },
  };
}

// 3. The Page Body
export default async function PDFWrapperPage({ params }) {
  const { slug } = await params;
  const data = await getClientData(slug);

  if (!data || !data.pdf_url) {
    return <div className="text-center p-10 font-sans">Menu PDF not found in database.</div>;
  }

  return (
    <>
      {/* 4. Inject JSON-LD Schema (So Google knows this PDF belongs to the Business) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(data.json_ld) }}
      />

      <div className="h-screen w-screen bg-gray-100 flex flex-col overflow-hidden">
        {/* The PDF Viewer */}
        <iframe
          src={data.pdf_url}
          className="w-full h-full border-none"
          title={`${data.name} Menu`}
        />
      </div>
    </>
  );
}