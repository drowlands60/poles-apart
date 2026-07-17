export type UserRole = "admin" | "cleaner";

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface Round {
  id: string;
  name: string;
  description: string | null;
  day_of_week: number | null;
  frequency_weeks: number;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  round_id: string | null;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  address_line1: string;
  address_line2: string | null;
  city: string;
  postcode: string;
  latitude: number | null;
  longitude: number | null;
  price: number;
  notes: string | null;
  position_in_round: number | null;
  is_active: boolean;
  sms_opt_in: boolean;
  created_at: string;
  updated_at: string;
}

export type JobStatus = "scheduled" | "completed" | "skipped" | "cancelled";

export interface Job {
  id: string;
  customer_id: string;
  round_id: string | null;
  cleaner_id: string | null;
  scheduled_date: string;
  status: JobStatus;
  price: number;
  notes: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  customer_id: string;
  amount: number;
  method: "cash" | "bank_transfer" | "card" | "other";
  notes: string | null;
  payment_date: string;
  created_at: string;
}

export interface SmsLog {
  id: string;
  customer_id: string;
  job_id: string | null;
  message_type: "day_before" | "completed" | "custom";
  message_body: string;
  phone_number: string;
  status: "sent" | "failed" | "pending";
  sent_at: string | null;
  error_message: string | null;
  created_at: string;
}

export type RunStatus = "planned" | "in_progress" | "completed";
export type RunCustomerStatus = "pending" | "completed" | "skipped" | "cancelled";

export interface Run {
  id: string;
  round_id: string | null;
  name: string;
  scheduled_date: string;
  status: RunStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface RunCleaner {
  id: string;
  run_id: string;
  cleaner_id: string;
}

export interface RunCustomer {
  id: string;
  run_id: string;
  customer_id: string;
  position: number;
  price: number;
  status: RunCustomerStatus;
  notes: string | null;
  completed_at: string | null;
}

// Extended types with relations
export interface CustomerWithRound extends Customer {
  round: Round | null;
}

export interface JobWithCustomer extends Job {
  customer: Customer;
}

export interface RunWithDetails extends Run {
  round: Round | null;
  run_cleaners: (RunCleaner & { profiles: Profile })[];
  run_customers: (RunCustomer & { customers: Customer })[];
}
