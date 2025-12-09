export enum UserRole {
  ADMIN = 'ADMIN',
  SUPERVISOR = 'SUPERVISOR',
  USER = 'USER'
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
}

export enum Category {
  RESCUE = 'Rescate',
  MEDICAL = 'Médico',
  COMMS = 'Comunicaciones',
  VEHICLES = 'Vehículos',
  TOOLS = 'Herramientas',
  LOGISTICS = 'Logística'
}

export interface InventoryItem {
  id: string;
  name: string;
  category: Category;
  quantity: number;
  available: number;
  description: string;
  specifications: Record<string, string>; // e.g., { "Voltaje": "220v", "Peso": "5kg" }
  image: string;
  observations: Observation[];
  manualUrl?: string; // URL to PDF
  usageInstructions?: string; // Step by step quick guide
}

export interface Observation {
  id: string;
  date: string;
  author: string;
  text: string;
  type: 'MAINTENANCE' | 'DAMAGE' | 'GENERAL';
}

export enum RequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  RETURNED = 'RETURNED'
}

export interface ItemRequest {
  id: string;
  userId: string;
  userName: string;
  itemId: string;
  itemName: string;
  quantity: number;
  status: RequestStatus;
  requestDate: string;
  returnDate?: string; // Expected return
  actualReturnDate?: string;
  notes?: string;
}

export type ViewState = 'LOGIN' | 'INVENTORY' | 'REQUESTS' | 'AI_ASSISTANT' | 'ITEM_DETAIL' | 'USERS';