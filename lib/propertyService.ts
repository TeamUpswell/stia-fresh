import { supabase } from './supabase';
import { PropertyFormData } from '../types';

// Get property by ID
export async function getPropertyById(id: string) {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('id', id)
    .single();
    
  if (error) throw error;
  return data;
}

// Get main property (for sites with just one property)
export async function getMainProperty() {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('is_active', true) // ✓ Confirmed column exists in schema
    .order('created_at', { ascending: true })
    .limit(1)
    .single();
    
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

// Update property
export async function updateProperty(id: string, propertyData: Partial<PropertyFormData>) {
  const { data, error } = await supabase
    .from('properties')
    .update({
      ...propertyData,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select();
    
  if (error) throw error;
  return data;
}

// Create property
export async function createProperty(propertyData: Partial<PropertyFormData>) {
  const { data, error } = await supabase
    .from('properties')
    .insert([{
      ...propertyData,
      owner_id: supabase.auth.getUser().then(res => res.data.user?.id)
    }])
    .select();
    
  if (error) throw error;
  return data;
}