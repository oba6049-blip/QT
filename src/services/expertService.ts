import { Expert } from '../types';

export const getExpertById = async (id: string): Promise<Expert | null> => {
  try {
    const res = await fetch(`/api/experts/${id}`);
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`Failed to fetch expert: ${res.statusText}`);
    }
    const data = await res.json();
    return data as Expert;
  } catch (error) {
    console.error("Error fetching expert:", error);
    return null;
  }
};

export const getExperts = async (): Promise<Expert[]> => {
  try {
    const res = await fetch('/api/experts');
    if (!res.ok) {
      throw new Error(`Failed to fetch experts: ${res.statusText}`);
    }
    const data = await res.json();
    return data as Expert[];
  } catch (error) {
    console.error("Error fetching experts:", error);
    return [];
  }
};

export const createExpert = async (expertData: Omit<Expert, 'id' | 'createdAt'>): Promise<string | undefined> => {
  try {
    const res = await fetch('/api/experts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(expertData),
    });
    if (!res.ok) {
      throw new Error(`Failed to create expert: ${res.statusText}`);
    }
    const data = await res.json();
    return data.id;
  } catch (error) {
    console.error("Error creating expert:", error);
    throw error;
  }
};

export const updateExpert = async (expertId: string, expertData: Partial<Expert>): Promise<boolean> => {
  try {
    const res = await fetch(`/api/experts/${expertId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(expertData),
    });
    return res.ok;
  } catch (error) {
    console.error("Error updating expert:", error);
    return false;
  }
};

export const deleteExpert = async (expertId: string): Promise<boolean> => {
  try {
    if (!expertId) {
      throw new Error("Expert ID is required to delete.");
    }
    const res = await fetch(`/api/experts/${expertId}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch (error) {
    console.error("Error deleting expert:", error);
    return false;
  }
};

