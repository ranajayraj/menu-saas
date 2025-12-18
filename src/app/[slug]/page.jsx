import { supabase } from '@/lib/supabase';
import Link from 'next/link';

// 1. Fetch Helper (This part is PERFECT)
async function getClientData(slug) {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('slug', slug)
    .limit(1)        
    .maybeSingle();  

  if (error) console.log("Supabase Error:", error);
  return data;
}

// 2. SEO
export async function generateMetadata({ params }) {
  const { slug } = await params; // <--- NEW: You must await params in Next.js 15
  
  const data = await getClientData(slug);
  if (!data) return { title: 'Not Found' };

  return {
    title: `${data.name} - View Menu`,
    description: data.description,
  };
}

// 3. Page
export default async function ClientMenuPage({ params }) {
  const { slug } = await params; // <--- NEW: You must await params here too
  
  const data = await getClientData(slug);

  if (!data) {
    return <div className="p-10 text-center text-red-500">Client not found in database.</div>;
  }

  return (
    <div className="bg-[#f2f2f2] h-screen flex flex-col items-center justify-center gap-8 px-6 py-3">

      {/* Logic to show Logo OR Name if logo is missing */}
      {data.logo_url ? (
        <img className="w-full max-w-64 object-contain" src={data.logo_url} alt="Logo" />
      ) : (
        <h1 className="text-4xl font-bold text-[#603f36]">{data.name}</h1>
      )}

      <Link
        href={data.pdf_url}
        target="_blank"
        className="bg-[#603f36] hover:bg-[#603f36]/90 text-white duration-300 text-lg font-bold px-8 py-4 text-center rounded shadow-lg uppercase"
      >
        View Our Menu
      </Link>
    </div>
  );
}