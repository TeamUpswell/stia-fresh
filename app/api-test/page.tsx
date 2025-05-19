"use client";

import { useState } from 'react';
import Image from 'next/image';

export default function ApiTestPage() {
  const [placeId, setPlaceId] = useState('ChIJN1t_tDeuEmsRUsoyG83frY4'); // Example Google HQ place ID
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  
  const testApi = async () => {
    setLoading(true);
    setError(null);
    setResults(null);
    setPhotoUrl(null);
    
    try {
      // Test our API endpoint
      const response = await fetch(`/api/places/${placeId}`);
      const data = await response.json();
      setResults(data);
      
      if (data.photoUrl) {
        setPhotoUrl(data.photoUrl);
      } else if (data.error) {
        setError(data.error);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Google Places API Test</h1>
      
      <div className="mb-6">
        <label className="block mb-2">Place ID:</label>
        <div className="flex">
          <input 
            type="text"
            value={placeId}
            onChange={(e) => setPlaceId(e.target.value)}
            className="border rounded-md py-2 px-3 flex-1"
            placeholder="Enter Place ID"
          />
          <button 
            onClick={testApi}
            className="ml-4 bg-blue-500 text-white px-4 py-2 rounded-md"
            disabled={loading}
          >
            {loading ? 'Testing...' : 'Test API'}
          </button>
        </div>
        <p className="mt-2 text-sm text-gray-500">
          Example: ChIJN1t_tDeuEmsRUsoyG83frY4 (Google HQ)
        </p>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-md mb-6">
          <h2 className="font-bold text-red-800">Error</h2>
          <p className="text-red-700">{error}</p>
        </div>
      )}
      
      {results && (
        <div className="bg-gray-50 border border-gray-200 p-4 rounded-md mb-6">
          <h2 className="font-bold mb-2">API Response:</h2>
          <pre className="bg-gray-100 p-3 rounded overflow-auto max-h-60">
            {JSON.stringify(results, null, 2)}
          </pre>
        </div>
      )}
      
      {photoUrl && (
        <div>
          <h2 className="font-bold mb-2">Image Preview:</h2>
          <Image 
            src={photoUrl}
            alt="Place"
            width={600}
            height={400}
            unoptimized
            className="max-w-full h-auto max-h-96 border rounded-md"
            style={{ objectFit: 'contain' }}
          />
        </div>
      )}
    </div>
  );
}