"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import QRCode from "react-qr-code";

export default function AdminDashboard() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qrClient, setQrClient] = useState(null); // State to show QR Modal
  const router = useRouter();

  // 1. Check Login & Fetch Data
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) router.push('/login');
    };
    
    const fetchClients = async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) console.error(error);
      setClients(data || []);
      setLoading(false);
    };

    checkUser();
    fetchClients();
  }, []);

  // 2. Delete Client
  const handleDelete = async (id) => {
    if(!confirm("Are you sure? This will delete the menu link forever!")) return;
    
    const { error } = await supabase.from('clients').delete().eq('id', id);
    if (!error) {
       setClients(clients.filter(c => c.id !== id)); // Remove from UI instantly
    }
  };

  if (loading) return <div className="p-10 text-center text-gray-500">Loading Dashboard...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
          <div className="flex gap-4">
             <Link href="/admin/manage" className="bg-green-600 text-white px-6 py-2 rounded shadow hover:bg-green-700 font-bold transition">
               + Add New Client
             </Link>
             <button onClick={async () => { await supabase.auth.signOut(); router.push('/login'); }} className="text-red-500 hover:text-red-700 underline font-medium">
               Logout
             </button>
          </div>
        </div>

        {/* Client Table */}
        <div className="bg-white rounded-xl shadow overflow-hidden border border-gray-100">
          <table className="w-full text-left">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="p-4 font-bold text-gray-600">Client Name</th>
                <th className="p-4 font-bold text-gray-600">Link Slug</th>
                <th className="p-4 font-bold text-gray-600 text-center">QR Code</th>
                <th className="p-4 font-bold text-gray-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.id} className="border-b hover:bg-gray-50 transition">
                  <td className="p-4 font-medium text-gray-800">{client.name}</td>
                  <td className="p-4 text-gray-500 font-mono text-sm">/{client.slug}</td>
                  
                  {/* QR Button */}
                  <td className="p-4 text-center">
                    <button 
                      onClick={() => setQrClient(client)}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm font-bold"
                    >
                      Show QR
                    </button>
                  </td>

                  {/* Actions */}
                  <td className="p-4 text-right space-x-4">
                    <a href={`/${client.slug}`} target="_blank" className="text-blue-600 hover:underline text-sm">
                       View Page
                    </a>
                    <Link href={`/admin/manage?id=${client.id}`} className="text-green-600 hover:underline font-bold text-sm">
                      Edit
                    </Link>
                    <button onClick={() => handleDelete(client.id)} className="text-red-600 hover:underline text-sm">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              
              {clients.length === 0 && (
                <tr>
                   <td colSpan="4" className="p-10 text-center text-gray-400">
                     No clients found. Click "Add New Client" to start.
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* QR Code Modal (Popup) */}
      {qrClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-xl shadow-2xl max-w-sm w-full text-center relative">
            <button 
              onClick={() => setQrClient(null)}
              className="absolute top-3 right-4 text-gray-400 hover:text-black text-2xl font-bold"
            >
              &times;
            </button>
            
            <h3 className="text-xl font-bold mb-2">{qrClient.name}</h3>
            <p className="text-sm text-gray-500 mb-6">Scan to view menu</p>
            
            <div className="bg-white p-2 inline-block border-2 border-gray-100 rounded mb-4">
              <QRCode value={`${window.location.origin}/${qrClient.slug}`} />
            </div>

            <p className="text-xs text-blue-500 break-all bg-blue-50 p-2 rounded">
              {`${window.location.origin}/${qrClient.slug}`}
            </p>
            
            <div className="mt-6">
                <button 
                  onClick={() => window.print()} 
                  className="bg-black text-white px-4 py-2 rounded text-sm hover:bg-gray-800 w-full"
                >
                  Print / Save PDF
                </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}