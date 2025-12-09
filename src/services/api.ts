import { supabase, ScrapeData } from '../lib/supabase';

export async function performScrape(
  url: string,
  keywords: string[] = [],
  useGemini: boolean = true
): Promise<{ success: boolean; data?: ScrapeData; error?: string }> {
  try {
    const edgeFunctionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scrape`;
    const annonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${annonKey}`,
      },
      body: JSON.stringify({
        url,
        keywords,
        useGemini,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to scrape website';
    return { success: false, error: errorMessage };
  }
}

export async function saveScrapeWithUser(scrapeData: ScrapeData, userId: string) {
  try {
    const dataToSave = {
      ...scrapeData,
      user_id: userId,
    };

    const { data, error } = await supabase
      .from('scrapes')
      .insert([dataToSave])
      .select()
      .maybeSingle();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Save Error:', error);
    throw new Error('Failed to save scrape to database');
  }
}

export async function getUserScrapes(userId: string) {
  try {
    const { data, error } = await supabase
      .from('scrapes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Get Scrapes Error:', error);
    throw new Error('Failed to fetch scrapes from database');
  }
}

export async function deleteUserScrape(id: string, userId: string) {
  try {
    const { error } = await supabase
      .from('scrapes')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Delete Error:', error);
    throw new Error('Failed to delete scrape from database');
  }
}
