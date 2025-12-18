"use client";
import { useState, useEffect, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// We wrap in Suspense because we use useSearchParams
export default function ManageClient() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ClientForm />
    </Suspense>
  );
}

function ClientForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id'); // If URL has ?id=123, we are editing

  const [loading, setLoading] = useState(false);
  
  // -- Form State --
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    keywords: '', // New
    address: '', // For Schema
    phone: '',   // For Schema
    priceRange: '₹300 - ₹2500', // For Schema
    pdfUrl: '',
    logoUrl: '',
    ogImageUrl: '' // New
  });

  const [files, setFiles] = useState({ pdf: null, logo: null, ogImage: null });

  // 1. If Editing, Fetch Existing Data
  useEffect(() => {
    if (editId) {
      const fetchData = async () => {
        const { data } = await supabase.from('clients').select('*').eq('id', editId).single();
        if (data) {
          // Extract simple fields
          setFormData({
            name: data.name,
            slug: data.slug,
            description: data.description,
            keywords: data.seo_keywords || '',
            pdfUrl: data.pdf_url,
            logoUrl: data.logo_url,
            ogImageUrl: data.og_image_url || '',
            // Extract Schema details if they exist
            address: data.json_ld?.address?.streetAddress || '',
            phone: data.json_ld?.telephone || '',
            priceRange: data.json_ld?.priceRange || '₹300 - ₹2500',
          });
        }
      };
      fetchData();
    }
  }, [editId]);

  // 2. Helper: Upload File to Supabase
  const uploadFile = async (file, folder) => {
    if (!file) return null;
    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
    const { error } = await supabase.storage.from('client-assets').upload(`${folder}/${fileName}`, file);
    if (error) throw error;
    const { data } = supabase.storage.from('client-assets').getPublicUrl(`${folder}/${fileName}`);
    return data.publicUrl;
  };

  // 3. Handle Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // A. Upload new files if selected
      const newPdfUrl = files.pdf ? await uploadFile(files.pdf, 'pdfs') : formData.pdfUrl;
      const newLogoUrl = files.logo ? await uploadFile(files.logo, 'logos') : formData.logoUrl;
      const newOgUrl = files.ogImage ? await uploadFile(files.ogImage, 'social') : formData.ogImageUrl;

      // B. Construct JSON-LD Schema Object
      const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Bakery",
        "name": formData.name,
        "image": newOgUrl,
        "description": formData.description,
        "telephone": formData.phone,
        "priceRange": formData.priceRange,
        "address": {
          "@type": "PostalAddress",
          "streetAddress": formData.address,
          "addressCountry": "IN"
        }
      };

      // C. Save to Database
      const payload = {
        name: formData.name,
        slug: formData.slug.toLowerCase().replace(/ /g, '-'), // Ensure slug format
        description: formData.description,
        seo_keywords: formData.keywords,
        pdf_url: newPdfUrl,
        logo_url: newLogoUrl,
        og_image_url: newOgUrl,
        json_ld: jsonLd // Save the JSON object directly
      };

      let error;
      if (editId) {
        // Update existing
        const res = await supabase.from('clients').update(payload).eq('id', editId);
        error = res.error;
      } else {
        // Create new
        const res = await supabase.from('clients').insert([payload]);
        error = res.error;
      }

      if (error) throw error;

      toast.success("Saved Successfully!");
      setTimeout(() => router.push('/admin'), 1500); // Go back to dashboard

    } catch (err) {
      console.error(err);
      toast.error("Error saving: " + err.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <ToastContainer />
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow">
        <h1 className="text-2xl font-bold mb-6">{editId ? 'Edit Client' : 'Add New Client'}</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Section 1: Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-1">Client Name</label>
              <input required className="w-full border p-2 rounded" 
                value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">Slug (URL ID)</label>
              <input required className="w-full border p-2 rounded" placeholder="e.g. sweet-tooth"
                value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} />
            </div>
          </div>

          {/* Section 2: Files */}
          <div className="bg-blue-50 p-4 rounded border border-blue-100 space-y-4">
            <h3 className="font-bold text-blue-800">Files</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold mb-1">Menu PDF</label>
                <input type="file" accept="application/pdf" className="text-sm"
                  onChange={e => setFiles({...files, pdf: e.target.files[0]})} />
                {formData.pdfUrl && <span className="text-xs text-green-600 block mt-1">✓ Current PDF Loaded</span>}
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Logo (PNG)</label>
                <input type="file" accept="image/*" className="text-sm"
                  onChange={e => setFiles({...files, logo: e.target.files[0]})} />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Social Share Image (1200x630)</label>
                <input type="file" accept="image/*" className="text-sm"
                  onChange={e => setFiles({...files, ogImage: e.target.files[0]})} />
                 {formData.ogImageUrl && <span className="text-xs text-green-600 block mt-1">✓ Current Image Loaded</span>}
              </div>
            </div>
          </div>

          {/* Section 3: Advanced SEO */}
          <div className="space-y-3">
             <h3 className="font-bold border-b pb-1">SEO Details</h3>
             <div>
                <label className="block text-sm font-bold mb-1">SEO Description</label>
                <textarea required className="w-full border p-2 rounded h-20"
                  value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
             </div>
             <div>
                <label className="block text-sm font-bold mb-1">Keywords (Comma separated)</label>
                <input className="w-full border p-2 rounded" placeholder="cakes, bakery, surat..."
                  value={formData.keywords} onChange={e => setFormData({...formData, keywords: e.target.value})} />
             </div>
          </div>

          {/* Section 4: Schema Generator (Business Info) */}
          <div className="bg-gray-50 p-4 rounded border space-y-3">
             <h3 className="font-bold border-b pb-1 text-gray-700">Business Schema (For Google)</h3>
             <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="block text-xs font-bold mb-1">Phone Number</label>
                  <input className="w-full border p-2 rounded" placeholder="+91..."
                    value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
               </div>
               <div>
                  <label className="block text-xs font-bold mb-1">Price Range</label>
                  <input className="w-full border p-2 rounded" placeholder="₹300 - ₹2000"
                    value={formData.priceRange} onChange={e => setFormData({...formData, priceRange: e.target.value})} />
               </div>
               <div className="col-span-2">
                  <label className="block text-xs font-bold mb-1">Full Address</label>
                  <input className="w-full border p-2 rounded" placeholder="Shop 4, SNS Atria..."
                    value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
               </div>
             </div>
          </div>

          <button disabled={loading} className="w-full bg-black text-white py-4 rounded font-bold text-lg hover:bg-gray-800">
            {loading ? "Saving..." : (editId ? "Update Client" : "Create Client")}
          </button>
        </form>
      </div>
    </div>
  );
}