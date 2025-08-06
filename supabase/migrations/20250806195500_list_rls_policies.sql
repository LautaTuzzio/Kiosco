-- Function to list all RLS policies
CREATE OR REPLACE FUNCTION list_rls_policies()
RETURNS TABLE (
  schemaname text,
  tablename text,
  policyname text,
  permissive text,
  cmd text,
  roles text[],
  using text,
  with_check text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    n.nspname::text as schemaname,
    c.relname::text as tablename,
    pol.polname::text as policyname,
    CASE WHEN pol.polpermissive THEN 'PERMISSIVE' ELSE 'RESTRICTIVE' END as permissive,
    CASE 
      WHEN pol.polcmd = 'r' THEN 'SELECT'
      WHEN pol.polcmd = 'a' THEN 'INSERT'
      WHEN pol.polcmd = 'w' THEN 'UPDATE'
      WHEN pol.polcmd = 'd' THEN 'DELETE'
      WHEN pol.polcmd = '*' THEN 'ALL'
    END as cmd,
    ARRAY(
      SELECT rolname 
      FROM pg_roles 
      WHERE oid = ANY(pol.polroles)
    ) as roles,
    pg_get_expr(pol.polqual, pol.polrelid) as using,
    pg_get_expr(pol.polwithcheck, pol.polrelid) as with_check
  FROM pg_policy pol
  JOIN pg_class c ON pol.polrelid = c.oid
  JOIN pg_namespace n ON c.relnamespace = n.oid
  WHERE n.nspname = 'public'
  ORDER BY 1, 2, 3;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION list_rls_policies() TO authenticated;
