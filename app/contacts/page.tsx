"use client";

import { useState, useEffect } from "react";
import PermissionGate from "@/components/PermissionGate";
import { useAuth } from "@/components/AuthProvider";
import { PlusIcon } from "@heroicons/react/24/outline";
import { supabase } from "@/lib/supabase";
import ContactCard from "@/components/features/contacts/ContactCard";
import ContactForm from "@/components/features/contacts/ContactForm"; // Fix the import path to match the directory structure

interface Contact {
  id: string;
  name: string;
  role: string;
  phone?: string;
  email?: string;
  address?: string;
  description?: string;
  website?: string;
  priority: number;
}

export default function ContactsPage() {
  const { user, hasPermission } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchContacts();
    }
  }, [user]);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .order("priority", { ascending: false })
        .order("name");

      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error("Error fetching contacts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact);
    setShowAddForm(true);
  };

  const handleDeleteContact = async (id: string) => {
    if (!confirm("Are you sure you want to delete this contact?")) return;

    try {
      const { error } = await supabase.from("contacts").delete().eq("id", id);

      if (error) throw error;
      fetchContacts();
    } catch (error) {
      console.error("Error deleting contact:", error);
      alert("Failed to delete contact. Please try again.");
    }
  };

  const filteredContacts = contacts.filter((contact) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      contact.name.toLowerCase().includes(searchLower) ||
      contact.role.toLowerCase().includes(searchLower) ||
      contact.description?.toLowerCase().includes(searchLower) ||
      contact.email?.toLowerCase().includes(searchLower) ||
      contact.phone?.toLowerCase().includes(searchLower)
    );
  });

  // Group contacts by role
  const contactsByRole: Record<string, Contact[]> = {};
  filteredContacts.forEach((contact) => {
    if (!contactsByRole[contact.role]) {
      contactsByRole[contact.role] = [];
    }
    contactsByRole[contact.role].push(contact);
  });

  return (
    <PermissionGate
      requiredRole="family"
      fallback={<div className="text-center p-8">Access restricted</div>}
    >
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Contacts</h1>
        <div className="py-8 px-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Search contacts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md"
                />
              </div>

              {hasPermission("manager") && (
                <button
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg"
                  onClick={() => {
                    setEditingContact(null);
                    setShowAddForm(true);
                  }}
                >
                  <PlusIcon className="h-5 w-5 mr-1" />
                  Add Contact
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">Loading contacts...</div>
          ) : filteredContacts.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-600">
                {searchTerm
                  ? "No contacts match your search"
                  : "No contacts found"}
              </p>
              {hasPermission("manager") && !searchTerm && (
                <p className="text-gray-500 text-sm mt-2">
                  Add your first contact to get started
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(contactsByRole).map(([role, contacts]) => (
                <div
                  key={role}
                  className="bg-white shadow rounded-lg overflow-hidden"
                >
                  <div className="bg-gray-50 px-4 py-3 border-b">
                    <h2 className="font-medium text-lg">{role}</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                    {contacts.map((contact) => (
                      <ContactCard
                        key={contact.id}
                        contact={contact}
                        onEdit={
                          hasPermission("manager")
                            ? (contact) =>
                                handleEditContact({ ...contact, priority: 0 })
                            : undefined
                        }
                        onDelete={
                          hasPermission("manager")
                            ? handleDeleteContact
                            : undefined
                        }
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Contact Form Modal */}
        {showAddForm && (
          <ContactForm
            contact={editingContact}
            onClose={() => {
              setShowAddForm(false);
              setEditingContact(null);
            }}
            onSaved={() => {
              fetchContacts();
              setShowAddForm(false);
              setEditingContact(null);
            }}
          />
        )}
      </div>
    </PermissionGate>
  );
}
