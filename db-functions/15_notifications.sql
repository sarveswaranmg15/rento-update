-- Notifications functions
DROP FUNCTION IF EXISTS public.get_notifications_in_schema(text, text, integer);
CREATE OR REPLACE FUNCTION public.get_notifications_in_schema(p_schema text, p_user_id text, p_limit integer)
RETURNS TABLE(id text, title text, body text, is_read boolean, created_at timestamp with time zone)
LANGUAGE plpgsql STABLE
AS $$
DECLARE
  has_notifs boolean;
  has_user_id boolean;
  has_is_read boolean;
  has_title boolean;
  has_body boolean;
  has_created_at boolean;
  v_sql text;
  v_limit integer := COALESCE(p_limit, 10);
BEGIN
  IF p_schema IS NULL OR trim(p_schema) = '' THEN RETURN; END IF;
  SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = p_schema AND table_name = 'notifications') INTO has_notifs;
  IF NOT has_notifs THEN RETURN; END IF;

  SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = p_schema AND table_name = 'notifications' AND column_name = 'user_id') INTO has_user_id;
  SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = p_schema AND table_name = 'notifications' AND column_name = 'is_read') INTO has_is_read;
  SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = p_schema AND table_name = 'notifications' AND column_name = 'title') INTO has_title;
  SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = p_schema AND table_name = 'notifications' AND column_name = 'body') INTO has_body;
  SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = p_schema AND table_name = 'notifications' AND column_name = 'created_at') INTO has_created_at;

  v_sql := format($SQL$
    SELECT 
      (n.id)::text AS id,
      %1$s AS title,
      %2$s AS body,
      COALESCE(%3$s, FALSE) AS is_read,
      %4$s AS created_at
    FROM %5$I.notifications n
    WHERE %6$s
    ORDER BY %4$s DESC NULLS LAST
    LIMIT $1
  $SQL$,
    CASE WHEN has_title THEN 'n.title' ELSE '''Notification''' END,
    CASE WHEN has_body THEN 'n.body' ELSE 'NULL' END,
    CASE WHEN has_is_read THEN 'n.is_read' ELSE 'FALSE' END,
    CASE WHEN has_created_at THEN 'n.created_at' ELSE 'now()' END,
    p_schema,
    CASE WHEN has_user_id AND p_user_id IS NOT NULL THEN 'n.user_id::text = $2' ELSE 'TRUE' END);

  RETURN QUERY EXECUTE v_sql USING v_limit, p_user_id;
END;
$$;

DROP FUNCTION IF EXISTS public.mark_notifications_read_in_schema(text, text, text, boolean);
CREATE OR REPLACE FUNCTION public.mark_notifications_read_in_schema(p_schema text, p_user_id text, p_notification_id text, p_all boolean)
RETURNS integer
LANGUAGE plpgsql VOLATILE
AS $$
DECLARE
  has_notifs boolean;
  has_user_id boolean;
  cnt integer := 0;
  v_sql text;
BEGIN
  IF p_schema IS NULL OR trim(p_schema) = '' THEN RETURN 0; END IF;
  SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = p_schema AND table_name = 'notifications') INTO has_notifs;
  IF NOT has_notifs THEN RETURN 0; END IF;
  SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = p_schema AND table_name = 'notifications' AND column_name = 'user_id') INTO has_user_id;

  IF p_all THEN
    v_sql := format('UPDATE %I.notifications SET is_read = TRUE WHERE %s', p_schema, CASE WHEN has_user_id THEN 'user_id::text = $1' ELSE 'TRUE' END);
    EXECUTE v_sql USING p_user_id;
    GET DIAGNOSTICS cnt = ROW_COUNT; RETURN cnt;
  END IF;

  IF p_notification_id IS NOT NULL THEN
    v_sql := format('UPDATE %I.notifications SET is_read = TRUE WHERE id::text = $1 %s', p_schema, CASE WHEN has_user_id THEN ' AND user_id::text = $2' ELSE '' END);
    IF has_user_id THEN
      EXECUTE v_sql USING p_notification_id, p_user_id;
    ELSE
      EXECUTE v_sql USING p_notification_id;
    END IF;
    GET DIAGNOSTICS cnt = ROW_COUNT; RETURN cnt;
  END IF;

  RETURN 0;
END;
$$;