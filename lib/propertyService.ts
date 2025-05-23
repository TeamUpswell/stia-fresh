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
  try {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .single();
    
    if (error) {
      console.error('Error fetching main property:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Exception in getMainProperty:', error);
    return null;
  }
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