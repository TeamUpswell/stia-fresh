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
  Edit,
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

        // Load service providers from contacts table
        const { data: contactsData, error: contactsError } = await supabase
          .from("contacts")
          .select("*")
          .order("name");

        if (contactsError) throw contactsError;
        setContacts(contactsData || []);

        // Modify your query to use a simpler approach first

        // Try a more basic query first to see if any profiles exist
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("*")
          .eq("show_in_contacts", true);

        if (profilesError) {
          console.error("Basic Profiles Error:", profilesError);
          throw profilesError;
        }

        console.log("Basic profiles query:", profilesData);

        // Then try the join query
        const { data: profilesWithRoles, error: rolesError } = await supabase
          .from("profiles")
          .select(`
            *,
            user_roles(role)
          `)
          .eq("show_in_contacts", true);

        if (rolesError) {
          console.error("Profiles with Roles Error:", rolesError);
        } else {
          console.log("Profiles with roles:", profilesWithRoles);
        }

        // Manually assign owner role to known owners by email
        const processedProfiles = profilesData?.map(profile => {
          // Known owner emails
          const ownerEmails = ["drew+12@pdxbernards.com", "drew+11@pdxbernards.com"];
          
          // Default role
          let role = "family";
          
          // Check if it's a known owner
          if (ownerEmails.includes(profile.email)) {
            role = "owner";
          } else if (profilesWithRoles) {
            // Try to find matching profile with role info
            const profileWithRole = profilesWithRoles.find(p => p.id === profile.id);
            if (profileWithRole?.user_roles && profileWithRole.user_roles.length > 0) {
              role = profileWithRole.user_roles[0]?.role || "family";
            }
          }
          
          return {
            ...profile,
            role
          };
        }) || [];

        console.log("Processed profiles with roles:", processedProfiles);

        // Filter for owners and managers
        const ownersAndManagers = processedProfiles.filter(profile => 
          profile.role === 'owner' || profile.role === 'manager'
        );

        console.log("Found owners/managers:", ownersAndManagers);
        setUserContacts(ownersAndManagers);
        
      } catch (error) {
        console.error("Error loading contacts:", error);
        setUserContacts([]); // Set empty array instead of hardcoded fallback
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [user]);

  console.log("Loading state:", loading);
  console.log("User contacts:", userContacts);
  console.log("Service contacts:", contacts);

  const handleDeleteContact = (contact) => {
    // Implement delete functionality here
    console.log("Delete contact:", contact);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <SideNavigation user={user} />
      <div className="lg:pl-64 flex flex-col flex-1">
        <main className="flex-1 p-6">
          <div className="mb-8 flex justify-between items-center">
            <h1 className="text-2xl font-semibold">Contacts</h1>
            <Link 
              href="/contacts/add" 
              className="flex items-center bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Contact
            </Link>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Owners & Managers Section */}
              {userContacts.length > 0 && (
                <div>
                  <h2 className="text-lg font-medium mb-3 text-gray-800 dark:text-gray-200">
                    Property Management
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {userContacts.map((profile) => (
                      <div
                        key={profile.id}
                        className="bg-white dark:bg-gray-800 rounded-lg shadow p-5"
                      >
                        <div className="flex items-start">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                            <UserIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                          </div>
                          <div className="ml-4 flex-1">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                              {profile.full_name || "Unnamed User"}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {profile.role === 'owner' ? 'Property Owner' : 'Property Manager'}
                            </p>
                          </div>
                        </div>
                        <div className="mt-4 space-y-2">
                          {profile.email && (
                            <div className="flex items-center">
                              <Mail className="h-4 w-4 text-gray-400 mr-2" />
                              <a
                                href={`mailto:${profile.email}`}
                                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                {profile.email}
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
                          {profile.address && (
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {profile.address}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Service Providers Section */}
              {contacts.length > 0 && (
                <div>
                  <h2 className="text-lg font-medium mb-3 text-gray-800 dark:text-gray-200">
                    Service Providers
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {contacts.map((contact) => (
                      <div
                        key={contact.id}
                        className="bg-white dark:bg-gray-800 rounded-lg shadow p-5 relative"
                      >
                        {/* Change from both Edit and Delete buttons to just Edit */}
                        <div className="absolute top-3 right-3">
                          <Link 
                            href={`/contacts/edit/${contact.id}`}
                            className="p-1.5 text-blue-600 hover:text-blue-800 dark:text-blue-400"
                          >
                            <Edit className="h-4 w-4" />
                          </Link>
                        </div>
                        
                        <div className="flex items-start">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                            <Building className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                          </div>
                          <div className="ml-4 flex-1">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                              {contact.name}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {contact.role || "Service Provider"}
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
                              <span className="text-sm text-gray-600 dark:text-gray-400">
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

              {/* Empty state */}
              {!loading && contacts.length === 0 && userContacts.length === 0 && (
                <div className="text-center py-12">
                  <div className="mx-auto h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <UserIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">No contacts</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Get started by adding a new contact.
                  </p>
                  <div className="mt-6">
                    <Link
                      href="/contacts/add"
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="-ml-1 mr-2 h-5 w-5" />
                      New Contact
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}