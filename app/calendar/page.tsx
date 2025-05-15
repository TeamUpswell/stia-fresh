"use client";

import { useState, useEffect } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  BarChart3, 
  CheckCircle, 
  PlusCircle,
  User, 
  Settings, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  Inbox
} from "lucide-react";

import 'react-big-calendar/lib/css/react-big-calendar.css';

// Date-fns setup for calendar
const locales = {
  'en-US': require('date-fns/locale/en-US')
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

// Event interface
interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  description?: string;
  location?: string;
  allDay?: boolean;
  color?: string;
}

export default function CalendarPage() {
  const { user, loading } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState('month');
  const [date, setDate] = useState(new Date());
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [newEvent, setNewEvent] = useState({
    title: '',
    start: new Date(),
    end: new Date(new Date().setHours(new Date().getHours() + 1)),
    description: '',
    location: '',
    allDay: false
  });

  useEffect(() => {
    if (user) {
      fetchEvents();
    }
  }, [user]);

  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', user?.id);

      if (error) {
        throw error;
      }

      if (data) {
        // Transform database events to calendar events
        const calendarEvents = data.map(event => ({
          id: event.id,
          title: event.title,
          start: new Date(event.start_time),
          end: new Date(event.end_time),
          description: event.description,
          location: event.location,
          allDay: event.all_day,
          color: event.color || '#3B82F6' // Default to blue
        }));
        
        setEvents(calendarEvents);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEventSelect = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  const handleSlotSelect = ({ start, end }: { start: Date; end: Date }) => {
    setNewEvent({
      title: '',
      start,
      end,
      description: '',
      location: '',
      allDay: false
    });
    setSelectedEvent(null);
    setShowEventModal(true);
  };

  const handleSaveEvent = async () => {
    try {
      if (!user) return;
      
      const eventData = {
        user_id: user.id,
        title: newEvent.title,
        start_time: newEvent.start.toISOString(),
        end_time: newEvent.end.toISOString(),
        description: newEvent.description,
        location: newEvent.location,
        all_day: newEvent.allDay
      };

      if (selectedEvent) {
        // Update existing event
        const { error } = await supabase
          .from('events')
          .update(eventData)
          .eq('id', selectedEvent.id);

        if (error) throw error;
      } else {
        // Create new event
        const { error } = await supabase
          .from('events')
          .insert([eventData]);

        if (error) throw error;
      }

      // Refresh events
      fetchEvents();
      setShowEventModal(false);
    } catch (error) {
      console.error('Error saving event:', error);
    }
  };

  const handleDeleteEvent = async () => {
    try {
      if (!selectedEvent) return;

      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', selectedEvent.id);

      if (error) throw error;

      // Refresh events
      fetchEvents();
      setShowEventModal(false);
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/auth";
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
          <Link href="/dashboard" className="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-md">
            <BarChart3 className="w-5 h-5 mr-3" />
            Dashboard
          </Link>
          <Link href="/tasks" className="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-md">
            <CheckCircle className="w-5 h-5 mr-3" />
            Tasks
          </Link>
          <Link href="/calendar" className="flex items-center px-4 py-3 text-gray-900 bg-blue-50 rounded-md font-medium">
            <CalendarIcon className="w-5 h-5 mr-3" />
            Calendar
          </Link>
          <Link href="/inventory" className="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-md">
            <Inbox className="w-5 h-5 mr-3" />
            Inventory
          </Link>
        </div>
        
        <div className="p-4 border-t">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{user?.email}</p>
              <p className="text-xs text-gray-500">Owner</p>
            </div>
          </div>
          
          <div className="mt-4 space-y-2">
            <button
              onClick={handleSignOut}
              className="flex items-center w-full px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
            >
              <LogOut className="w-4 h-4 mr-3" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Nav */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b z-10 px-4">
        <div className="flex items-center justify-between h-16">
          <h1 className="text-xl font-semibold text-gray-800">Stia</h1>
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 rounded-md hover:bg-gray-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
        
        {isMenuOpen && (
          <div className="absolute top-16 left-0 right-0 bg-white border-b shadow-lg z-20">
            <div className="py-2">
              <Link href="/dashboard" className="block px-4 py-2 text-gray-600">Dashboard</Link>
              <Link href="/tasks" className="block px-4 py-2 text-gray-600">Tasks</Link>
              <Link href="/calendar" className="block px-4 py-2 text-gray-900 font-medium">Calendar</Link>
              <Link href="/inventory" className="block px-4 py-2 text-gray-600">Inventory</Link>
              <hr className="my-2" />
              <button
                onClick={handleSignOut}
                className="block w-full text-left px-4 py-2 text-gray-600"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="md:p-8 p-4 pt-20 md:pt-8 max-w-7xl mx-auto">
          <header className="mb-6">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
              <button 
                onClick={() => handleSlotSelect({ start: new Date(), end: new Date(new Date().setHours(new Date().getHours() + 1)) })}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md flex items-center"
              >
                <PlusCircle className="w-4 h-4 mr-2" />
                New Event
              </button>
            </div>
          </header>
          
          {/* Calendar Component */}
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="h-[700px]">
              <BigCalendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: '100%' }}
                views={['month', 'week', 'day']}
                onSelectEvent={handleEventSelect}
                onSelectSlot={handleSlotSelect}
                selectable
                popup
                eventPropGetter={(event) => ({
                  style: {
                    backgroundColor: event.color || '#3B82F6',
                    borderRadius: '4px'
                  },
                })}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <h2 className="text-xl font-semibold mb-4">
              {selectedEvent ? 'Edit Event' : 'Create New Event'}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={selectedEvent ? selectedEvent.title : newEvent.title}
                  onChange={(e) => selectedEvent 
                    ? setSelectedEvent({...selectedEvent, title: e.target.value})
                    : setNewEvent({...newEvent, title: e.target.value})
                  }
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="Event title"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start</label>
                  <input
                    type="datetime-local"
                    value={formatDateForInput(selectedEvent ? selectedEvent.start : newEvent.start)}
                    onChange={(e) => {
                      const date = new Date(e.target.value);
                      selectedEvent 
                        ? setSelectedEvent({...selectedEvent, start: date})
                        : setNewEvent({...newEvent, start: date});
                    }}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End</label>
                  <input
                    type="datetime-local"
                    value={formatDateForInput(selectedEvent ? selectedEvent.end : newEvent.end)}
                    onChange={(e) => {
                      const date = new Date(e.target.value);
                      selectedEvent 
                        ? setSelectedEvent({...selectedEvent, end: date})
                        : setNewEvent({...newEvent, end: date});
                    }}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  value={selectedEvent ? selectedEvent.location || '' : newEvent.location}
                  onChange={(e) => selectedEvent 
                    ? setSelectedEvent({...selectedEvent, location: e.target.value})
                    : setNewEvent({...newEvent, location: e.target.value})
                  }
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="Event location"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={selectedEvent ? selectedEvent.description || '' : newEvent.description}
                  onChange={(e) => selectedEvent 
                    ? setSelectedEvent({...selectedEvent, description: e.target.value})
                    : setNewEvent({...newEvent, description: e.target.value})
                  }
                  rows={3}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="Event description"
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="allDay"
                  checked={selectedEvent ? selectedEvent.allDay || false : newEvent.allDay}
                  onChange={(e) => selectedEvent 
                    ? setSelectedEvent({...selectedEvent, allDay: e.target.checked})
                    : setNewEvent({...newEvent, allDay: e.target.checked})
                  }
                  className="h-4 w-4 text-blue-600 rounded"
                />
                <label htmlFor="allDay" className="ml-2 text-sm text-gray-700">
                  All day event
                </label>
              </div>
            </div>
            
            <div className="mt-6 flex justify-between">
              <div>
                {selectedEvent && (
                  <button
                    onClick={handleDeleteEvent}
                    className="px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-md"
                  >
                    Delete
                  </button>
                )}
              </div>
              
              <div className="space-x-3">
                <button
                  onClick={() => setShowEventModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md"
                >
                  Cancel
                </button>
                
                <button
                  onClick={handleSaveEvent}
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

// Helper for formatting dates for datetime-local input
function formatDateForInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}
