// This file exports TypeScript types and interfaces used throughout the application.

// Type for a reservation in the shared usage calendar
export interface Reservation {
    id: string;
    userId: string;
    startDate: Date;
    endDate: Date;
    createdAt: Date;
    updatedAt: Date;
}

// Type for a task in the task management board
export interface Task {
    id: string;
    title: string;
    description?: string;
    status: 'pending' | 'in-progress' | 'completed';
    assignedTo?: string; // userId of the person assigned to the task
    createdAt: Date;
    updatedAt: Date;
}

// Type for a checklist item
export interface ChecklistItem {
    id: string;
    title: string;
    completed: boolean;
    checklistId: string; // ID of the checklist this item belongs to
    createdAt: Date;
    updatedAt: Date;
}

// Type for a note
export interface Note {
    id: string;
    title: string;
    content: string;
    createdAt: Date;
    updatedAt: Date;
}

// Type for an inventory item
export interface InventoryItem {
    id: string;
    name: string;
    quantity: number;
    createdAt: Date;
    updatedAt: Date;
}

// Type for user authentication
export interface User {
    id: string;
    email: string;
    name?: string;
    createdAt: Date;
    updatedAt: Date;
}