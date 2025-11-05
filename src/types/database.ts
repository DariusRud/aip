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
      profiles: {
        Row: {
          id: string;
          email: string;
          role: 'admin' | 'user';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          role?: 'admin' | 'user';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          role?: 'admin' | 'user';
          created_at?: string;
          updated_at?: string;
        };
      };
      product_categories: {
        Row: {
          id: string;
          name: string;
          parent_id: string | null;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          parent_id?: string | null;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          parent_id?: string | null;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      uploaded_documents: {
        Row: {
          id: string;
          file_url: string | null;
          file_name: string | null;
          file_type: string;
          status: 'pending' | 'approved' | 'rejected';
          extracted_data: any;
          company_id: string | null;
          supplier_name: string | null;
          supplier_code: string | null;
          invoice_number: string;
          invoice_date: string;
          due_date: string | null;
          amount_no_vat: number;
          vat_amount: number;
          total_amount: number;
          currency: string;
          warnings: any;
          is_duplicate: boolean;
          notes: string | null;
          user_id: string;
          approved_by: string | null;
          approved_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          file_url?: string | null;
          file_name?: string | null;
          file_type?: string;
          status?: 'pending' | 'approved' | 'rejected';
          extracted_data?: any;
          company_id?: string | null;
          supplier_name?: string | null;
          supplier_code?: string | null;
          invoice_number: string;
          invoice_date: string;
          due_date?: string | null;
          amount_no_vat?: number;
          vat_amount?: number;
          total_amount: number;
          currency?: string;
          warnings?: any;
          is_duplicate?: boolean;
          notes?: string | null;
          user_id: string;
          approved_by?: string | null;
          approved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          file_url?: string | null;
          file_name?: string | null;
          file_type?: string;
          status?: 'pending' | 'approved' | 'rejected';
          extracted_data?: any;
          company_id?: string | null;
          supplier_name?: string | null;
          supplier_code?: string | null;
          invoice_number?: string;
          invoice_date?: string;
          due_date?: string | null;
          amount_no_vat?: number;
          vat_amount?: number;
          total_amount?: number;
          currency?: string;
          warnings?: any;
          is_duplicate?: boolean;
          notes?: string | null;
          user_id?: string;
          approved_by?: string | null;
          approved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      document_items: {
        Row: {
          id: string;
          document_id: string;
          line_number: number;
          description: string;
          supplier_product_code: string | null;
          quantity: number;
          unit: string;
          unit_price: number;
          vat_rate: number;
          amount_no_vat: number;
          amount_with_vat: number;
          category_id: string | null;
          match_confidence: number;
          match_type: 'exact' | 'fuzzy' | 'manual' | 'none' | null;
          suggested_categories: any;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          document_id: string;
          line_number?: number;
          description: string;
          supplier_product_code?: string | null;
          quantity?: number;
          unit?: string;
          unit_price?: number;
          vat_rate?: number;
          amount_no_vat?: number;
          amount_with_vat?: number;
          category_id?: string | null;
          match_confidence?: number;
          match_type?: 'exact' | 'fuzzy' | 'manual' | 'none' | null;
          suggested_categories?: any;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          document_id?: string;
          line_number?: number;
          description?: string;
          supplier_product_code?: string | null;
          quantity?: number;
          unit?: string;
          unit_price?: number;
          vat_rate?: number;
          amount_no_vat?: number;
          amount_with_vat?: number;
          category_id?: string | null;
          match_confidence?: number;
          match_type?: 'exact' | 'fuzzy' | 'manual' | 'none' | null;
          suggested_categories?: any;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};
