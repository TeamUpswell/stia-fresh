"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import AuthenticatedLayout from "@/components/AuthenticatedLayout";
import { supabase } from "@/lib/supabase";
import { getMainProperty } from "@/lib/propertyService";
import { ArrowLeft, Calendar, Check, X, ChevronRight } from "lucide-react";
import { toast } from "react-hot-toast";

export default function CleaningHistory() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [property, setProperty] = useState<any>(null);
  const [visits, setVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVisit, setSelectedVisit] = useState<string | null>(searchParams.get("visit"));
  const [visitDetails, setVisitDetails] = useState<any>(null);
  
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const propertyData = await getMainProperty();
        setProperty(propertyData);
        
        if (propertyData?.id) {
          await fetchVisits(propertyData.id);
        }
      } catch (error) {
        console.error("Error loading history:", error);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, []);
  
  useEffect(() => {
    if (selectedVisit) {
      fetchVisitDetails(selectedVisit);
    }
  }, [selectedVisit]);
  
  const fetchVisits = async (propertyId: string) => {
    try {
      const { data, error } = await supabase
        .from('cleaning_visits')
        .select(`
          id, 
          visit_date, 
          status, 
          completed_by, 
          created_at,
          reservations (
            id, 
            title
          )
        `)
        .eq('property_id', propertyId)
        .order('visit_date', { ascending: false });
        
      if (error) throw error;
      
      setVisits(data || []);
      
      // If a visit was passed in URL params, select it
      if (selectedVisit) {
        fetchVisitDetails(selectedVisit);
      }
    } catch (error) {
      console.error("Error fetching visits:", error);
      toast.error("Failed to load cleaning history");
    }
  };
  
  const fetchVisitDetails = async (visitId: string) => {
    try {
      // Get completed tasks for this visit
      const { data: tasks, error: tasksError } = await supabase
        .from('cleaning_visit_tasks')
        .select(`
          id,
          is_completed,
          completed_at,
          completed_by,
          photo_url,
          cleaning_tasks (
            id,
            name,
            room,
            description
          )
        `)
        .eq('visit_id', visitId)
        .order('created_at', { ascending: true });
        
      if (tasksError) throw tasksError;
      
      // Group tasks by room
      const roomTasks: Record<string, any[]> = {};
      
      tasks?.forEach(task => {
        const room = task.cleaning_tasks[0]?.room;
        if (!roomTasks[room]) {
          roomTasks[room] = [];
        }
        roomTasks[room].push(task);
      });
      
      setVisitDetails({
        visitId,
        roomTasks
      });
    } catch (error) {
      console.error("Error fetching visit details:", error);
      toast.error("Failed to load visit details");
    }
  };
  
  // Format room name for display
  const formatRoomName = (roomKey: string) => {
    return roomKey
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  // Get completion stats for a visit
  const getVisitStats = (visit: any) => {
    if (!visitDetails || visitDetails.visitId !== visit.id) return null;
    
    let totalTasks = 0;
    let completedTasks = 0;
    
    Object.values(visitDetails.roomTasks).forEach((tasks) => {
      if (Array.isArray(tasks)) {
        totalTasks += tasks.length;
        completedTasks += tasks.filter(task => task.is_completed).length;
      }
    });
    
    return {
      total: totalTasks,
      completed: completedTasks,
      percentage: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    };
  };
  
  return (
    <AuthenticatedLayout>
      <div className="container mx-auto py-8 px-4">
        <div className="mb-6">
          <Link href="/cleaning" className="flex items-center text-blue-600 hover:text-blue-800">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Cleaning Dashboard
          </Link>
        </div>
        
        <h1 className="text-2xl font-semibold mb-6">Cleaning History</h1>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Visits list */}
            <div className="md:col-span-1">
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-4 bg-blue-50 border-b border-blue-100">
                  <h2 className="font-medium">Cleaning Sessions</h2>
                </div>
                
                <div className="divide-y">
                  {visits.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                      No cleaning sessions found
                    </div>
                  ) : (
                    visits.map(visit => (
                      <button
                        key={visit.id}
                        onClick={() => setSelectedVisit(visit.id)}
                        className={`w-full text-left block p-4 ${
                          selectedVisit === visit.id ? 'bg-blue-50' : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">
                              {new Date(visit.visit_date).toLocaleDateString()}
                            </div>
                            
                            {visit.reservations && (
                              <div className="text-sm text-gray-500">
                                {visit.reservations.title}
                              </div>
                            )}
                            
                            <div className="flex items-center mt-1">
                              <Calendar className="h-3 w-3 text-gray-400 mr-1" />
                              <span className="text-xs text-gray-500">
                                {new Date(visit.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center">
                            {visit.status === 'completed' ? (
                              <div className="bg-green-100 text-green-800 text-xs py-1 px-2 rounded-full">
                                Complete
                              </div>
                            ) : (
                              <div className="bg-amber-100 text-amber-800 text-xs py-1 px-2 rounded-full">
                                In Progress
                              </div>
                            )}
                            <ChevronRight className="h-5 w-5 text-gray-400 ml-2" />
                          </div>
                        </div>
                        
                        {/* Show completion progress if this visit is selected */}
                        {selectedVisit === visit.id && visitDetails && (
                          <div className="mt-2">
                            <div className="flex justify-between text-xs text-gray-600 mb-1">
                              <span>Completion</span>
                              <span>{getVisitStats(visit)?.percentage || 0}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div 
                                className="bg-blue-500 h-1.5 rounded-full" 
                                style={{ width: `${getVisitStats(visit)?.percentage || 0}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
            
            {/* Visit details */}
            <div className="md:col-span-2">
              {selectedVisit && visitDetails ? (
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="p-4 bg-blue-50 border-b border-blue-100 flex justify-between">
                    <h2 className="font-medium">Tasks Completed</h2>
                    <div className="text-sm">
                      {getVisitStats(visits.find(v => v.id === selectedVisit))?.completed || 0} / 
                      {getVisitStats(visits.find(v => v.id === selectedVisit))?.total || 0} tasks
                    </div>
                  </div>
                  
                  <div className="p-4">
                    {Object.keys(visitDetails.roomTasks).length === 0 ? (
                      <div className="py-8 text-center text-gray-500">
                        No tasks found for this cleaning session
                      </div>
                    ) : (
                      Object.entries(visitDetails.roomTasks).map(([room, tasks]) => {
                        // Safely check if tasks is an array before rendering
                        if (Array.isArray(tasks)) {
                          return (
                            <div key={room} className="mb-6 last:mb-0">
                              <h3 className="font-medium mb-2 text-gray-800">
                                {formatRoomName(room)}
                              </h3>
                              
                              <div className="bg-gray-50 rounded-md">
                                {tasks.map(task => (
                                  <div key={task.id} className="p-3 border-b border-gray-100 last:border-0">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center">
                                        {task.is_completed ? (
                                          <div className="flex items-center justify-center h-5 w-5 rounded-full bg-green-500 mr-3">
                                            <Check className="h-3 w-3 text-white" />
                                          </div>
                                        ) : (
                                          <div className="flex items-center justify-center h-5 w-5 rounded-full bg-gray-300 mr-3">
                                            <X className="h-3 w-3 text-white" />
                                          </div>
                                        )}
                                        <span className={task.is_completed ? "" : "text-gray-500"}>
                                          {task.cleaning_tasks.name}
                                        </span>
                                      </div>
                                      
                                      {task.is_completed && task.completed_at && (
                                        <div className="text-xs text-gray-500">
                                          {new Date(task.completed_at).toLocaleTimeString([], {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                          })}
                                        </div>
                                      )}
                                    </div>
                                    
                                    {/* Task photo if uploaded */}
                                    {task.photo_url && (
                                      <div className="mt-2 pl-8">
                                        <div className="relative h-24 w-32 rounded overflow-hidden">
                                          <img 
                                            src={task.photo_url} 
                                            alt={`Photo for ${task.cleaning_tasks.name}`}
                                            className="object-cover w-full h-full"
                                          />
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        }
                        return null; // Skip this entry if tasks is not an array
                      })
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-md p-12 text-center">
                  <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-500 mb-1">Select a Cleaning Session</h3>
                  <p className="text-gray-500">
                    Select a cleaning session from the list to view details
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}