import Link from 'next/link';

export default function Home() {
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
      <h1 className="text-4xl font-bold mb-4 text-[#603f36]">
        PDF Menu Manager
      </h1>
      <p className="text-gray-600 mb-8 max-w-md">
        Welcome to the administration portal. Please log in to manage your clients, update menus, and view analytics.
      </p>
      
      <div className="flex gap-4">
        <Link 
          href="/login" 
          className="bg-black text-white px-8 py-3 rounded-lg font-medium hover:bg-gray-800 transition shadow-lg"
        >
          Admin Login
        </Link>
      </div>

      <p className="mt-12 text-sm text-gray-400">
        © {new Date().getFullYear()} | Jayraj Rana
      </p>
    </div>
  );
}