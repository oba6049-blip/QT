import { Article } from '../types';

export const getArticleById = async (id: string): Promise<Article | null> => {
  try {
    const res = await fetch(`/api/articles/${id}`);
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`Failed to fetch article: ${res.statusText}`);
    }
    const data = await res.json();
    return data as Article;
  } catch (error) {
    console.error("Error fetching article:", error);
    return null;
  }
};

export const getArticles = async (featuredOnly = false): Promise<Article[]> => {
  try {
    const url = featuredOnly ? '/api/articles?featured=true' : '/api/articles';
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to fetch articles: ${res.statusText}`);
    }
    const data = await res.json();
    return data as Article[];
  } catch (error) {
    console.error("Error fetching articles:", error);
    return [];
  }
};

export const getArticlesByCategory = async (category: string): Promise<Article[]> => {
  try {
    const res = await fetch(`/api/articles?category=${encodeURIComponent(category)}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch category articles: ${res.statusText}`);
    }
    const data = await res.json();
    return data as Article[];
  } catch (error) {
    console.error("Error fetching articles by category:", error);
    return [];
  }
};

export const getTrendingArticles = async (): Promise<Article[]> => {
  try {
    const res = await fetch('/api/articles?trending=true');
    if (!res.ok) {
      throw new Error(`Failed to fetch trending articles: ${res.statusText}`);
    }
    const data = await res.json();
    return data as Article[];
  } catch (error) {
    console.error("Error fetching trending articles:", error);
    return [];
  }
};

export const createArticle = async (articleData: Omit<Article, 'id' | 'createdAt'>): Promise<string | undefined> => {
  try {
    const res = await fetch('/api/articles', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(articleData),
    });
    if (!res.ok) {
      throw new Error(`Failed to create article: ${res.statusText}`);
    }
    const data = await res.json();
    return data.id;
  } catch (error) {
    console.error("Error creating article:", error);
    throw error;
  }
};

export const updateArticle = async (articleId: string, articleData: Partial<Article>): Promise<boolean> => {
  try {
    const res = await fetch(`/api/articles/${articleId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(articleData),
    });
    return res.ok;
  } catch (error) {
    console.error("Error updating article:", error);
    return false;
  }
};

export const deleteArticle = async (articleId: string): Promise<boolean> => {
  try {
    if (!articleId) {
      throw new Error("Article ID is required to delete.");
    }
    const res = await fetch(`/api/articles/${articleId}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch (error) {
    console.error("Error deleting article:", error);
    return false;
  }
};

export const getArticleBySlug = async (slug: string): Promise<Article | null> => {
  try {
    const res = await fetch(`/api/articles/slug/${encodeURIComponent(slug)}`);
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`Failed to fetch article by slug: ${res.statusText}`);
    }
    const data = await res.json();
    return data as Article;
  } catch (error) {
    console.error("Error fetching article by slug:", error);
    return null;
  }
};

export const getArticlesByContributor = async (contributorId: string): Promise<Article[]> => {
  try {
    const res = await fetch(`/api/articles?contributorId=${encodeURIComponent(contributorId)}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch articles for contributor: ${res.statusText}`);
    }
    const data = await res.json();
    return data as Article[];
  } catch (error) {
    console.error("Error fetching articles by contributor:", error);
    return [];
  }
};

export const seedDatabase = async (_userId?: string): Promise<void> => {
  // Database auto-seeds in backend
  console.log("MongoDB is auto-seeded and active.");
};

