"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Plus, Check, X, Trash2, MoveUp, MoveDown, Reorder } from "lucide-react";
import PermissionGate from "@/components/PermissionGate";
import Link from "next/link";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';

// Sortable item component
function SortableItem({ item, onEdit, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });
  
  const style = {
    transform: transform ? `translateY(${transform.y}px)` : undefined,
    transition,
  };
  
  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-md mb-2"
    >
      <div className="flex items-center">
        <button 
          className="cursor-grab mr-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300" 
          {...attributes} 
          {...listeners}
        >
          <Reorder size={18} />
        </button>
        <span>{item.text}</span>
      </div>
      <div className="flex space-x-1">
        <button
          onClick={() => onEdit(item)}
          className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          <Edit size={16} />
        </button>
        <button
          onClick={() => onDelete(item)}
          className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

export default function ChecklistItemsPage({ params }) {
  const router = useRouter();
  const { id } = params;
  const { user } = useAuth();
  const [checklist, setChecklist] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [newItem, setNewItem] = useState("");
  const [editingItem, setEditingItem] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  
  // Configure DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );
  
  // Fetch checklist and items
  useEffect(() => {
    async function fetchChecklist() {
      if (!user || !id) return;
      
      try {
        const { data: checklistData, error: checklistError } = await supabase
          .from("cleaning_checklists")
          .select("*")
          .eq("id", id)
          .single();
          
        if (checklistError) throw checklistError;
        
        const { data: itemsData, error: itemsError } = await supabase
          .from("cleaning_checklist_items")
          .select("*")
          .eq("checklist_id", id)
          .order("position", { ascending: true });
          
        if (itemsError) throw itemsError;
        
        setChecklist(checklistData);
        setItems(itemsData || []);
      } catch (error) {
        console.error("Error fetching checklist:", error);
        setError("Failed to load checklist");
      } finally {
        setLoading(false);
      }
    }
    
    fetchChecklist();
  }, [user, id]);
  
  // Add new item
  const addItem = async (e) => {
    e.preventDefault();
    if (!newItem.trim()) {
      setError("Item text is required");
      return;
    }
    
    try {
      // Calculate next position
      const nextPosition = items.length > 0 
        ? Math.max(...items.map(item => item.position || 0)) + 1 
        : 1;
        
      const { data, error } = await supabase
        .from("cleaning_checklist_items")
        .insert({
          checklist_id: id,
          text: newItem,
          position: nextPosition
        })
        .select();
        
      if (error) throw error;
      
      // Update state
      setItems([...items, data[0]]);
      setNewItem("");
      setSuccess("Item added successfully");
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Error adding item:", error);
      setError("Failed to add item");
    }
  };
  
  // Update item
  const updateItem = async (e) => {
    e.preventDefault();
    if (!editingItem.text.trim()) {
      setError("Item text is required");
      return;
    }
    
    try {
      const { error } = await supabase
        .from("cleaning_checklist_items")
        .update({ text: editingItem.text })
        .eq("id", editingItem.id);
        
      if (error) throw error;
      
      // Update state
      setItems(items.map(item => 
        item.id === editingItem.id ? { ...item, text: editingItem.text } : item
      ));
      setEditingItem(null);
      setSuccess("Item updated successfully");
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Error updating item:", error);
      setError("Failed to update item");
    }
  };
  
  // Delete item
  const deleteItem = async () => {
    if (!itemToDelete) return;
    
    try {
      const { error } = await supabase
        .from("cleaning_checklist_items")
        .delete()
        .eq("id", itemToDelete.id);
        
      if (error) throw error;
      
      // Update state
      setItems(items.filter(item => item.id !== itemToDelete.id));
      setItemToDelete(null);
      setShowDeleteModal(false);
      setSuccess("Item deleted successfully");
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Error deleting item:", error);
      setError("Failed to delete item");
    }
  };
  
  // Handle drag end - update item positions
  const handleDragEnd = async (event) => {
    const { active, over } = event;
    
    if (active.id !== over.id) {
      // Find the items
      const activeItem = items.find(item => item.id === active.id);
      const overItem = items.find(item => item.id === over.id);
      
      if (!activeItem || !overItem) return;
      
      // Create the new array with updated positions
      const oldIndex = items.findIndex(item => item.id === active.id);
      const newIndex = items.findIndex(item => item.id === over.id);
      
      const newItems = [...items];
      newItems.splice(oldIndex, 1);
      newItems.splice(newIndex, 0, activeItem);
      
      // Update the state optimistically
      setItems(newItems);
      
      // Update positions in the database
      try {
        // Generate batch updates
        const updates = newItems.map((item, index) => ({
          id: item.id,
          position: index + 1
        }));
        
        // Use upsert to update all positions at once
        const { error } = await supabase
          .from("cleaning_checklist_items")
          .upsert(updates, { onConflict: "id" });
          
        if (error) throw error;
      } catch (error) {
        console.error("Error updating positions:", error);
        setError("Failed to update item positions");
        // Could revert to original state here if needed
      }
    }
  };
  
  if (loading) {
    return (
      <div className="p-6 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (!checklist) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Checklist not found
        </div>
        <Link 
          href="/cleaning/checklist/manage"
          className="text-blue-600 hover:text-blue-800 flex items-center"
        >
          <ArrowLeft size={16} className="mr-1" />
          Back to checklists
        </Link>
      </div>
    );
  }
  
  return (
    <PermissionGate requiredRole="manager" fallback={<div className="p-6">You don't have permission to manage checklist items.</div>}>
      <div className="p-6">
        <div className="flex items-center mb-6">
          <Link 
            href="/cleaning/checklist/manage"
            className="text-blue-600 hover:text-blue-800 flex items-center mr-4"
          >
            <ArrowLeft size={20} className="mr-1" />
            Back
          </Link>
          <h1 className="text-2xl font-bold">Manage Items: {checklist.name}</h1>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}
        
        {/* Add new item form */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Add New Item</h2>
          <form onSubmit={addItem} className="flex items-end gap-2">
            <div className="flex-grow">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Item Text
              </label>
              <input 
                type="text"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                placeholder="e.g., Clean window sills"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center"
            >
              <Plus size={18} className="mr-1" />
              Add
            </button>
          </form>
        </div>
        
        {/* Checklist items */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Checklist Items</h2>
          
          {items.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">No items in this checklist yet.</p>
          ) : (
            <div>
              {editingItem ? (
                <form onSubmit={updateItem} className="mb-4">
                  <div className="flex items-end gap-2">
                    <div className="flex-grow">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Edit Item
                      </label>
                      <input 
                        type="text"
                        value={editingItem.text}
                        onChange={(e) => setEditingItem({...editingItem, text: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                    >
                      <Check size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingItem(null)}
                      className="px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </form>
              ) : (
                <DndContext 
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                  modifiers={[restrictToVerticalAxis]}
                >
                  <p className="text-sm text-gray-500 mb-3">Drag items to reorder them.</p>
                  <SortableContext items={items.map(item => item.id)} strategy={verticalListSortingStrategy}>
                    {items.map(item => (
                      <SortableItem 
                        key={item.id} 
                        item={item}
                        onEdit={setEditingItem}
                        onDelete={(item) => {
                          setItemToDelete(item);
                          setShowDeleteModal(true);
                        }}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Delete Item</h3>
            <p className="mb-6">
              Are you sure you want to delete the item "{itemToDelete?.text}"?
              This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={deleteItem}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </PermissionGate>
  );
}