import { useState } from "react";
import Link from "next/link";
import { TrashIcon } from "@heroicons/react/24/outline";
import { supabase } from "@/lib/supabase";

interface ChecklistCardProps {
  checklist: {
    id: string;
    title: string;
    description: string;
  };
  onDelete?: () => void;
}

export default function ChecklistCard({
  checklist,
  onDelete,
}: ChecklistCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm("Are you sure you want to delete this checklist?")) return;

    setIsDeleting(true);
    try {
      await supabase.from("checklists").delete().eq("id", checklist.id);

      if (onDelete) onDelete();
    } catch (error) {
      console.error("Error deleting checklist:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Link href={`/checklists/${checklist.id}`}>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
        <div className="p-4">
          <div className="flex justify-between">
            <h2 className="font-semibold text-lg text-gray-900">
              {checklist.title}
            </h2>

            {onDelete && (
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-gray-400 hover:text-red-500"
                title="Delete checklist"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            )}
          </div>

          {checklist.description && (
            <p className="mt-2 text-sm text-gray-600 line-clamp-2">
              {checklist.description}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
