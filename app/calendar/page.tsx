"use client";

import { useState, useEffect } from "react";
import { Calendar as BigCalendar, dateFnsLocalizer } from "react-big-calendar";
import format from "date-fns/format";
import parse from "date-fns/parse";
import startOfWeek from "date-fns/startOfWeek";
import getDay from "date-fns/getDay";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import styles from "./calendar.module.css";
import {
  Calendar as CalendarIcon,
  BarChart3,
  CheckCircle,
  PlusCircle,
  User,
  Settings,
  LogOut,
  Users,
  Inbox,
} from "lucide-react";

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
const statusColors = {
  confirmed: "#10B981", // green
  pending: "#F59E0B", // amber
  cancelled: "#EF4444", // red
  default: "#3B82F6", // blue - for reservations without status
};

export default function ReservationCalendar() {
  const { user, loading } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [selectedReservation, setSelectedReservation] =
    useState<Reservation | null>(null);
  const [newReservation, setNewReservation] = useState({
    title: "House Reservation",
    start: new Date(),
    end: new Date(new Date().setDate(new Date().getDate() + 1)), // Default to next day
    description: "",
    guests: 1,
    status: "pending",
    allDay: true,
  });

  useEffect(() => {
    if (user) {
      fetchReservations();
    }
  }, [user]);

  const fetchReservations = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("reservations")
        .select("*")
        .eq("user_id", user?.id);

      if (error) {
        throw error;
      }

      if (data) {
        // Transform database reservations to calendar events
        const calendarReservations = data.map((reservation) => ({
          id: reservation.id,
          title: reservation.title,
          start: new Date(reservation.start_date),
          end: new Date(reservation.end_date),
          description: reservation.description,
          guests: reservation.guests || 1,
          status: reservation.status || "pending",
          allDay: true, // House bookings are typically full days
          color: statusColors[reservation.status] || statusColors.default,
        }));

        setReservations(calendarReservations);
      }
    } catch (error) {
      console.error("Error fetching reservations:", error);
    } finally {
      setIsLoading(false);
    }
  };

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
      status: "pending",
      allDay: true,
    });
    setSelectedReservation(null);
    setShowReservationModal(true);
  };

  const handleSaveReservation = async () => {
    try {
      if (!user) return;

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
        status: selectedReservation
          ? selectedReservation.status
          : newReservation.status,
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
    } catch (error) {
      console.error("Error saving reservation:", error);
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
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="hidden md:flex flex-col w-64 bg-white border-r">
        <div className="flex items-center justify-center h-16 border-b">
          <h1 className="text-xl font-semibold text-gray-800">Stia</h1>
        </div>

        <div className="flex flex-col flex-1 p-4 space-y-2">
          <Link
            href="/dashboard"
            className="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-md"
          >
            <BarChart3 className="w-5 h-5 mr-3" />
            Dashboard
          </Link>
          <Link
            href="/tasks"
            className="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-md"
          >
            <CheckCircle className="w-5 h-5 mr-3" />
            Tasks
          </Link>
          <Link
            href="/calendar"
            className="flex items-center px-4 py-3 text-gray-900 bg-blue-50 rounded-md font-medium"
          >
            <CalendarIcon className="w-5 h-5 mr-3" />
            Reservations
          </Link>
          <Link
            href="/inventory"
            className="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-md"
          >
            <Inbox className="w-5 h-5 mr-3" />
            Inventory
          </Link>
        </div>

        {/* User section - same as before */}
        <div className="p-4 border-t">
          {/* Same user section code from before */}
        </div>
      </div>

      {/* Mobile Nav - same as before */}

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="md:p-8 p-4 pt-20 md:pt-8 max-w-7xl mx-auto">
          <header className="mb-6">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                House Reservations
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
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: statusColors.confirmed }}
                ></div>
                <span className="text-sm text-gray-600">Confirmed</span>
              </div>
              <div className="flex items-center">
                <div
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: statusColors.pending }}
                ></div>
                <span className="text-sm text-gray-600">Pending</span>
              </div>
              <div className="flex items-center">
                <div
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: statusColors.cancelled }}
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
                    Check-in Date
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
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Check-out Date
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
                    const status = e.target.value as
                      | "confirmed"
                      | "pending"
                      | "cancelled";
                    selectedReservation
                      ? setSelectedReservation({
                          ...selectedReservation,
                          status,
                        })
                      : setNewReservation({ ...newReservation, status });
                  }}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
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
    </div>
  );
}

// Helper for formatting dates for date input
function formatDateForInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
