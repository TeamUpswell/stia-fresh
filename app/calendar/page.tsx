"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import { Calendar as BigCalendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import { useProperty } from "@/lib/hooks/useProperty"; // Add this
import AuthenticatedLayout from "@/components/AuthenticatedLayout";
import styles from "./calendar.module.css";
import { PlusCircle } from "lucide-react";

import "react-big-calendar/lib/css/react-big-calendar.css";

// Date-fns setup - keep this unchanged
const locales = {
  "en-US": require("date-fns/locale/en-US"),
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

// Update interface to match your reservations table
interface Reservation {
  id: string;
  title: string;
  start: Date;
  end: Date;
  description?: string;
  guests?: number;
  status?: string;
  allDay?: boolean;
  color?: string;
}

// Status colors for visual representation
const statusColors: Record<string, string> = {
  confirmed: "#10B981", // green
  "pending approval": "#FF8C00", // true orange (was amber #F59E0B)
  cancelled: "#EF4444", // red
  default: "#3B82F6", // blue - for reservations without status
};

export default function ReservationCalendar() {
  const { user, loading } = useAuth();
  const { currentProperty } = useProperty(); // Add this
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [selectedReservation, setSelectedReservation] =
    useState<Reservation | null>(null);
  const [newReservation, setNewReservation] = useState({
    title: "House Reservation",
    start: new Date(),
    end: new Date(new Date().setDate(new Date().getDate() + 1)),
    description: "",
    guests: 1,
    status: "pending approval", // Changed from "tentative"
    allDay: true,
  });

  // Auth provider needs to handle missing user role mappings
  // Check role structure matches user_roles table columns
  const userRoles = user?.roles || [];
  // Proper check
  const hasPermission = (requiredRole: string) => {
    if (!user || !userRoles) return false;
    return userRoles.includes(requiredRole);
  };

  useEffect(() => {
    // Refresh Supabase session if needed
    const refreshSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) console.error("Session error:", error);
      if (!data.session) {
        // No session, redirect to login
        window.location.href = "/auth/login";
      }
    };

    refreshSession();
  }, []);

  const fetchReservations = useCallback(async () => {
    try {
      if (!currentProperty) {
        setReservations([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const { data, error } = await supabase
        .from("reservations")
        .select("*")
        .eq("property_id", currentProperty.id); // Filter by current property

      if (error) throw error;

      if (data) {
        // Transform database reservations to calendar events
        const calendarReservations = data.map((reservation) => ({
          id: reservation.id,
          title: reservation.title,
          start: new Date(reservation.start_date),
          end: new Date(reservation.end_date),
          description: reservation.description,
          guests: reservation.guests || 1,
          status: reservation.status || "pending approval",
          allDay: true, // House bookings are typically full days
          color:
            statusColors[reservation.status as keyof typeof statusColors] ||
            statusColors.default,
        }));

        setReservations(calendarReservations);
      }
    } catch (error) {
      console.error("Error fetching reservations:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentProperty]); // Changed dependency

  useEffect(() => {
    if (currentProperty) {
      fetchReservations();
    }
  }, [currentProperty, fetchReservations]); // Changed dependency

  // Remove the old property loading useEffect and replace with:
  if (!currentProperty) {
    return (
      <AuthenticatedLayout>
        <div className="p-4">
          <p>Please select a property to view its calendar.</p>
        </div>
      </AuthenticatedLayout>
    );
  }

  const handleReservationSelect = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setShowReservationModal(true);
  };

  const handleSlotSelect = ({ start, end }: { start: Date; end: Date }) => {
    setNewReservation({
      title: "House Reservation",
      start,
      end,
      description: "",
      guests: 1,
      status: "pending approval", // Changed from "tentative"
      allDay: true,
    });
    setSelectedReservation(null);
    setShowReservationModal(true);
  };

  const handleSaveReservation = async () => {
    try {
      if (!user) return;

      // Set default status for new reservations
      const status = selectedReservation
        ? selectedReservation.status
        : hasPermission("owner") || hasPermission("manager")
        ? newReservation.status // Owner/manager can set any status
        : "pending approval"; // Default for new reservations

      const reservationData = {
        user_id: user.id,
        title: selectedReservation
          ? selectedReservation.title
          : newReservation.title,
        start_date: selectedReservation
          ? selectedReservation.start.toISOString()
          : newReservation.start.toISOString(),
        end_date: selectedReservation
          ? selectedReservation.end.toISOString()
          : newReservation.end.toISOString(),
        description: selectedReservation
          ? selectedReservation.description
          : newReservation.description,
        guests: selectedReservation
          ? selectedReservation.guests
          : newReservation.guests,
        status: status, // Use the status determined above
        updated_at: new Date().toISOString(),
      };

      if (selectedReservation) {
        // Update existing reservation
        const { error } = await supabase
          .from("reservations")
          .update(reservationData)
          .eq("id", selectedReservation.id);

        if (error) throw error;
      } else {
        // Create new reservation
        const { error } = await supabase.from("reservations").insert([
          {
            ...reservationData,
            created_at: new Date().toISOString(),
          },
        ]);

        if (error) throw error;
      }

      // Refresh reservations
      fetchReservations();
      setShowReservationModal(false);
    } catch (error: any) {
      console.error("Error saving reservation:", error);
      alert(`Failed to save: ${error.message || "Unknown database error"}`);
    }
  };

  const handleDeleteReservation = async () => {
    try {
      if (!selectedReservation) return;

      const { error } = await supabase
        .from("reservations")
        .delete()
        .eq("id", selectedReservation.id);

      if (error) throw error;

      // Refresh reservations
      fetchReservations();
      setShowReservationModal(false);
    } catch (error) {
      console.error("Error deleting reservation:", error);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        <header className="mb-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold mb-4">
              {currentProperty.name} Availability
            </h1>
            <button
              onClick={() =>
                handleSlotSelect({
                  start: new Date(),
                  end: new Date(new Date().setDate(new Date().getDate() + 1)),
                })
              }
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md flex items-center"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              New Reservation
            </button>
          </div>

          {/* Status legend */}
          <div className="mt-4 flex flex-wrap gap-4">
            <div className="flex items-center">
              <div
                className={`${styles.statusIndicator} ${styles.confirmedStatus}`}
              ></div>
              <span className="text-sm text-gray-600">Confirmed</span>
            </div>
            <div className="flex items-center">
              <div
                className={`${styles.statusIndicator} ${styles.pendingApprovalStatus}`}
              ></div>
              <span className="text-sm text-gray-600">Pending Approval</span>
            </div>
            <div className="flex items-center">
              <div
                className={`${styles.statusIndicator} ${styles.cancelledStatus}`}
              ></div>
              <span className="text-sm text-gray-600">Cancelled</span>
            </div>
          </div>
        </header>

        {/* Calendar Component */}
        <div className={styles.calendarContainer}>
          <div className={styles.calendarView}>
            <BigCalendar
              localizer={localizer}
              events={reservations}
              startAccessor="start"
              endAccessor="end"
              views={["month", "week", "day"]}
              onSelectEvent={handleReservationSelect}
              onSelectSlot={handleSlotSelect}
              selectable
              popup
              eventPropGetter={(event) => ({
                style: {
                  backgroundColor: event.color || statusColors.default,
                  borderRadius: "4px",
                },
              })}
            />
          </div>
        </div>
      </div>

      {/* Reservation Modal */}
      {showReservationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <h2 className="text-xl font-semibold mb-4">
              {selectedReservation
                ? "Edit Reservation"
                : "Create New Reservation"}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reservation Title
                </label>
                <input
                  type="text"
                  value={
                    selectedReservation
                      ? selectedReservation.title
                      : newReservation.title
                  }
                  onChange={(e) =>
                    selectedReservation
                      ? setSelectedReservation({
                          ...selectedReservation,
                          title: e.target.value,
                        })
                      : setNewReservation({
                          ...newReservation,
                          title: e.target.value,
                        })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="e.g., Family Vacation"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Arrive
                  </label>
                  <input
                    type="date"
                    value={formatDateForInput(
                      selectedReservation
                        ? selectedReservation.start
                        : newReservation.start
                    )}
                    onChange={(e) => {
                      const date = new Date(e.target.value);
                      selectedReservation
                        ? setSelectedReservation({
                            ...selectedReservation,
                            start: date,
                          })
                        : setNewReservation({ ...newReservation, start: date });
                    }}
                    className="w-full px-3 py-2 border rounded-md"
                    aria-label="Arrival date"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Depart
                  </label>
                  <input
                    type="date"
                    value={formatDateForInput(
                      selectedReservation
                        ? selectedReservation.end
                        : newReservation.end
                    )}
                    onChange={(e) => {
                      const date = new Date(e.target.value);
                      selectedReservation
                        ? setSelectedReservation({
                            ...selectedReservation,
                            end: date,
                          })
                        : setNewReservation({ ...newReservation, end: date });
                    }}
                    className="w-full px-3 py-2 border rounded-md"
                    aria-label="Departure date"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Guests
                </label>
                <input
                  type="number"
                  min="1"
                  value={
                    selectedReservation
                      ? selectedReservation.guests || 1
                      : newReservation.guests
                  }
                  onChange={(e) => {
                    const guests = parseInt(e.target.value) || 1;
                    selectedReservation
                      ? setSelectedReservation({
                          ...selectedReservation,
                          guests,
                        })
                      : setNewReservation({ ...newReservation, guests });
                  }}
                  className="w-full px-3 py-2 border rounded-md"
                  aria-label="Number of guests"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={
                    selectedReservation
                      ? selectedReservation.status
                      : newReservation.status
                  }
                  onChange={(e) => {
                    const newStatus = e.target.value;

                    // Only allow owner/manager to set status to confirmed
                    if (
                      newStatus === "confirmed" &&
                      !hasPermission("owner") &&
                      !hasPermission("manager")
                    ) {
                      alert(
                        "Only owners and managers can confirm reservations"
                      );
                      return;
                    }

                    selectedReservation
                      ? setSelectedReservation({
                          ...selectedReservation,
                          status: newStatus,
                        })
                      : setNewReservation({
                          ...newReservation,
                          status: newStatus,
                        });
                  }}
                  className="w-full px-3 py-2 border rounded-md"
                  aria-label="Reservation status"
                >
                  <option value="pending approval">Pending Approval</option>
                  {(hasPermission("owner") || hasPermission("manager")) && (
                    <option value="confirmed">Confirmed</option>
                  )}
                  <option value="cancelled">Cancelled</option>
                </select>

                {newReservation.status === "pending approval" && (
                  <p className="text-xs text-gray-500 mt-1">
                    Reservations require approval from an owner or manager.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={
                    selectedReservation
                      ? selectedReservation.description || ""
                      : newReservation.description
                  }
                  onChange={(e) =>
                    selectedReservation
                      ? setSelectedReservation({
                          ...selectedReservation,
                          description: e.target.value,
                        })
                      : setNewReservation({
                          ...newReservation,
                          description: e.target.value,
                        })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="Any special requests or notes about the reservation"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-between">
              <div>
                {selectedReservation && (
                  <button
                    onClick={handleDeleteReservation}
                    className="px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-md"
                  >
                    Delete
                  </button>
                )}
              </div>

              <div className="space-x-3">
                <button
                  onClick={() => setShowReservationModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md"
                >
                  Cancel
                </button>

                <button
                  onClick={handleSaveReservation}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AuthenticatedLayout>
  );
}

// Helper for formatting dates for date input
function formatDateForInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
