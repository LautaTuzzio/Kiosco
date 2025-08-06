-- Test function to check RLS permissions
CREATE OR REPLACE FUNCTION test_rls_permissions()
RETURNS TABLE (
  table_name text,
  can_select boolean,
  can_insert boolean,
  can_update boolean,
  can_delete boolean
) AS $$
DECLARE
  r RECORD;
  query text;
  result RECORD;
  test_user_id uuid;
  current_user_role text;
BEGIN
  -- Get current user's role
  SELECT current_role INTO current_user_role;
  
  -- Get current user ID if authenticated
  BEGIN
    test_user_id := auth.uid();
  EXCEPTION WHEN OTHERS THEN
    test_user_id := NULL;
  END;
  
  -- Create temporary table to store results
  CREATE TEMP TABLE temp_results (
    table_name text,
    can_select boolean,
    can_insert boolean,
    can_update boolean,
    can_delete boolean
  );
  
  -- Create test user for role switching if needed
  BEGIN
    CREATE ROLE test_role NOLOGIN NOINHERIT;
  EXCEPTION WHEN duplicate_object THEN
    -- Role already exists, that's fine
  END;
  
  -- Test each table
  FOR r IN 
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    AND table_name IN ('orders', 'inventory_logs', 'products', 'order_items')
  LOOP
    -- Test SELECT
    BEGIN
      EXECUTE format('SELECT 1 FROM %I LIMIT 1', r.table_name);
      INSERT INTO temp_results (table_name, can_select) VALUES (r.table_name, true);
    EXCEPTION WHEN OTHERS THEN
      INSERT INTO temp_results (table_name, can_select) VALUES (r.table_name, false);
    END;
    
    -- Test INSERT (only if not a view and has insert permissions)
    IF r.table_name NOT LIKE '%_view' AND r.table_name NOT LIKE 'pg_%' THEN
      BEGIN
        -- Create a dummy record that might be valid
        IF r.table_name = 'orders' THEN
          EXECUTE format('INSERT INTO %I (id, status) VALUES (''test_' || random()::text || ''', ''pendiente'')', r.table_name);
        ELSIF r.table_name = 'inventory_logs' THEN
          -- Try to find a valid product_id
          EXECUTE 'INSERT INTO ' || quote_ident(r.table_name) || 
                 ' (id, change_type, product_id, quantity_change, reason) ' ||
                 'SELECT ''test_' || random()::text || ''', ''test'', id, 1, ''test'' ' ||
                 'FROM products LIMIT 1';
        ELSE
          EXECUTE format('INSERT INTO %I DEFAULT VALUES', r.table_name);
        END IF;
        
        UPDATE temp_results SET can_insert = true WHERE table_name = r.table_name;
        
        -- Rollback the test insert
        RAISE EXCEPTION 'rollback';
      EXCEPTION 
        WHEN OTHERS THEN
          IF SQLSTATE = '42501' THEN -- permission denied
            UPDATE temp_results SET can_insert = false WHERE table_name = r.table_name;
          ELSIF SQLSTATE = '23505' THEN -- unique violation
            UPDATE temp_results SET can_insert = true WHERE table_name = r.table_name;
          ELSIF SQLSTATE = '23502' OR SQLSTATE = '22P02' THEN -- not null violation or invalid text representation
            UPDATE temp_results SET can_insert = true WHERE table_name = r.table_name;
          ELSIF SQLSTATE = 'P0001' AND SQLERRM = 'rollback' THEN -- our rollback
            -- Do nothing, this is expected
          ELSE
            UPDATE temp_results SET can_insert = NULL WHERE table_name = r.table_name;
          END IF;
      END;
    END IF;
    
    -- Test UPDATE
    BEGIN
      IF r.table_name = 'orders' THEN
        EXECUTE format('UPDATE %I SET updated_at = NOW() WHERE id IN (SELECT id FROM %I LIMIT 1)', 
                      r.table_name, r.table_name);
      ELSIF r.table_name = 'inventory_logs' THEN
        EXECUTE format('UPDATE %I SET reason = reason || '' test'' WHERE id IN (SELECT id FROM %I LIMIT 1)', 
                      r.table_name, r.table_name);
      ELSE
        EXECUTE format('UPDATE %I SET updated_at = NOW() WHERE false', r.table_name);
      END IF;
      
      UPDATE temp_results SET can_update = true WHERE table_name = r.table_name;
    EXCEPTION WHEN OTHERS THEN
      UPDATE temp_results SET can_update = false WHERE table_name = r.table_name;
    END;
    
    -- Test DELETE
    BEGIN
      EXECUTE format('DELETE FROM %I WHERE false', r.table_name);
      UPDATE temp_results SET can_delete = true WHERE table_name = r.table_name;
    EXCEPTION WHEN OTHERS THEN
      UPDATE temp_results SET can_delete = false WHERE table_name = r.table_name;
    END;
  END LOOP;
  
  -- Clean up
  DROP ROLE IF EXISTS test_role;
  
  -- Return results
  RETURN QUERY SELECT * FROM temp_results ORDER BY table_name;
  
  -- Clean up
  DROP TABLE temp_results;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION test_rls_permissions() TO authenticated;
