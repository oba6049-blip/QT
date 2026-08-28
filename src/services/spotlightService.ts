import { SpotlightStory } from '../types';

export const getSpotlightStoryById = async (id: string): Promise<SpotlightStory | null> => {
  try {
    const res = await fetch(`/api/spotlight/${id}`);
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`Failed to fetch spotlight story: ${res.statusText}`);
    }
    const data = await res.json();
    return data as SpotlightStory;
  } catch (error) {
    console.error("Error fetching spotlight story:", error);
    return null;
  }
};

export const getSpotlightStories = async (): Promise<SpotlightStory[]> => {
  try {
    const res = await fetch('/api/spotlight');
    if (!res.ok) {
      throw new Error(`Failed to fetch spotlight stories: ${res.statusText}`);
    }
    const data = await res.json();
    return data as SpotlightStory[];
  } catch (error) {
    console.error("Error fetching spotlight stories:", error);
    return [];
  }
};

export const createSpotlightStory = async (storyData: Omit<SpotlightStory, 'id' | 'createdAt'>): Promise<string | undefined> => {
  try {
    const res = await fetch('/api/spotlight', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(storyData),
    });
    if (!res.ok) {
      throw new Error(`Failed to create spotlight story: ${res.statusText}`);
    }
    const data = await res.json();
    return data.id;
  } catch (error) {
    console.error("Error creating spotlight story:", error);
    throw error;
  }
};

export const updateSpotlightStory = async (storyId: string, storyData: Partial<SpotlightStory>): Promise<boolean> => {
  try {
    const res = await fetch(`/api/spotlight/${storyId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(storyData),
    });
    return res.ok;
  } catch (error) {
    console.error("Error updating spotlight story:", error);
    return false;
  }
};

export const deleteSpotlightStory = async (storyId: string): Promise<boolean> => {
  try {
    if (!storyId) {
      throw new Error("Spotlight story ID is required to delete.");
    }
    const res = await fetch(`/api/spotlight/${storyId}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch (error) {
    console.error("Error deleting spotlight story:", error);
    return false;
  }
};

