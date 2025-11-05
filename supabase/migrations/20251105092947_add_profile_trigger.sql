/*
  # Add automatic profile creation trigger

  1. Changes
    - Create function to automatically insert profile when user signs up
    - Create trigger that calls this function on auth.users insert
    - Manually insert missing profiles for existing users

  2. Security
    - Function runs with security definer privileges to bypass RLS
*/

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Create trigger to automatically create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert profiles for existing users that don't have profiles yet
INSERT INTO public.profiles (id, email, role)
SELECT 
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'role', 'user')
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = u.id
)
ON CONFLICT (id) DO NOTHING;