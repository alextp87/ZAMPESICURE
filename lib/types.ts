export type AnimalType = "cane" | "gatto" | "volatile"

export type ReportType = "smarrito" | "avvistato"

export interface Report {
  id: string
  user_id?: string
  report_type: ReportType
  animal_type: AnimalType
  animal_name?: string
  description: string
  latitude: number
  longitude: number
  address: string
  city: string
  contact_name: string
  contact_phone?: string
  contact_email: string
  is_anonymous?: boolean
  image_url?: string
  ip_address?: string
  show_phone?: boolean
  views_count?: number
  created_at: string
  updated_at: string
  status: "active" | "resolved"
  // Joined user profile data
  profiles?: {
    first_name: string | null
    last_name: string | null
  }
}

export interface ReportFlag {
  id: string
  report_id: string
  user_id?: string
  reason: string
  status: "pending" | "reviewed" | "dismissed"
  admin_notes?: string
  created_at: string
  reviewed_at?: string
  reviewed_by?: string
}

export interface Message {
  id: string
  report_id: string
  sender_name: string
  sender_email: string
  message: string
  is_read: boolean
  created_at: string
}

export interface Conversation {
  id: string
  participant_1: string
  participant_2: string
  report_id?: string
  last_message_at: string
  created_at: string
  // Joined data
  other_user?: {
    id: string
    first_name: string | null
    last_name: string | null
  }
  report?: {
    animal_name: string | null
    animal_type: AnimalType
    report_type: ReportType
  }
  last_message?: ChatMessage
  unread_count?: number
}

export interface ChatMessage {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  is_read: boolean
  created_at: string
  sender?: {
    first_name: string | null
    last_name: string | null
  }
}

export const animalTypeLabels: Record<AnimalType, string> = {
  cane: "Cane",
  gatto: "Gatto",
  volatile: "Volatile",
}

export const reportTypeLabels: Record<ReportType, string> = {
  smarrito: "Ho Smarrito",
  avvistato: "Ho Avvistato",
}

export const animalTypeIcons: Record<AnimalType, string> = {
  cane: "dog",
  gatto: "cat",
  volatile: "bird",
}

export interface UserPetPhoto {
  id: string
  pet_id: string
  url: string
  created_at: string
}

export interface UserPet {
  id: string
  user_id: string
  name: string
  animal_type: AnimalType
  breed?: string
  birth_date?: string
  photo_url?: string
  user_pet_photos?: UserPetPhoto[]
  created_at: string
  updated_at: string
}

export interface SponsorRequest {
  id: string
  company_name: string
  contact_name: string
  email: string
  phone: string | null
  website: string | null
  business_type: string
  message: string
  status: "pending" | "approved" | "rejected"
  admin_notes: string | null
  created_at: string
  updated_at: string
}

export interface Partner {
  id: string
  company_name: string
  business_type: string
  description: string | null
  address: string
  city: string
  phone: string | null
  email: string | null
  website: string | null
  logo_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface PartnerOffer {
  id: string
  partner_id: string
  title: string
  description: string
  discount_percentage: number
  offer_type: "discount" | "free_service" | "bundle" | "special"
  target_animals: AnimalType[]
  terms_conditions: string | null
  valid_until: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}