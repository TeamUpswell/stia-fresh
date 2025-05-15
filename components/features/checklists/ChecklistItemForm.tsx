import { useState, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { supabase } from "@/lib/supabase";

interface ChecklistItemFormProps {
  checklistId: string;
  item?: {
    id: string;
    title: string;
    description: string;
    category: string;
    order_index: number;
  } | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function ChecklistItemForm({
  checklistId,
  item,
  onClose,
  onSaved,
}: ChecklistItemFormProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    order_index: 0,
  });
  const [categories, setCategories] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [showNewCategory, setShowNewCategory] = useState(false);

  // Load existing categories
  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from("checklist_items")
        .select("category")
        .eq("checklist_id", checklistId)
        .order("category");

      if (!error && data) {
        const uniqueCategories = [
          ...new Set(data.map((item) => item.category)),
        ];
        setCategories(uniqueCategories);
      }
    };

    fetchCategories();
  }, [checklistId]);

  // Load item data if editing
  useEffect(() => {
    if (item) {
      setFormData({
        title: item.title,
        description: item.description || "",
        category: item.category,
        order_index: item.order_index,
      });
    }
  }, [item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);
    try {
      const finalCategory = showNewCategory ? newCategory : formData.category;

      // Get the next order index if creating a new item
      let orderIndex = formData.order_index;
      if (!item) {
        const { data } = await supabase
          .from("checklist_items")
          .select("order_index")
          .eq("checklist_id", checklistId)
          .eq("category", finalCategory)
          .order("order_index", { ascending: false })
          .limit(1);

        orderIndex = data && data.length > 0 ? data[0].order_index + 1 : 0;
      }

      if (item) {
        // Update existing item
        await supabase
          .from("checklist_items")
          .update({
            title: formData.title,
            description: formData.description,
            category: finalCategory,
          })
          .eq("id", item.id);
      } else {
        // Create new item
        await supabase.from("checklist_items").insert([
          {
            checklist_id: checklistId,
            title: formData.title,
            description: formData.description,
            category: finalCategory,
            order_index: orderIndex,
          },
        ]);
      }

      onSaved();
    } catch (error) {
      console.error("Error saving checklist item:", error);
      alert("Failed to save item. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold">
            {item ? "Edit Item" : "Add New Item"}
          </h2>
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
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Title
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Item title"
              required
            />
          </div>

          <div className="mb-4">
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Description (Optional)
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Additional details"
              rows={3}
            />
          </div>

          <div className="mb-4">
            <label 
              htmlFor="category-select"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Category
            </label>

            {showNewCategory ? (
              <div>
                <input
                  type="text"
                  id="category-new"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="New category name"
                  title="New category name"
                  required
                />
                <div className="mt-2 flex space-x-2">
                  <button
                    type="button"
                    className="text-sm text-blue-600"
                    onClick={() => setShowNewCategory(false)}
                  >
                    Use existing category
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <select
                  id="category-select"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required={!showNewCategory}
                  title="Select a category"
                  aria-label="Category selection"
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                
                <div className="mt-2 flex space-x-2">
                  <button
                    type="button"
                    className="text-sm text-blue-600"
                    onClick={() => setShowNewCategory(true)}
                  >
                    Create new category
                  </button>
                </div>
              </div>
            )}
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
              {isSubmitting ? "Saving..." : item ? "Update" : "Add Item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
