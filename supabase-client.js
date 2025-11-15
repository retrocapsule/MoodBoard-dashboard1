// Supabase Client Setup
// This file handles Supabase initialization and provides helper functions

let supabaseClient = null;

// Initialize Supabase client
async function initSupabase() {
    if (typeof SUPABASE_CONFIG === 'undefined' || !SUPABASE_CONFIG.url || !SUPABASE_CONFIG.anonKey) {
        console.warn('Supabase not configured. Using fallback mode.');
        return null;
    }

    // If already initialized, return it
    if (supabaseClient) {
        return supabaseClient;
    }

    // Load Supabase JS library dynamically if not already loaded
    return new Promise((resolve) => {
        if (typeof supabase !== 'undefined') {
            supabaseClient = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
            resolve(supabaseClient);
        } else {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
            script.onload = () => {
                if (typeof supabase !== 'undefined') {
                    supabaseClient = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
                    resolve(supabaseClient);
                } else {
                    console.warn('Supabase library loaded but supabase object not found');
                    resolve(null);
                }
            };
            script.onerror = () => {
                console.warn('Failed to load Supabase library');
                resolve(null);
            };
            document.head.appendChild(script);
        }
    });
}

// Get or create user
async function getOrCreateUser(name, email) {
    if (!supabaseClient) {
        supabaseClient = await initSupabase();
        if (!supabaseClient) return null;
    }

    try {
        // Check if user exists
        const { data: existingUser } = await supabaseClient
            .from('users')
            .select('id, name, email')
            .eq('email', email)
            .single();

        if (existingUser) {
            // Update name if changed
            if (existingUser.name !== name) {
                await supabaseClient
                    .from('users')
                    .update({ name: name })
                    .eq('id', existingUser.id);
            }
            return existingUser;
        }

        // Create new user
        const { data: newUser, error } = await supabaseClient
            .from('users')
            .insert({ name: name, email: email })
            .select()
            .single();

        if (error) throw error;
        return newUser;
    } catch (error) {
        console.error('Error getting/creating user:', error);
        return null;
    }
}

// Get current user from localStorage
function getCurrentUser() {
    const userStr = localStorage.getItem('moodboard_user');
    return userStr ? JSON.parse(userStr) : null;
}

// Set current user in localStorage
function setCurrentUser(user) {
    localStorage.setItem('moodboard_user', JSON.stringify(user));
}

// Check if user is authenticated
function isAuthenticated() {
    return getCurrentUser() !== null;
}

// Check if current user is admin
function isAdmin() {
    const user = getCurrentUser();
    return user && user.email === 'gorillaflix@gmail.com';
}

// Logout user
function logoutUser() {
    localStorage.removeItem('moodboard_user');
    window.location.reload();
}

// Get all feedback for an item (admin only - includes user info)
async function getAllFeedbackForItem(itemId) {
    if (!supabaseClient) {
        supabaseClient = await initSupabase();
        if (!supabaseClient) return null;
    }

    if (!isAdmin()) {
        console.error('Admin access required');
        return null;
    }

    try {
        const { data, error } = await supabaseClient
            .from('feedback')
            .select(`
                id,
                rating,
                thumbs,
                notes,
                created_at,
                updated_at,
                users:user_id (
                    id,
                    name,
                    email
                )
            `)
            .eq('item_id', itemId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching all feedback:', error);
        return null;
    }
}

// Get all views for an item (admin only - includes user info)
// Note: This requires tracking views in the database. For now, we'll use a simple approach.
async function getItemViews(itemId) {
    // This would require a views table - for now return empty
    // You can implement this later if needed
    return [];
}

// Fetch sections from Supabase
async function fetchSections() {
    if (!supabaseClient) {
        supabaseClient = await initSupabase();
        if (!supabaseClient) return null;
    }

    try {
        const { data, error } = await supabaseClient
            .from('sections')
            .select('id, name, folder_path, icon')
            .order('name');

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error fetching sections:', error);
        return null;
    }
}

// Fetch gallery items for a section
async function fetchGalleryItems(sectionFolder) {
    if (!supabaseClient) {
        supabaseClient = await initSupabase();
        if (!supabaseClient) return null;
    }

    try {
        // First get section by folder_path
        const { data: section, error: sectionError } = await supabaseClient
            .from('sections')
            .select('id')
            .eq('folder_path', sectionFolder)
            .single();

        if (sectionError || !section) return null;

        // Get items for this section
        const { data: items, error: itemsError } = await supabaseClient
            .from('gallery_items')
            .select('id, folder_path, name, html_path, thumbnail_path')
            .eq('section_id', section.id)
            .order('display_order');

        if (itemsError) throw itemsError;

        // Transform to match expected format
        return items.map(item => ({
            folder: item.folder_path,
            name: item.name,
            html: item.html_path,
            thumbnail: item.thumbnail_path,
            id: item.id
        }));
    } catch (error) {
        console.error('Error fetching gallery items:', error);
        return null;
    }
}

// Get feedback for an item
async function getFeedback(itemId) {
    const user = getCurrentUser();
    if (!supabaseClient || !user) return { rating: 5, thumbs: null, notes: '' };

    try {
        const { data, error } = await supabaseClient
            .from('feedback')
            .select('rating, thumbs, notes')
            .eq('item_id', itemId)
            .eq('user_id', user.id)
            .single();

        if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
        
        return data || { rating: 5, thumbs: null, notes: '' };
    } catch (error) {
        console.error('Error fetching feedback:', error);
        return { rating: 5, thumbs: null, notes: '' };
    }
}

// Save feedback for an item
async function saveFeedback(itemId, feedback) {
    const user = getCurrentUser();
    if (!supabaseClient || !user) {
        console.error('User not authenticated');
        return false;
    }

    try {
        const { error } = await supabaseClient
            .from('feedback')
            .upsert({
                item_id: itemId,
                user_id: user.id,
                rating: feedback.rating,
                thumbs: feedback.thumbs,
                notes: feedback.notes
            }, {
                onConflict: 'item_id,user_id'
            });

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error saving feedback:', error);
        return false;
    }
}

// Note: Supabase initialization happens when functions are called
// Config is loaded via script tag in HTML

