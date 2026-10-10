export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type TrackingProviderCode = "mock" | "positron" | "sascar";
export type TrackingProviderStatus = "not_configured" | "mock_active" | "configured" | "error";
export type TrackingDeviceStatus = "active" | "inactive" | "offline";
export type TrackingSyncStatus = "running" | "success" | "error";

export type Database = {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string;
          name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      company_users: {
        Row: {
          id: string;
          company_id: string;
          user_id: string;
          role: "admin" | "member";
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          user_id: string;
          role?: "admin" | "member";
          created_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          user_id?: string;
          role?: "admin" | "member";
          created_at?: string;
        };
        Relationships: [];
      };
      vehicles: {
        Row: {
          id: string;
          company_id: string;
          plate: string;
          brand: string;
          model: string;
          year: number | null;
          capacity_kg: number | null;
          odometer: number;
          status: "available" | "in_trip" | "maintenance" | "inactive";
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          plate: string;
          brand: string;
          model: string;
          year?: number | null;
          capacity_kg?: number | null;
          odometer?: number;
          status?: "available" | "in_trip" | "maintenance" | "inactive";
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          plate?: string;
          brand?: string;
          model?: string;
          year?: number | null;
          capacity_kg?: number | null;
          odometer?: number;
          status?: "available" | "in_trip" | "maintenance" | "inactive";
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      drivers: {
        Row: {
          id: string;
          company_id: string;
          name: string;
          cpf: string;
          phone: string | null;
          license_number: string;
          license_category: string;
          license_expires_at: string;
          active: boolean;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          name: string;
          cpf: string;
          phone?: string | null;
          license_number: string;
          license_category: string;
          license_expires_at: string;
          active?: boolean;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          name?: string;
          cpf?: string;
          phone?: string | null;
          license_number?: string;
          license_category?: string;
          license_expires_at?: string;
          active?: boolean;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      customers: {
        Row: {
          id: string;
          company_id: string;
          legal_name: string;
          trade_name: string | null;
          cnpj: string;
          phone: string | null;
          email: string | null;
          address: string | null;
          city: string | null;
          state: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          legal_name: string;
          trade_name?: string | null;
          cnpj: string;
          phone?: string | null;
          email?: string | null;
          address?: string | null;
          city?: string | null;
          state?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          legal_name?: string;
          trade_name?: string | null;
          cnpj?: string;
          phone?: string | null;
          email?: string | null;
          address?: string | null;
          city?: string | null;
          state?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      trips: {
        Row: {
          id: string;
          company_id: string;
          vehicle_id: string;
          driver_id: string;
          customer_id: string;
          origin: string;
          destination: string;
          planned_departure_at: string;
          actual_departure_at: string | null;
          estimated_arrival_at: string | null;
          actual_arrival_at: string | null;
          freight_value: number;
          status: "scheduled" | "loading" | "in_transit" | "delivered" | "completed" | "cancelled";
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          vehicle_id: string;
          driver_id: string;
          customer_id: string;
          origin: string;
          destination: string;
          planned_departure_at: string;
          actual_departure_at?: string | null;
          estimated_arrival_at?: string | null;
          actual_arrival_at?: string | null;
          freight_value?: number;
          status?: "scheduled" | "loading" | "in_transit" | "delivered" | "completed" | "cancelled";
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          vehicle_id?: string;
          driver_id?: string;
          customer_id?: string;
          origin?: string;
          destination?: string;
          planned_departure_at?: string;
          actual_departure_at?: string | null;
          estimated_arrival_at?: string | null;
          actual_arrival_at?: string | null;
          freight_value?: number;
          status?: "scheduled" | "loading" | "in_transit" | "delivered" | "completed" | "cancelled";
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      trip_expenses: {
        Row: {
          id: string;
          company_id: string;
          trip_id: string;
          expense_type: "fuel" | "toll" | "food" | "parking" | "maintenance" | "other";
          description: string;
          amount: number;
          expense_date: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          trip_id: string;
          expense_type: "fuel" | "toll" | "food" | "parking" | "maintenance" | "other";
          description: string;
          amount: number;
          expense_date?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          trip_id?: string;
          expense_type?: "fuel" | "toll" | "food" | "parking" | "maintenance" | "other";
          description?: string;
          amount?: number;
          expense_date?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      trip_status_history: {
        Row: {
          id: string;
          company_id: string;
          trip_id: string;
          previous_status: "scheduled" | "loading" | "in_transit" | "delivered" | "completed" | "cancelled" | null;
          new_status: "scheduled" | "loading" | "in_transit" | "delivered" | "completed" | "cancelled";
          notes: string | null;
          changed_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          trip_id: string;
          previous_status?: "scheduled" | "loading" | "in_transit" | "delivered" | "completed" | "cancelled" | null;
          new_status: "scheduled" | "loading" | "in_transit" | "delivered" | "completed" | "cancelled";
          notes?: string | null;
          changed_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          trip_id?: string;
          previous_status?: "scheduled" | "loading" | "in_transit" | "delivered" | "completed" | "cancelled" | null;
          new_status?: "scheduled" | "loading" | "in_transit" | "delivered" | "completed" | "cancelled";
          notes?: string | null;
          changed_at?: string;
        };
        Relationships: [];
      };
      tracking_providers: {
        Row: {
          id: string;
          company_id: string;
          name: string;
          code: TrackingProviderCode;
          active: boolean;
          status: TrackingProviderStatus;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          name: string;
          code: TrackingProviderCode;
          active?: boolean;
          status?: TrackingProviderStatus;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          name?: string;
          code?: TrackingProviderCode;
          active?: boolean;
          status?: TrackingProviderStatus;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      tracking_devices: {
        Row: {
          id: string;
          company_id: string;
          vehicle_id: string;
          provider_id: string;
          external_id: string;
          status: TrackingDeviceStatus;
          last_sync_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          vehicle_id: string;
          provider_id: string;
          external_id: string;
          status?: TrackingDeviceStatus;
          last_sync_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          vehicle_id?: string;
          provider_id?: string;
          external_id?: string;
          status?: TrackingDeviceStatus;
          last_sync_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      tracking_positions: {
        Row: {
          id: string;
          company_id: string;
          tracking_device_id: string;
          vehicle_id: string;
          latitude: number;
          longitude: number;
          speed: number;
          ignition: boolean;
          heading: number | null;
          odometer: number | null;
          recorded_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          tracking_device_id: string;
          vehicle_id: string;
          latitude: number;
          longitude: number;
          speed?: number;
          ignition?: boolean;
          heading?: number | null;
          odometer?: number | null;
          recorded_at: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          tracking_device_id?: string;
          vehicle_id?: string;
          latitude?: number;
          longitude?: number;
          speed?: number;
          ignition?: boolean;
          heading?: number | null;
          odometer?: number | null;
          recorded_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      tracking_events: {
        Row: {
          id: string;
          company_id: string;
          tracking_device_id: string;
          event_type: string;
          payload: Json;
          recorded_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          tracking_device_id: string;
          event_type: string;
          payload?: Json;
          recorded_at: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          tracking_device_id?: string;
          event_type?: string;
          payload?: Json;
          recorded_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      tracking_sync_logs: {
        Row: {
          id: string;
          company_id: string;
          provider_id: string;
          status: TrackingSyncStatus;
          message: string | null;
          started_at: string;
          finished_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          provider_id: string;
          status: TrackingSyncStatus;
          message?: string | null;
          started_at?: string;
          finished_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          provider_id?: string;
          status?: TrackingSyncStatus;
          message?: string | null;
          started_at?: string;
          finished_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_company_for_current_user: {
        Args: { company_name: string };
        Returns: string;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
