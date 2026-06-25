import salon1 from "@/assets/salon-1.jpg";
import salon2 from "@/assets/salon-2.jpg";
import salon3 from "@/assets/salon-3.jpg";
import salon4 from "@/assets/salon-4.jpg";
import salon5 from "@/assets/salon-5.jpg";
import salon6 from "@/assets/salon-6.jpg";

export const salonImageMap: Record<string, string> = {
  "salon-1": salon1,
  "salon-2": salon2,
  "salon-3": salon3,
  "salon-4": salon4,
  "salon-5": salon5,
  "salon-6": salon6,
};

export const presetImageKeys = [
  "salon-1",
  "salon-2",
  "salon-3",
  "salon-4",
  "salon-5",
  "salon-6",
] as const;

export function resolveSalonImage(key: string): string {
  if (key?.startsWith("http")) return key;
  return salonImageMap[key] ?? salon1;
}

export type SalonService = { name: string; price: number; duration: string };

export type SalonStatus = "pending" | "approved" | "rejected";

export type Salon = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string;
  neighborhood: string;
  address: string;
  phone: string | null;
  image_url: string;
  rating: number;
  review_count: number;
  price_tier: string;
  specialties: string[];
  services: SalonService[];
  hours: string;
  featured: boolean;
  owner_id?: string | null;
  status?: SalonStatus;
  published?: boolean;
  rejection_reason?: string | null;
  max_bookings_per_day?: number;
  max_bookings_per_hour?: number;
  salon_holidays?: string[];
  operating_hours?: Record<string, { open: string; close: string }>;
  email?: string | null;
  website?: string | null;
  instagram?: string | null;
  business_details?: {
    legal_name?: string;
    gst_number?: string;
    upi_id?: string;
    address?: string;
  };
  booking_amount?: number;
};
