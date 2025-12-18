"use client";
import { useState, useEffect, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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
  const editId = searchParams.get('id');

  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    seoTitle: '', // <--- 1. NEW STATE
    description: '',
    keywords: '',
    address: '',
    phone: '',
    priceRange: '₹300 - ₹2500',
    pdfUrl: '',
    logoUrl: '',
    ogImageUrl: '',
    faviconUrl: ''
  });

  const [files, setFiles] = useState({ 
    pdf: null, 
    logo: null, 
    ogImage: null, 
    favicon: null 
  });

  // 1. Fetch Existing Data
  useEffect(() => {
    if (editId) {
      const fetchData = async () => {
        const { data } = await supabase.from('clients').select('*').eq('id', editId).single();
        if (data) {
          setFormData({
            name: data.name,
            slug: data.slug,
            seoTitle: data.seo_title || '', // <--- 2. FETCH IT
            description: data.description,
            keywords: data.seo_keywords || '',
            pdfUrl: data.pdf_url,
            logoUrl: data.logo_url,
            ogImageUrl: data.og_image_url || '',
            faviconUrl: data.favicon_url || '',
            address: data.json_ld?.address?.streetAddress || '',
            phone: data.json_ld?.telephone || '',
            priceRange: data.json_ld?.priceRange || '₹300 - ₹2500',
          });
        }
      };
      fetchData();
    }
  }, [editId]);

  // HELPER: Extract path from URL
  const extractFilePath = (url) => {
    if (!url) return null;
    const parts = url.split('/client-assets/');
    return parts.length > 1 ? parts[1] : null;
  };

  // HELPER: Delete old file from Storage
  const deleteOldFile = async (fullUrl) => {
    const path = extractFilePath(fullUrl);
    if (path) {
      console.log("Deleting old file:", path);
      await supabase.storage.from('client-assets').remove([path]);
    }
  };

  // 2. Upload Helper
  const uploadFile = async (file, folder) => {
    if (!file) return null;
    const cleanName = file.name.replace(/[^a-zA-Z0-9.]/g, '');
    const fileName = `${Date.now()}-${cleanName}`;
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
      // CHECK & DELETE OLD FILES BEFORE UPLOADING NEW ONES
      let finalPdfUrl = formData.pdfUrl;
      if (files.pdf) {
        if (formData.pdfUrl) await deleteOldFile(formData.pdfUrl);
        finalPdfUrl = await uploadFile(files.pdf, 'pdfs');
      }

      let finalLogoUrl = formData.logoUrl;
      if (files.logo) {
        if (formData.logoUrl) await deleteOldFile(formData.logoUrl);
        finalLogoUrl = await uploadFile(files.logo, 'logos');
      }

      let finalOgUrl = formData.ogImageUrl;
      if (files.ogImage) {
        if (formData.ogImageUrl) await deleteOldFile(formData.ogImageUrl);
        finalOgUrl = await uploadFile(files.ogImage, 'social');
      }

      let finalFaviconUrl = formData.faviconUrl;
      if (files.favicon) {
        if (formData.faviconUrl) await deleteOldFile(formData.faviconUrl);
        finalFaviconUrl = await uploadFile(files.favicon, 'favicons');
      }

      const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Bakery",
        "name": formData.name,
        "image": finalOgUrl,
        "description": formData.description,
        "telephone": formData.phone,
        "priceRange": formData.priceRange,
        "address": {
          "@type": "PostalAddress",
          "streetAddress": formData.address,
          "addressCountry": "IN"
        }
      };

      // Payload
      const payload = {
        name: formData.name,
        slug: formData.slug.toLowerCase().replace(/ /g, '-'),
        seo_title: formData.seoTitle, // <--- 3. SAVE IT
        description: formData.description,
        seo_keywords: formData.keywords,
        pdf_url: finalPdfUrl,
        logo_url: finalLogoUrl,
        og_image_url: finalOgUrl,
        favicon_url: finalFaviconUrl,
        json_ld: jsonLd
      };

      let error;
      if (editId) {
        const res = await supabase.from('clients').update(payload).eq('id', editId);
        error = res.error;
      } else {
        const res = await supabase.from('clients').insert([payload]);
        error = res.error;
      }

      if (error) throw error;

      toast.success("Saved Successfully!");
      setTimeout(() => router.push('/admin'), 1500);

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
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-bold mb-1">Menu PDF</label>
                <input type="file" accept="application/pdf" className="text-sm w-full border p-2 bg-white rounded"
                  onChange={e => setFiles({...files, pdf: e.target.files[0]})} />
                {formData.pdfUrl && <span className="text-xs text-green-600 block mt-1">✓ Current PDF Loaded</span>}
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">Logo (PNG)</label>
                <input type="file" accept="image/*" className="text-sm w-full border p-2 bg-white rounded"
                  onChange={e => setFiles({...files, logo: e.target.files[0]})} />
                  {formData.logoUrl && <span className="text-xs text-green-600 block mt-1">✓ Current Logo Loaded</span>}
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">Favicon (Square PNG/ICO)</label>
                <input type="file" accept="image/*" className="text-sm w-full border p-2 bg-white rounded"
                  onChange={e => setFiles({...files, favicon: e.target.files[0]})} />
                 {formData.faviconUrl && <span className="text-xs text-green-600 block mt-1">✓ Current Favicon Loaded</span>}
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-bold mb-1">Social Share Image (1200x630)</label>
                <input type="file" accept="image/*" className="text-sm w-full border p-2 bg-white rounded"
                  onChange={e => setFiles({...files, ogImage: e.target.files[0]})} />
                 {formData.ogImageUrl && <span className="text-xs text-green-600 block mt-1">✓ Current Image Loaded</span>}
              </div>
            </div>
          </div>

          {/* Section 3: Advanced SEO */}
          <div className="space-y-3">
             <h3 className="font-bold border-b pb-1">SEO Details</h3>
             
             {/* --- 4. NEW INPUT FIELD --- */}
             <div>
                <label className="block text-sm font-bold mb-1">SEO Page Title (Browser Tab)</label>
                <input className="w-full border p-2 rounded" placeholder="e.g. Best Cakes in Surat | Sweet Tooth"
                  value={formData.seoTitle} onChange={e => setFormData({...formData, seoTitle: e.target.value})} />
             </div>
             {/* ------------------------- */}

             <div>
                <label className="block text-sm font-bold mb-1">SEO Description</label>
                <textarea required className="w-full border p-2 rounded h-20"
                  value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
             </div>
             <div>
                <label className="block text-sm font-bold mb-1">Keywords</label>
                <input className="w-full border p-2 rounded" placeholder="cakes, bakery, surat..."
                  value={formData.keywords} onChange={e => setFormData({...formData, keywords: e.target.value})} />
             </div>
          </div>

          {/* Section 4: Schema Generator */}
          <div className="bg-gray-50 p-4 rounded border space-y-3">
             <h3 className="font-bold border-b pb-1 text-gray-700">Business Schema</h3>
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