"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import {
  Phone,
  Mail,
  MapPin,
  Building,
  User as UserIcon,
  Plus,
} from "lucide-react";
import Link from "next/link";
import SideNavigation from "@/components/layout/SideNavigation";

export default function ContactsPage() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [userContacts, setUserContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        // Load regular contacts
        const { data: contactsData, error: contactsError } = await supabase
          .from("contacts")
          .select("*")
          .order("name");

        if (contactsError) throw contactsError;
        setContacts(contactsData || []);

        // Load user contacts (profiles with show_in_contacts = true)
        const { data: userContactsData, error: userContactsError } =
          await supabase
            .from("profiles")
            .select("*, user:users(email, user_metadata)")
            .eq("show_in_contacts", true);

        if (userContactsError) throw userContactsError;
        setUserContacts(userContactsData || []);
      } catch (error) {
        console.error("Error loading contacts:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <SideNavigation user={user} />
      <div className="lg:pl-64 flex flex-col flex-1">
        <main className="flex-1">
          <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-semibold">Contacts</h1>
              <Link
                href="/contacts/add"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Contact
              </Link>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Family & Friends section (user contacts) */}
                {userContacts.length > 0 && (
                  <div>
                    <h2 className="text-lg font-medium mb-3 text-gray-800 dark:text-gray-200">
                      Family & Friends
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {userContacts.map((profile) => (
                        <div
                          key={profile.id}
                          className="bg-white dark:bg-gray-800 rounded-lg shadow p-5 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                              <UserIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="ml-4 flex-1">
                              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                                {profile.full_name ||
                                  profile.user?.user_metadata?.name ||
                                  "Unnamed User"}
                              </h3>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {profile.user?.user_metadata?.role ||
                                  "Family Member"}
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 space-y-2">
                            {profile.user?.email && (
                              <div className="flex items-center">
                                <Mail className="h-4 w-4 text-gray-400 mr-2" />
                                <a
                                  href={`mailto:${profile.user.email}`}
                                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                  {profile.user.email}
                                </a>
                              </div>
                            )}
                            {profile.phone_number && (
                              <div className="flex items-center">
                                <Phone className="h-4 w-4 text-gray-400 mr-2" />
                                <a
                                  href={`tel:${profile.phone_number}`}
                                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                  {profile.phone_number}
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Regular contacts */}
                {contacts.length > 0 && (
                  <div>
                    <h2 className="text-lg font-medium mb-3 text-gray-800 dark:text-gray-200">
                      Service Providers
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {contacts.map((contact) => (
                        <div
                          key={contact.id}
                          className="bg-white dark:bg-gray-800 rounded-lg shadow p-5 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                              <Building className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                            </div>
                            <div className="ml-4 flex-1">
                              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                                {contact.name}
                              </h3>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {contact.category}
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 space-y-2">
                            {contact.phone && (
                              <div className="flex items-center">
                                <Phone className="h-4 w-4 text-gray-400 mr-2" />
                                <a
                                  href={`tel:${contact.phone}`}
                                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                  {contact.phone}
                                </a>
                              </div>
                            )}
                            {contact.email && (
                              <div className="flex items-center">
                                <Mail className="h-4 w-4 text-gray-400 mr-2" />
                                <a
                                  href={`mailto:${contact.email}`}
                                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                  {contact.email}
                                </a>
                              </div>
                            )}
                            {contact.address && (
                              <div className="flex items-center">
                                <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                                <span className="text-sm text-gray-600 dark:text-gray-300">
                                  {contact.address}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {contacts.length === 0 && userContacts.length === 0 && (
                  <div className="text-center py-12">
                    <div className="mx-auto w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mb-4">
                      <Phone className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                      No contacts found
                    </h3>
                    <p className="mt-1 text-gray-500 dark:text-gray-400">
                      Get started by adding your first contact.
                    </p>
                    <div className="mt-6">
                      <Link
                        href="/contacts/add"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Contact
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
