CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
      NULLIF(NEW.raw_user_meta_data->>'name', ''),
      NULLIF(TRIM(CONCAT_WS(' ', NEW.raw_user_meta_data->>'given_name', NEW.raw_user_meta_data->>'family_name')), ''),
      split_part(COALESCE(NEW.email, ''), '@', 1)
    ),
    COALESCE(NEW.email, '')
  )
  ON CONFLICT (id) DO UPDATE
    SET full_name = CASE WHEN COALESCE(public.profiles.full_name,'') = '' THEN EXCLUDED.full_name ELSE public.profiles.full_name END,
        email = CASE WHEN COALESCE(public.profiles.email,'') = '' THEN EXCLUDED.email ELSE public.profiles.email END;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'employee') ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$function$;

UPDATE public.profiles p
SET full_name = COALESCE(
      NULLIF(p.full_name, ''),
      NULLIF(u.raw_user_meta_data->>'full_name', ''),
      NULLIF(u.raw_user_meta_data->>'name', ''),
      NULLIF(TRIM(CONCAT_WS(' ', u.raw_user_meta_data->>'given_name', u.raw_user_meta_data->>'family_name')), ''),
      split_part(COALESCE(u.email, ''), '@', 1)
    ),
    email = COALESCE(NULLIF(p.email, ''), u.email, '')
FROM auth.users u
WHERE u.id = p.id
  AND (COALESCE(p.full_name,'') = '' OR COALESCE(p.email,'') = '');