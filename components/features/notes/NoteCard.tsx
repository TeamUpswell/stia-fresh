import React from 'react';

// Define the props for the NoteCard component
interface NoteCardProps {
  title: string;
  content: string;
  date: string;
  onEdit: () => void; // Function to handle editing the note
  onDelete: () => void; // Function to handle deleting the note
}

// NoteCard component for displaying individual notes
const NoteCard: React.FC<NoteCardProps> = ({ title, content, date, onEdit, onDelete }) => {
  return (
    <div className="bg-white shadow-md rounded-lg p-4 mb-4">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-gray-700">{content}</p>
      <p className="text-gray-500 text-sm">{date}</p>
      <div className="flex justify-end mt-2">
        <button onClick={onEdit} className="text-blue-500 hover:underline mr-2">
          Edit
        </button>
        <button onClick={onDelete} className="text-red-500 hover:underline">
          Delete
        </button>
      </div>
    </div>
  );
};

export default NoteCard;