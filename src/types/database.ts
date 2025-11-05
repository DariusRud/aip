export type Database = {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string;
          code: string;
          name: string;
          vat_code: string | null;
          address: string | null;
          email: string | null;
          phone: string | null;
          type: 'supplier' | 'client';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          vat_code?: string | null;
          address?: string | null;
          email?: string | null;
          phone?: string | null;
          type: 'supplier' | 'client';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          name?: string;
          vat_code?: string | null;
          address?: string | null;
          email?: string | null;
          phone?: string | null;
          type?: 'supplier' | 'client';
          created_at?: string;
          updated_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          code: string;
          name: string;
          description: string | null;
          unit: string;
          category: string | null;
          rivile_code: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          description?: string | null;
          unit?: string;
          category?: string | null;
          rivile_code?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          name?: string;
          description?: string | null;
          unit?: string;
          category?: string | null;
          rivile_code?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      purchase_invoices: {
        Row: {
          id: string;
          invoice_number: string;
          supplier_id: string | null;
          invoice_date: string;
          due_date: string | null;
          total_amount: number;
          vat_amount: number;
          status: 'uploaded' | 'validated' | 'needs_review' | 'exported';
          file_url: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          invoice_number: string;
          supplier_id?: string | null;
          invoice_date: string;
          due_date?: string | null;
          total_amount?: number;
          vat_amount?: number;
          status?: 'uploaded' | 'validated' | 'needs_review' | 'exported';
          file_url?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          invoice_number?: string;
          supplier_id?: string | null;
          invoice_date?: string;
          due_date?: string | null;
          total_amount?: number;
          vat_amount?: number;
          status?: 'uploaded' | 'validated' | 'needs_review' | 'exported';
          file_url?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      purchase_invoice_lines: {
        Row: {
          id: string;
          invoice_id: string | null;
          product_id: string | null;
          description: string;
          quantity: number;
          unit: string;
          unit_price: number;
          vat_rate: number;
          vat_amount: number;
          total_amount: number;
          status: 'recognized' | 'unrecognized' | 'manual';
          confidence_score: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          invoice_id?: string | null;
          product_id?: string | null;
          description: string;
          quantity?: number;
          unit?: string;
          unit_price?: number;
          vat_rate?: number;
          vat_amount?: number;
          total_amount?: number;
          status?: 'recognized' | 'unrecognized' | 'manual';
          confidence_score?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          invoice_id?: string | null;
          product_id?: string | null;
          description?: string;
          quantity?: number;
          unit?: string;
          unit_price?: number;
          vat_rate?: number;
          vat_amount?: number;
          total_amount?: number;
          status?: 'recognized' | 'unrecognized' | 'manual';
          confidence_score?: number | null;
          created_at?: string;
        };
      };
      sales_invoices: {
        Row: {
          id: string;
          invoice_number: string;
          client_id: string | null;
          invoice_date: string;
          due_date: string | null;
          total_amount: number;
          vat_amount: number;
          status: 'uploaded' | 'validated' | 'needs_review' | 'exported';
          file_url: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          invoice_number: string;
          client_id?: string | null;
          invoice_date: string;
          due_date?: string | null;
          total_amount?: number;
          vat_amount?: number;
          status?: 'uploaded' | 'validated' | 'needs_review' | 'exported';
          file_url?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          invoice_number?: string;
          client_id?: string | null;
          invoice_date?: string;
          due_date?: string | null;
          total_amount?: number;
          vat_amount?: number;
          status?: 'uploaded' | 'validated' | 'needs_review' | 'exported';
          file_url?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      sales_invoice_lines: {
        Row: {
          id: string;
          invoice_id: string | null;
          product_id: string | null;
          description: string;
          quantity: number;
          unit: string;
          unit_price: number;
          vat_rate: number;
          vat_amount: number;
          total_amount: number;
          status: 'recognized' | 'unrecognized' | 'manual';
          confidence_score: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          invoice_id?: string | null;
          product_id?: string | null;
          description: string;
          quantity?: number;
          unit?: string;
          unit_price?: number;
          vat_rate?: number;
          vat_amount?: number;
          total_amount?: number;
          status?: 'recognized' | 'unrecognized' | 'manual';
          confidence_score?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          invoice_id?: string | null;
          product_id?: string | null;
          description?: string;
          quantity?: number;
          unit?: string;
          unit_price?: number;
          vat_rate?: number;
          vat_amount?: number;
          total_amount?: number;
          status?: 'recognized' | 'unrecognized' | 'manual';
          confidence_score?: number | null;
          created_at?: string;
        };
      };
      exports: {
        Row: {
          id: string;
          export_type: 'purchase' | 'sales';
          export_format: 'rivile' | 'csv' | 'excel';
          invoice_count: number | null;
          file_url: string | null;
          status: 'processing' | 'completed' | 'failed';
          created_at: string;
        };
        Insert: {
          id?: string;
          export_type: 'purchase' | 'sales';
          export_format: 'rivile' | 'csv' | 'excel';
          invoice_count?: number | null;
          file_url?: string | null;
          status?: 'processing' | 'completed' | 'failed';
          created_at?: string;
        };
        Update: {
          id?: string;
          export_type?: 'purchase' | 'sales';
          export_format?: 'rivile' | 'csv' | 'excel';
          invoice_count?: number | null;
          file_url?: string | null;
          status?: 'processing' | 'completed' | 'failed';
          created_at?: string;
        };
      };
      activity_log: {
        Row: {
          id: string;
          action: string;
          entity_type: string;
          entity_id: string | null;
          description: string;
          user_name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          description: string;
          user_name?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          action?: string;
          entity_type?: string;
          entity_id?: string | null;
          description?: string;
          user_name?: string;
          created_at?: string;
        };
      };
    };
  };
};
