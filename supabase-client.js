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
    console.log('getOrCreateUser called with:', { name, email });
    
    if (!supabaseClient) {
        console.log('Supabase client not initialized, initializing now...');
        supabaseClient = await initSupabase();
        if (!supabaseClient) {
            console.error('Failed to initialize Supabase client');
            return null;
        }
        console.log('Supabase client initialized');
    }

    try {
        console.log('Checking if user exists with email:', email);
        
        // Check if user exists
        const { data: existingUser, error: selectError } = await supabaseClient
            .from('users')
            .select('id, name, email')
            .eq('email', email)
            .single();

        console.log('User lookup result:', { existingUser, selectError });

        if (existingUser) {
            console.log('User found in Supabase:', existingUser);
            // Update name if changed
            if (existingUser.name !== name) {
                console.log('Updating user name from', existingUser.name, 'to', name);
                const { error: updateError } = await supabaseClient
                    .from('users')
                    .update({ name: name })
                    .eq('id', existingUser.id);
                
                if (updateError) {
                    console.error('Error updating user name:', updateError);
                } else {
                    existingUser.name = name;
                }
            }
            return existingUser;
        }

        // User doesn't exist, create new user
        console.log('User not found, creating new user...');
        const { data: newUser, error: insertError } = await supabaseClient
            .from('users')
            .insert({ name: name, email: email })
            .select()
            .single();

        console.log('User creation result:', { newUser, insertError });

        if (insertError) {
            console.error('Error creating user:', insertError);
            console.error('Error code:', insertError.code);
            console.error('Error message:', insertError.message);
            console.error('Error details:', insertError.details);
            console.error('Error hint:', insertError.hint);
            
            // Check if it's an RLS policy error
            if (insertError.code === '42501' || insertError.message?.includes('policy') || insertError.message?.includes('RLS')) {
                console.error('RLS policy error - make sure you ran fix-admin-feedback-rls.sql to allow user inserts');
            }
            
            throw insertError;
        }
        
        if (!newUser || !newUser.id) {
            console.error('User created but no ID returned:', newUser);
            throw new Error('User creation succeeded but no ID returned');
        }
        
        console.log('User successfully created in Supabase:', newUser);
        return newUser;
    } catch (error) {
        console.error('Error getting/creating user:', error);
        console.error('Error stack:', error.stack);
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
    console.log('getAllFeedbackForItem called with itemId:', itemId);
    console.log('itemId type:', typeof itemId);
    console.log('itemId value:', itemId);
    
    if (!itemId) {
        console.error('getAllFeedbackForItem: itemId is null or undefined');
        return null;
    }
    
    if (!supabaseClient) {
        supabaseClient = await initSupabase();
        if (!supabaseClient) {
            console.error('Supabase client not initialized');
            return null;
        }
    }

    const currentUser = getCurrentUser();
    console.log('Current user for admin check:', currentUser);
    
    // Check if user is admin - but don't require valid UUID for admin check
    // Admin check is based on email, not user ID
    if (!isAdmin()) {
        console.error('Admin access required. Current user:', currentUser);
        console.error('Is admin?', isAdmin());
        return null;
    }
    
    // Note: Admin query doesn't filter by user_id, so it should work even if current user has local ID

    try {
        console.log('Fetching feedback for item:', itemId);
        console.log('Item ID type:', typeof itemId);
        console.log('Item ID value:', itemId);
        
        // First, let's verify the item exists
        const { data: itemCheck, error: itemError } = await supabaseClient
            .from('gallery_items')
            .select('id, name, folder_path')
            .eq('id', itemId)
            .single();
        
        console.log('Item check result:', { itemCheck, itemError });
        
        // Now get all feedback for the item (no user filter - admin sees all)
        const { data: feedbackData, error: feedbackError } = await supabaseClient
            .from('feedback')
            .select('id, rating, thumbs, notes, created_at, updated_at, user_id')
            .eq('item_id', itemId)
            .order('created_at', { ascending: false });

        console.log('Feedback query result:', { 
            data: feedbackData, 
            error: feedbackError,
            count: feedbackData ? feedbackData.length : 0
        });
        
        // Also try a count query to see if there's any feedback at all
        const { count: feedbackCount, error: countError } = await supabaseClient
            .from('feedback')
            .select('*', { count: 'exact', head: true })
            .eq('item_id', itemId);
        
        console.log('Feedback count query:', { feedbackCount, countError });

        if (feedbackError) {
            console.error('Feedback query error:', feedbackError);
            console.error('Error details:', JSON.stringify(feedbackError, null, 2));
            console.error('Error code:', feedbackError.code);
            console.error('Error message:', feedbackError.message);
            throw feedbackError;
        }
        
        if (!feedbackData || feedbackData.length === 0) {
            console.log('No feedback found for item:', itemId);
            console.log('This could mean:');
            console.log('  1. No users have left feedback for this item yet');
            console.log('  2. The item_id does not match any feedback records');
            console.log('  3. RLS policies might be blocking the query');
            return [];
        }

        console.log('Found', feedbackData.length, 'feedback entries');
        console.log('Sample feedback entry:', feedbackData[0]);

        // Get unique user IDs
        const userIds = [...new Set(feedbackData.map(f => f.user_id).filter(id => id))];
        console.log('User IDs to fetch:', userIds);
        console.log('Number of unique users:', userIds.length);
        
        if (userIds.length === 0) {
            console.warn('No user IDs found in feedback data');
            // Return feedback without user data
            return feedbackData.map(feedback => ({
                ...feedback,
                users: { id: feedback.user_id, name: 'Unknown', email: '' }
            }));
        }
        
        // Fetch user info for all users
        const { data: usersData, error: usersError } = await supabaseClient
            .from('users')
            .select('id, name, email')
            .in('id', userIds);

        console.log('Users query result:', { 
            data: usersData, 
            error: usersError,
            count: usersData ? usersData.length : 0
        });

        if (usersError) {
            console.error('Users query error:', usersError);
            console.error('Error details:', JSON.stringify(usersError, null, 2));
            // Don't throw - return feedback without user data
            console.warn('Continuing without user data due to error');
        }

        // Create a map of user data
        const usersMap = {};
        if (usersData && usersData.length > 0) {
            usersData.forEach(user => {
                usersMap[user.id] = user;
            });
        }
        console.log('Users map:', usersMap);
        console.log('Users map size:', Object.keys(usersMap).length);

        // Combine feedback with user data
        const result = feedbackData.map(feedback => ({
            ...feedback,
            users: usersMap[feedback.user_id] || { id: feedback.user_id, name: 'Unknown User', email: '' }
        }));

        console.log('Final result count:', result.length);
        console.log('Final result sample:', result[0]);
        return result;
    } catch (error) {
        console.error('Error fetching all feedback:', error);
        console.error('Error stack:', error.stack);
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
            .select('id, name, folder_path, icon, display_order, category')
            .order('display_order', { ascending: true })
            .order('name', { ascending: true });

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

// Get item ID from folder path (helper function)
async function getItemIdFromFolderPath(folderPath) {
    if (!supabaseClient) {
        supabaseClient = await initSupabase();
        if (!supabaseClient) return null;
    }

    try {
        const { data, error } = await supabaseClient
            .from('gallery_items')
            .select('id')
            .eq('folder_path', folderPath)
            .single();

        if (error || !data) return null;
        return data.id;
    } catch (error) {
        console.error('Error looking up item ID:', error);
        return null;
    }
}

// Helper function to check if a string is a valid UUID
function isValidUUID(str) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
}

// Get feedback for an item
async function getFeedback(itemId) {
    const user = getCurrentUser();
    if (!supabaseClient || !user) return { rating: 5, thumbs: null, notes: '' };

    // Check if user ID is a valid UUID - if not, skip Supabase query
    if (!isValidUUID(user.id)) {
        console.log('User ID is not a valid UUID, skipping Supabase query:', user.id);
        return { rating: 5, thumbs: null, notes: '' };
    }

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
    console.log('saveFeedback called with:', { itemId, feedback });
    
    const user = getCurrentUser();
    console.log('Current user:', user);
    
    if (!supabaseClient || !user) {
        console.error('User not authenticated or Supabase client not available');
        console.error('supabaseClient:', supabaseClient ? 'exists' : 'null');
        console.error('user:', user);
        return false;
    }

    // Check if user ID is a valid UUID - if not, can't save to Supabase
    if (!isValidUUID(user.id)) {
        console.warn('User ID is not a valid UUID, cannot save to Supabase:', user.id);
        console.warn('User needs to be created in Supabase first. Try logging out and back in.');
        return false;
    }

    // Validate item ID is a valid UUID
    if (!isValidUUID(itemId)) {
        console.error('Item ID is not a valid UUID:', itemId);
        return false;
    }

    try {
        const feedbackData = {
            item_id: itemId,
            user_id: user.id,
            rating: feedback.rating,
            thumbs: feedback.thumbs,
            notes: feedback.notes || null // Ensure null instead of empty string
        };
        
        console.log('Upserting feedback to Supabase:', feedbackData);
        console.log('Item ID type:', typeof itemId, 'is valid UUID:', isValidUUID(itemId));
        console.log('User ID type:', typeof user.id, 'is valid UUID:', isValidUUID(user.id));
        
        const { data, error } = await supabaseClient
            .from('feedback')
            .upsert(feedbackData, {
                onConflict: 'item_id,user_id'
            });

        console.log('Upsert result:', { 
            data, 
            error,
            hasData: !!data,
            errorCode: error?.code,
            errorMessage: error?.message,
            errorDetails: error?.details,
            errorHint: error?.hint
        });

        if (error) {
            console.error('Supabase upsert error:', error);
            console.error('Error code:', error.code);
            console.error('Error message:', error.message);
            console.error('Error details:', error.details);
            console.error('Error hint:', error.hint);
            
            // Check if it's an RLS policy error
            if (error.code === '42501' || error.message?.includes('policy') || error.message?.includes('RLS')) {
                console.error('This looks like an RLS policy error. Make sure you ran fix-feedback-insert-rls.sql');
            }
            
            throw error;
        }
        
        console.log('Feedback saved successfully to Supabase');
        return true;
    } catch (error) {
        console.error('Error saving feedback:', error);
        console.error('Error stack:', error.stack);
        return false;
    }
}

// Note: Supabase initialization happens when functions are called
// Config is loaded via script tag in HTML

