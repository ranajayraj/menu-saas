"use client";
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import QRCode from "react-qr-code";

export default function Admin() {
  const [loading, setLoading] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState(null);

  const [clientName, setClientName] = useState('');
  const [seoDesc, setSeoDesc] = useState('');
  const [pdfFile, setPdfFile] = useState(null);
  const [logoFile, setLogoFile] = useState(null);

  const handleUpload = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Create Slug
      const slug = clientName.toLowerCase().replace(/[^a-z0-9]/g, '-');

      // 2. Upload Function Helper
      const uploadFile = async (file, folder) => {
        const fileName = `${slug}-${Date.now()}-${file.name}`;
        const { data, error } = await supabase.storage
          .from('client-assets')
          .upload(fileName, file);

        if (error) throw error;

        // Get Public URL
        const { data: publicData } = supabase.storage
          .from('client-assets')
          .getPublicUrl(fileName);

        return publicData.publicUrl;
      };

      // 3. Upload Files if they exist
      let pdfUrl = '';
      let logoUrl = '';

      if (pdfFile) pdfUrl = await uploadFile(pdfFile, 'pdfs');
      if (logoFile) logoUrl = await uploadFile(logoFile, 'logos');

      // 4. Save to Database
      const { error: dbError } = await supabase
        .from('clients')
        .insert([
          {
            slug: slug,
            name: clientName,
            description: seoDesc,
            pdf_url: pdfUrl,
            logo_url: logoUrl
          }
        ]);

      if (dbError) throw dbError;

      setGeneratedUrl(`${window.location.origin}/${slug}`);
      toast.success("Client Created Successfully!");

    } catch (error) {
      console.error(error);
      toast.error(`Error: ${error.message}`);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <ToastContainer />
      <div className="max-w-2xl mx-auto bg-white p-6 rounded-xl shadow-lg">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Add New Client (Supabase)</h1>

        <form onSubmit={handleUpload} className="flex flex-col gap-4">
          <input
            placeholder="Client Name (e.g. Burger King)"
            className="border p-3 rounded bg-gray-100 text-black placeholder:text-gray-400"
            onChange={e => setClientName(e.target.value)} required
          />
          <input
            placeholder="SEO Description"
            className="border p-3 rounded bg-gray-100 text-black placeholder:text-gray-400"
            onChange={e => setSeoDesc(e.target.value)} required
          />

          <div className="border p-4 rounded bg-gray-100 text-black placeholder:text-gray-400">
            <label className="block text-sm font-bold mb-2">Upload Menu PDF</label>
            <input type="file" accept="application/pdf" onChange={e => setPdfFile(e.target.files[0])} required />
          </div>

          <div className="border p-4 rounded bg-gray-100 text-black placeholder:text-gray-400">
            <label className="block text-sm font-bold mb-2">Upload Logo (Optional)</label>
            <input type="file" accept="image/*" onChange={e => setLogoFile(e.target.files[0])} />
          </div>

          <button disabled={loading} className="bg-green-600 text-white py-3 rounded hover:bg-green-700 transition">
            {loading ? "Uploading..." : "Generate Link & QR"}
          </button>
        </form>

        {generatedUrl && (
          <div className="mt-8 text-center border-t pt-8">
            <a href={generatedUrl} target="_blank" className="text-blue-500 underline mb-4 block text-xl">{generatedUrl}</a>
            <div className="bg-white p-4 inline-block shadow-lg rounded">
              <QRCode value={generatedUrl} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}