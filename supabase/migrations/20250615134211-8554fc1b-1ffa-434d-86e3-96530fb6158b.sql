
CREATE OR REPLACE FUNCTION increment_session_views(p_session_token TEXT)
RETURNS void AS $$
BEGIN
  UPDATE public.viewing_sessions
  SET current_views = current_views + 1
  WHERE session_token = p_session_token;
END;
$$ LANGUAGE plpgsql;
