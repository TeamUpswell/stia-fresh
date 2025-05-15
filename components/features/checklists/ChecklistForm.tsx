import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';

interface ChecklistFormProps {
  onClose: () => void;
  onSaved: () => void;
}

export default function ChecklistForm({ onClose, onSaved }: ChecklistFormProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    property_id: 'default' // You might want to make this dynamic if you have multiple properties
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('checklists')
        .insert([
          {
            title: formData.title,
            description: formData.description,
            property_id: formData.property_id,
            created_by: user.id
          }
        ]);
        
      if (error) throw error;
      onSaved();
    } catch (error) {
      console.error('Error creating checklist:', error);
      alert('Failed to create checklist. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold">Create New Checklist</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4">
          <div className="mb-4">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Checklist title"
              required
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Describe the purpose of this checklist"
              rows={3}
            />
          </div>
          
          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Checklist'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}