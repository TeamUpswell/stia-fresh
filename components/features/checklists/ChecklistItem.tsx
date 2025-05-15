import React from 'react';

// Define the props for the ChecklistItem component
interface ChecklistItemProps {
  item: {
    id: string;
    title: string;
    completed: boolean;
  };
  onToggle: (id: string) => void; // Function to toggle the completion status
  onDelete: (id: string) => void; // Function to delete the checklist item
}

// The ChecklistItem component displays an individual checklist item
const ChecklistItem: React.FC<ChecklistItemProps> = ({ item, onToggle, onDelete }) => {
  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-200">
      <div className="flex items-center">
        <input
          id={`checkbox-${item.id}`}
          type="checkbox"
          checked={item.completed}
          onChange={() => onToggle(item.id)}
          className="mr-2"
        />
        <label 
          htmlFor={`checkbox-${item.id}`}
          className={item.completed ? 'line-through text-gray-500' : ''}
        >
          {item.title}
        </label>
      </div>
      <button
        onClick={() => onDelete(item.id)}
        className="text-red-500 hover:text-red-700"
      >
        Delete
      </button>
    </div>
  );
};

export default ChecklistItem;