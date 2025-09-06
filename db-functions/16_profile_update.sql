-- Simplified profile update: update by user id and return rows updated
DROP FUNCTION IF EXISTS public.update_profile_in_schema(text, text, text, text, text, text, text);
DROP FUNCTION IF EXISTS public.update_profile_in_schema(text, text, text, text, text, text, text, text);

CREATE OR REPLACE FUNCTION public.update_profile_in_schema(
  p_schema text,
  p_user_id text,
  p_first_name text,
  p_last_name text,
  p_phone text,
  p_email text,
  p_avatar_url text,                -- kept for API compatibility; not used
  p_avatar_image_base64 text         -- new: base64 image data (data URI format optional)
)
RETURNS integer
LANGUAGE plpgsql VOLATILE
AS $$
DECLARE
  v_rows integer := 0;
BEGIN
  IF p_schema IS NULL OR length(trim(p_schema)) = 0 OR p_user_id IS NULL THEN
    RETURN 0;
  END IF;

  -- Attempt full update including profile_image from base64
  BEGIN
    EXECUTE format($SQL$
      UPDATE %I.users
      SET
        first_name = COALESCE($1, first_name),
        last_name  = COALESCE($2, last_name),
        phone      = COALESCE($3, phone),
        email      = COALESCE($4, email),
        profile_image = $5,
        updated_at = now()
      WHERE id::text = $6
    $SQL$, p_schema)
    USING p_first_name, p_last_name, p_phone, p_email, p_avatar_image_base64, p_user_id;

    GET DIAGNOSTICS v_rows = ROW_COUNT;
    RETURN v_rows;
  EXCEPTION
    WHEN undefined_table OR undefined_column THEN
      -- Fallback if profile_image or updated_at do not exist
      EXECUTE format($SQL$
        UPDATE %I.users
        SET
          first_name = COALESCE($1, first_name),
          last_name  = COALESCE($2, last_name),
          phone      = COALESCE($3, phone),
          email      = COALESCE($4, email)
        WHERE id::text = $5
      $SQL$, p_schema)
      USING p_first_name, p_last_name, p_phone, p_email, p_user_id;

      GET DIAGNOSTICS v_rows = ROW_COUNT;
      RETURN v_rows;
  END;
END;
$$;