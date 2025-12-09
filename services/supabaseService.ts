
import { supabase } from '../integrations/supabase/client';
import { InventoryItem, ItemRequest, RequestStatus, User, UserRole, Observation, Category } from '../types';

// --- ITEMS & INVENTORY ---

export const getItems = async (): Promise<InventoryItem[]> => {
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .order('name');
  
  if (error) {
    console.error('Error fetching items:', error);
    return [];
  }

  // Map DB columns to our Typescript Interface
  return data.map((item: any) => ({
    ...item,
    // Ensure jsonb fields are parsed correctly if needed, though Supabase client handles JSON auto-parsing
    specifications: item.specifications || {},
    observations: item.observations || []
  }));
};

export const addItem = async (item: Omit<InventoryItem, 'id'>, imageFile?: File, manualFile?: File): Promise<void> => {
  let imageUrl = item.image;
  let manualUrl = item.manualUrl;

  // 1. Upload Image if exists
  if (imageFile) {
    const fileName = `items/${Date.now()}_${imageFile.name}`;
    const { data, error } = await supabase.storage.from('inventory').upload(fileName, imageFile);
    if (!error && data) {
      const { data: publicUrl } = supabase.storage.from('inventory').getPublicUrl(fileName);
      imageUrl = publicUrl.publicUrl;
    }
  }

  // 2. Upload Manual if exists
  if (manualFile) {
    const fileName = `manuals/${Date.now()}_${manualFile.name}`;
    const { data, error } = await supabase.storage.from('inventory').upload(fileName, manualFile);
    if (!error && data) {
      const { data: publicUrl } = supabase.storage.from('inventory').getPublicUrl(fileName);
      manualUrl = publicUrl.publicUrl;
    }
  }

  // 3. Insert Record
  const { error } = await supabase.from('items').insert([{
    name: item.name,
    category: item.category,
    quantity: item.quantity,
    available: item.available,
    description: item.description,
    specifications: item.specifications,
    image: imageUrl,
    manual_url: manualUrl,
    usage_instructions: item.usageInstructions,
    observations: [] // Start empty
  }]);

  if (error) throw error;
};

export const updateItem = async (item: InventoryItem, imageFile?: File, manualFile?: File): Promise<void> => {
  let imageUrl = item.image;
  let manualUrl = item.manualUrl;

  // Upload logic similar to add (could be refactored)
  if (imageFile) {
    const fileName = `items/${Date.now()}_${imageFile.name}`;
    const { data, error } = await supabase.storage.from('inventory').upload(fileName, imageFile);
    if (!error && data) {
      const { data: publicUrl } = supabase.storage.from('inventory').getPublicUrl(fileName);
      imageUrl = publicUrl.publicUrl;
    }
  }

  if (manualFile) {
    const fileName = `manuals/${Date.now()}_${manualFile.name}`;
    const { data, error } = await supabase.storage.from('inventory').upload(fileName, manualFile);
    if (!error && data) {
      const { data: publicUrl } = supabase.storage.from('inventory').getPublicUrl(fileName);
      manualUrl = publicUrl.publicUrl;
    }
  }

  const { error } = await supabase.from('items').update({
    name: item.name,
    category: item.category,
    quantity: item.quantity,
    available: item.available, // Be careful updating available if there are active loans
    description: item.description,
    specifications: item.specifications,
    image: imageUrl,
    manual_url: manualUrl,
    usage_instructions: item.usageInstructions
  }).eq('id', item.id);

  if (error) throw error;
};

// --- OBSERVATIONS ---

export const addObservation = async (itemId: string, observation: Observation, currentObservations: Observation[]) => {
  const newObsList = [observation, ...currentObservations];
  const { error } = await supabase
    .from('items')
    .update({ observations: newObsList })
    .eq('id', itemId);
  
  if (error) throw error;
};

export const deleteObservation = async (itemId: string, obsId: string, currentObservations: Observation[]) => {
  const newObsList = currentObservations.filter(o => o.id !== obsId);
  const { error } = await supabase
    .from('items')
    .update({ observations: newObsList })
    .eq('id', itemId);

  if (error) throw error;
};

// --- REQUESTS ---

export const getRequests = async (): Promise<ItemRequest[]> => {
  const { data, error } = await supabase
    .from('requests')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error(error);
    return [];
  }

  // Transform snake_case DB to camelCase Interface
  return data.map((r: any) => ({
    id: r.id,
    userId: r.user_id,
    userName: r.user_name,
    itemId: r.item_id,
    itemName: r.item_name,
    quantity: r.quantity,
    status: r.status as RequestStatus,
    requestDate: r.created_at,
    notes: r.notes
  }));
};

export const createRequest = async (userId: string, userName: string, item: InventoryItem, quantity: number, notes: string, status: RequestStatus) => {
  // 1. Create Request
  const { error: reqError } = await supabase.from('requests').insert([{
    user_id: userId,
    user_name: userName,
    item_id: item.id,
    item_name: item.name,
    quantity: quantity,
    status: status,
    notes: notes
  }]);

  if (reqError) throw reqError;

  // 2. If Auto-Approved (Supervisor), deduct stock immediately
  if (status === RequestStatus.APPROVED) {
    const { error: updateError } = await supabase
      .from('items')
      .update({ available: item.available - quantity })
      .eq('id', item.id);
    
    if (updateError) console.error("Error updating stock on auto-approve", updateError);
  }
};

export const updateRequestStatus = async (requestId: string, newStatus: RequestStatus, request: ItemRequest, currentItemAvailable: number) => {
  // Update Request
  const { error } = await supabase
    .from('requests')
    .update({ status: newStatus })
    .eq('id', requestId);

  if (error) throw error;

  // Handle Stock Movement
  let newStock = currentItemAvailable;
  
  // Logic: 
  // PENDING -> APPROVED: Decrease Stock
  // APPROVED -> RETURNED: Increase Stock
  // APPROVED -> REJECTED: Increase Stock (revert)

  if (request.status === 'PENDING' && newStatus === 'APPROVED') {
    newStock = currentItemAvailable - request.quantity;
  } else if (request.status === 'APPROVED' && (newStatus === 'RETURNED' || newStatus === 'REJECTED')) {
    newStock = currentItemAvailable + request.quantity;
  } else {
    return; // No stock change needed for other transitions
  }

  const { error: stockError } = await supabase
    .from('items')
    .update({ available: newStock })
    .eq('id', request.itemId);

  if (stockError) console.error("Error updating stock", stockError);
};

export const clearAllRequests = async () => {
  // Only for admin cleanup
  const { error } = await supabase.from('requests').delete().neq('id', '00000000-0000-0000-0000-000000000000'); 
  if (error) throw error;
}

// --- USERS ---

export const getProfiles = async (): Promise<User[]> => {
  const { data, error } = await supabase.from('profiles').select('*');
  if (error) return [];
  
  return data.map((p: any) => ({
    id: p.id,
    email: p.email || 'Sin Email',
    name: p.full_name || 'Sin Nombre',
    role: p.role as UserRole,
    avatar: p.avatar_url
  }));
};

export const deleteUser = async (userId: string) => {
  // Note: This only deletes the profile. Deleting the actual Auth User requires Admin API (Service Role).
  // For this client-side demo, we delete the profile which effectively hides them from the "Equipo" list
  // and would break their RLS access if policies rely on the profile existence.
  const { error } = await supabase.from('profiles').delete().eq('id', userId);
  if (error) throw error;
};
