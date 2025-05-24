import { supabase } from './supabase';
import { PropertyFormData } from '../types';

// Get property by ID (tenant-aware)
export async function getPropertyById(id: string, tenantId?: string) {
  let query = supabase
    .from('properties')
    .select('*')
    .eq('id', id);
    
  if (tenantId) {
    query = query.eq('tenant_id', tenantId);
  }
    
  const { data, error } = await query.single();
  if (error) throw error;
  return data;
}

// Get main property for current tenant
export async function getMainProperty(tenantId: string) {
  try {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('tenant_id', tenantId)
      .limit(1)
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

// Get all properties for a tenant
export async function getPropertiesForTenant(tenantId: string) {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });
    
  if (error) throw error;
  return data;
}

// Update property (tenant-aware)
export async function updateProperty(id: string, propertyData: Partial<PropertyFormData>, tenantId?: string) {
  let query = supabase
    .from('properties')
    .update({
      ...propertyData,
      updated_at: new Date().toISOString()
    })
    .eq('id', id);
    
  if (tenantId) {
    query = query.eq('tenant_id', tenantId);
  }
    
  const { data, error } = await query.select();
  if (error) throw error;
  return data;
}

// Create property (requires tenant_id)
export async function createProperty(propertyData: Partial<PropertyFormData>, tenantId: string, userId: string) {
  const { data, error } = await supabase
    .from('properties')
    .insert([{
      ...propertyData,
      tenant_id: tenantId,
      created_by: userId,
    }])
    .select();
    
  if (error) throw error;
  return data;
}