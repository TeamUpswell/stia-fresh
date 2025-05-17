import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { UserIcon, ClockIcon, TagIcon, XIcon } from "lucide-react";

export default function TaskDetail({ task, onClose, onUpdate, currentUser }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState(task);
  
  const handleUpdate = async () => {
    try {
      const { error } = await supabase
        .from("tasks")
        .update({
          title: editedTask.title,
          description: editedTask.description,
          priority: editedTask.priority,
          due_date: editedTask.due_date,
          category: editedTask.category
        })
        .eq("id", task.id);
      
      if (error) throw error;
      
      setIsEditing(false);
      onUpdate(editedTask);
    } catch (err) {
      console.error("Error updating task:", err);
      alert("Failed to update task");
    }
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return "No due date";
    return new Date(dateString).toLocaleDateString();
  };
  
  const canEdit = currentUser?.isAdmin || currentUser?.isManager || task.created_by === currentUser?.id;
  
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-xl font-semibold">{task.title}</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <XIcon className="h-5 w-5" />
        </button>
      </div>
      
      {isEditing ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              value={editedTask.title}
              onChange={(e) => setEditedTask({...editedTask, title: e.target.value})}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              rows={4}
              value={editedTask.description}
              onChange={(e) => setEditedTask({...editedTask, description: e.target.value})}
            ></textarea>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                value={editedTask.priority}
                onChange={(e) => setEditedTask({...editedTask, priority: e.target.value})}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <input
                type="date"
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                value={editedTask.due_date || ""}
                onChange={(e) => setEditedTask({...editedTask, due_date: e.target.value})}
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 mt-4">
            <button
              onClick={() => setIsEditing(false)}
              className="px-3 py-1 border border-gray-300 rounded-md text-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdate}
              className="px-3 py-1 bg-blue-600 text-white rounded-md"
            >
              Save Changes
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="prose prose-sm max-w-none mb-6">
            <p>{task.description}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center text-gray-600">
              <TagIcon className="h-4 w-4 mr-1" />
              <span className="capitalize">{task.category}</span>
            </div>
            
            <div className="flex items-center text-gray-600">
              <ClockIcon className="h-4 w-4 mr-1" />
              <span>{formatDate(task.due_date)}</span>
            </div>
            
            <div className="flex items-center text-gray-600">
              <UserIcon className="h-4 w-4 mr-1" />
              <span>
                {task.assigned_to ? "Assigned" : "Unassigned"}
              </span>
            </div>
            
            <div className="flex items-center">
              <span
                className={`px-2 py-1 rounded text-xs ${
                  task.status === "pending"
                    ? "bg-gray-100 text-gray-800"
                    : task.status === "in-progress"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-green-100 text-green-800"
                }`}
              >
                {task.status}
              </span>
            </div>
          </div>
          
          {canEdit && (
            <div className="mt-6">
              <button
                onClick={() => setIsEditing(true)}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                Edit Task
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}