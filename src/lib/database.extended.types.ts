import { Database } from './database.types';

declare global {
  type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

  // Extend the Database interface with our custom functions
  interface ExtendedDatabase extends Database {
    public: Database['public'] & {
      Functions: Database['public']['Functions'] & {
        update_order_status: {
          Args: {
            p_order_id: string;
            p_new_status: Database['public']['Enums']['order_status'];
            p_user_id: string;
          };
          Returns: void;
        };
        has_kiosquero_or_admin_role: {
          Args: Record<string, never>;
          Returns: boolean;
        };
        test_rls_permissions: {
          Args: Record<string, never>;
          Returns: Array<{
            table_name: string;
            can_select: boolean;
            can_insert: boolean;
            can_update: boolean;
            can_delete: boolean;
          }>;
        };
      };
    };
  }
}

// This exports the extended type that includes our custom functions
export type { ExtendedDatabase as Database };

// This makes the types available globally when this file is imported
export {};
