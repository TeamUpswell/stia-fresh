"use client";

import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Welcome to Stia</h1>
      
      <p className="mb-8 text-lg">
        Your intelligent assistant for managing tasks and projects.
      </p>
      
      <div className="flex gap-4">
        <Link 
          href="/auth" 
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Sign In
        </Link>
        
        <Link 
          href="/dashboard" 
          className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
