"use client";

import { useState, useEffect } from "react";
import { Calendar, momentLocalizer, View } from "react-big-calendar";
import moment from "moment";
import ProtectedPageWrapper from "@/components/layout/ProtectedPageWrapper";
import PermissionGate from "@/components/PermissionGate";
import { useAuth } from "@/components/AuthProvider";
import { PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { supabase } from "@/lib/supabase";
import { useLoadingTimeout } from "@/hooks/useLoadingTimeout";
import "react-big-calendar/lib/css/react-big-calendar.css";
import styles from "./calendar.module.css";

// Setup localizer for calendar
const localizer = momentLocalizer(moment);

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  user_id: string;
  notes?: string;
}

// Add this interface near your other interfaces
interface ManualSection {
  id: string;
  title: string;
  description: string;
  icon?: string;
  order_index: number;
}

// Add this function to map view names to Moment duration units
const getUnitForView = (
  view: string
): moment.unitOfTime.DurationConstructor => {
  switch (view) {
    case "month":
      return "month";
    case "week":
      return "week";
    case "day":
      return "day";
    case "agenda":
      return "day"; // Adjust as needed
    default:
      return "month";
  }
};

export default function CalendarPage() {
  const { user, hasPermission } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [showEventForm, setShowEventForm] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    start_date: "",
    end_date: "",
    description: "",
  });
  // Fix: Add proper type annotation here
  const [sections, setSections] = useState<ManualSection[]>([]);
  const [error, setError] = useState("");

  // Use the updated hook with setTimedOut
  const { loading, setLoading, timedOut, setTimedOut } = useLoadingTimeout(
    true,
    8000
  );

  // Add state for current date and view
  const [date, setDate] = useState(new Date());
  const [view, setView] = useState<View>("month" as View);

  // Add these handlers for navigation
  const handleNavigate = (newDate: Date) => {
    setDate(newDate);
  };

  const handleView = (newView: View) => {
    setView(newView);
  };

  // Fetch events from database
  useEffect(() => {
    if (user) {
      fetchEvents();
    }
  }, [user]);

  const fetchEvents = async () => {
    console.log("Fetching reservations...");
    setLoading(true);
    try {
      // Change "events" to "reservations"
      const { data, error } = await supabase.from("reservations").select("*");

      console.log("Raw reservations data:", data);
      console.log("Error:", error);

      if (error) throw error;

      if (!data || data.length === 0) {
        console.log("No reservations found, using empty array");
        setEvents([]);
        return;
      }

      // Convert to calendar events
      const calendarEvents = data.map((reservation) => ({
        id: reservation.id,
        title: reservation.title,
        start: new Date(reservation.start_date),
        end: new Date(reservation.end_date),
        user_id: reservation.user_id,
        // Use description instead of notes
        notes: reservation.description,
      }));

      console.log("Calendar events:", calendarEvents);
      setEvents(calendarEvents);
    } catch (error) {
      console.error("Error loading reservations:", error);
      // Set events to empty array on error
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSections = async () => {
    setLoading(true);
    try {
      console.log("Fetching sections...");
      const startTime = performance.now();

      const { data, error, status } = await supabase
        .from("manual_sections")
        .select("*")
        .order("order_index");

      const endTime = performance.now();
      console.log(`Sections query completed in ${endTime - startTime}ms`);

      if (error) {
        console.error("Error fetching sections:", error);
        console.error("Status code:", status);
        throw error;
      }

      console.log(`Received ${data?.length || 0} sections`);
      setSections(data || []);

      // If no sections found and no explicit error, log this condition
      if (!data || data.length === 0) {
        console.warn(
          "No sections found in database, this may be expected for new setups"
        );
      }
    } catch (error) {
      console.error("Exception in fetchSections:", error);
      // Set an error state that can be shown to users
      setError(
        "Failed to load sections. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const { error } = await supabase.from("reservations").insert([
        {
          title: formData.title,
          start_date: formData.start_date,
          end_date: formData.end_date,
          description: formData.description,
          user_id: user.id,
        },
      ]);

      if (error) throw error;

      setShowEventForm(false);
      setFormData({ title: "", start_date: "", end_date: "", description: "" });
      fetchEvents();
    } catch (error) {
      console.error("Error creating event:", error);
      alert("Failed to create event. Please try again.");
    }
  };

  return (
    <ProtectedPageWrapper>
      <PermissionGate
        requiredRole="family"
        fallback={<div className="p-8 text-center">Access restricted</div>}
      >
        <div className="py-8 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              {/* Calendar navigation controls */}
              <div className="flex items-center space-x-2">
                <button
                  className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200"
                  onClick={() =>
                    handleNavigate(
                      moment(date).subtract(1, getUnitForView(view)).toDate()
                    )
                  }
                >
                  Back
                </button>

                <button
                  className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200"
                  onClick={() => handleNavigate(new Date())}
                >
                  Today
                </button>

                <button
                  className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200"
                  onClick={() =>
                    handleNavigate(
                      moment(date).add(1, getUnitForView(view)).toDate()
                    )
                  }
                >
                  Next
                </button>

                <h2 className="text-xl font-semibold ml-2">
                  {moment(date).format("MMMM YYYY")}
                </h2>
              </div>

              {/* View type selection */}
              <div className="flex space-x-1">
                <button
                  className={`px-3 py-1 rounded ${
                    view === "month" ? "bg-blue-500 text-white" : "bg-gray-100"
                  }`}
                  onClick={() => handleView("month" as View)}
                >
                  Month
                </button>
                <button
                  className={`px-3 py-1 rounded ${
                    view === "week" ? "bg-blue-500 text-white" : "bg-gray-100"
                  }`}
                  onClick={() => handleView("week" as View)}
                >
                  Week
                </button>
                <button
                  className={`px-3 py-1 rounded ${
                    view === "day" ? "bg-blue-500 text-white" : "bg-gray-100"
                  }`}
                  onClick={() => handleView("day" as View)}
                >
                  Day
                </button>
                <button
                  className={`px-3 py-1 rounded ${
                    view === "agenda" ? "bg-blue-500 text-white" : "bg-gray-100"
                  }`}
                  onClick={() => handleView("agenda" as View)}
                >
                  Agenda
                </button>
              </div>

              {/* Different buttons based on permission */}
              {hasPermission("manager") ? (
                <button
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg"
                  onClick={() => setShowEventForm(true)}
                >
                  <PlusIcon className="h-5 w-5 mr-1" />
                  Add Event
                </button>
              ) : (
                <button
                  className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg"
                  onClick={() => setShowRequestForm(true)}
                >
                  Request Time
                </button>
              )}
            </div>

            {/* Make sure calendar has explicit height */}
            <div className={styles.calendarContainer}>
              {loading && !timedOut ? (
                <div>Loading...</div>
              ) : timedOut ? (
                <div className="text-center p-8">
                  <p className="text-red-500">Loading timed out</p>
                  <p className="text-gray-600 mt-1">
                    There might be an issue connecting to the database.
                  </p>
                  <button
                    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md"
                    onClick={() => {
                      setTimedOut(false); // Now this will work
                      setLoading(true);
                      fetchEvents();
                    }}
                  >
                    Retry
                  </button>
                  <button
                    className="mt-4 ml-2 px-4 py-2 border border-gray-300 rounded-md"
                    onClick={() =>
                      (window.location.href = "/admin/diagnostics")
                    }
                  >
                    Run Diagnostics
                  </button>
                </div>
              ) : (
                <Calendar
                  localizer={localizer}
                  events={events}
                  startAccessor="start"
                  endAccessor="end"
                  className={styles.calendarView}
                  date={date}
                  view={view}
                  onNavigate={handleNavigate}
                  onView={handleView}
                />
              )}
            </div>
          </div>
        </div>

        {/* Event form modal */}
        {showEventForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
              <div className="flex justify-between items-center p-4 border-b">
                <h2 className="text-lg font-semibold">Add New Event</h2>
                <button
                  onClick={() => setShowEventForm(false)}
                  className="text-gray-500 hover:text-gray-700"
                  aria-label="Close"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleCreateEvent} className="p-4">
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
                    required
                  />
                </div>

                <div className="mb-4">
                  <label
                    htmlFor="start_date"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Start Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    id="start_date"
                    value={formData.start_date}
                    onChange={(e) =>
                      setFormData({ ...formData, start_date: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label
                    htmlFor="end_date"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    End Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    id="end_date"
                    value={formData.end_date}
                    onChange={(e) =>
                      setFormData({ ...formData, end_date: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-2 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowEventForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Create Event
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Request form modal */}
        {showRequestForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
              <div className="flex justify-between items-center p-4 border-b">
                <h2 className="text-lg font-semibold">Request Reservation</h2>
                <button
                  onClick={() => setShowRequestForm(false)}
                  className="text-gray-500 hover:text-gray-700"
                  aria-label="Close"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleCreateEvent} className="p-4">
                <div className="mb-4">
                  <label
                    htmlFor="request-title"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Title
                  </label>
                  <input
                    type="text"
                    id="request-title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Enter event title"
                    title="Event title"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label
                    htmlFor="request-start-date"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Start Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    id="request-start-date"
                    value={formData.start_date}
                    onChange={(e) =>
                      setFormData({ ...formData, start_date: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    title="Event start date and time"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label
                    htmlFor="request-end-date"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    End Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    id="request-end-date"
                    value={formData.end_date}
                    onChange={(e) =>
                      setFormData({ ...formData, end_date: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    title="Event end date and time"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label
                    htmlFor="request-description"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Description
                  </label>
                  <textarea
                    id="request-description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Describe the purpose of your reservation"
                    title="Event description"
                    rows={3}
                  />
                </div>

                <div className="mt-2 p-3 bg-yellow-50 text-yellow-800 rounded-md mb-4">
                  <p className="text-sm">
                    Your reservation request will be reviewed by management.
                  </p>
                </div>

                <div className="flex justify-end gap-2 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowRequestForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md"
                    title="Cancel request"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    title="Submit reservation request"
                  >
                    Submit Request
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </PermissionGate>
    </ProtectedPageWrapper>
  );
}
