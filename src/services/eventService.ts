import { NewsEvent } from '../types';

export const getEventById = async (id: string): Promise<NewsEvent | null> => {
  try {
    const res = await fetch(`/api/events/${id}`);
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`Failed to fetch event: ${res.statusText}`);
    }
    const data = await res.json();
    return data as NewsEvent;
  } catch (error) {
    console.error("Error fetching event:", error);
    return null;
  }
};

export const getEvents = async (): Promise<NewsEvent[]> => {
  try {
    const res = await fetch('/api/events');
    if (!res.ok) {
      throw new Error(`Failed to fetch events: ${res.statusText}`);
    }
    const data = await res.json();
    return data as NewsEvent[];
  } catch (error) {
    console.error("Error fetching events:", error);
    return [];
  }
};

export const createEvent = async (eventData: Omit<NewsEvent, 'id' | 'createdAt'>): Promise<string | undefined> => {
  try {
    const res = await fetch('/api/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData),
    });
    if (!res.ok) {
      throw new Error(`Failed to create event: ${res.statusText}`);
    }
    const data = await res.json();
    return data.id;
  } catch (error) {
    console.error("Error creating event:", error);
    throw error;
  }
};

export const updateEvent = async (eventId: string, eventData: Partial<NewsEvent>): Promise<boolean> => {
  try {
    const res = await fetch(`/api/events/${eventId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData),
    });
    return res.ok;
  } catch (error) {
    console.error("Error updating event:", error);
    return false;
  }
};

export const deleteEvent = async (eventId: string): Promise<boolean> => {
  try {
    if (!eventId) {
      throw new Error("Event ID is required to delete.");
    }
    const res = await fetch(`/api/events/${eventId}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch (error) {
    console.error("Error deleting event:", error);
    return false;
  }
};

