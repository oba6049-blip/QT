import { Contributor, Article } from '../types';

export interface SearchResults {
  query: string;
  articles: Article[];
  contributors: Contributor[];
  total: number;
}

export const getContributors = async (status?: 'active' | 'inactive' | 'all'): Promise<Contributor[]> => {
  try {
    const url = status ? `/api/contributors?status=${status}` : '/api/contributors';
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to fetch contributors: ${res.statusText}`);
    }
    const data = await res.json();
    return data as Contributor[];
  } catch (error) {
    console.error("Error fetching contributors:", error);
    return [];
  }
};

export const getContributorBySlug = async (slug: string): Promise<Contributor | null> => {
  try {
    const res = await fetch(`/api/contributors/${encodeURIComponent(slug)}`);
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`Failed to fetch contributor: ${res.statusText}`);
    }
    const data = await res.json();
    return data as Contributor;
  } catch (error) {
    console.error("Error fetching contributor by slug:", error);
    return null;
  }
};

export const getContributorById = async (id: string): Promise<Contributor | null> => {
  try {
    const contributors = await getContributors('all');
    return contributors.find((c) => c.id === id || (c as any)._id === id) || null;
  } catch (error) {
    console.error("Error fetching contributor by id:", error);
    return null;
  }
};

export const getContributorArticles = async (slug: string): Promise<Article[]> => {
  try {
    const res = await fetch(`/api/contributors/${encodeURIComponent(slug)}/articles`);
    if (!res.ok) {
      throw new Error(`Failed to fetch contributor articles: ${res.statusText}`);
    }
    const data = await res.json();
    return data as Article[];
  } catch (error) {
    console.error("Error fetching contributor articles:", error);
    return [];
  }
};

export const createContributor = async (contributorData: Partial<Contributor>): Promise<Contributor | null> => {
  try {
    const res = await fetch('/api/contributors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(contributorData),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Failed to create contributor: ${res.statusText}`);
    }
    const data = await res.json();
    return data.contributor || null;
  } catch (error) {
    console.error("Error creating contributor:", error);
    throw error;
  }
};

export const updateContributor = async (id: string, contributorData: Partial<Contributor>): Promise<Contributor | null> => {
  try {
    const res = await fetch(`/api/contributors/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(contributorData),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Failed to update contributor: ${res.statusText}`);
    }
    const data = await res.json();
    return data.contributor || null;
  } catch (error) {
    console.error("Error updating contributor:", error);
    throw error;
  }
};

export const deleteContributor = async (id: string): Promise<boolean> => {
  try {
    const res = await fetch(`/api/contributors/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      throw new Error(`Failed to delete contributor: ${res.statusText}`);
    }
    return true;
  } catch (error) {
    console.error("Error deleting contributor:", error);
    return false;
  }
};

export const searchContent = async (query: string): Promise<SearchResults> => {
  try {
    if (!query || !query.trim()) {
      return { query: "", articles: [], contributors: [], total: 0 };
    }
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) {
      throw new Error(`Search request failed: ${res.statusText}`);
    }
    const data = await res.json();
    return {
      query: data.query || query,
      articles: data.articles || [],
      contributors: data.contributors || [],
      total: data.total || 0,
    };
  } catch (error) {
    console.error("Error performing search:", error);
    return { query, articles: [], contributors: [], total: 0 };
  }
};
