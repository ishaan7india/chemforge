-- Create profiles table for user data
CREATE TABLE public.profiles (
  id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email text NOT NULL,
  full_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Function to handle new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name'
  );
  RETURN new;
END;
$$;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create reactions database table
CREATE TABLE public.reactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reactant_a text NOT NULL,
  reactant_b text NOT NULL,
  products jsonb NOT NULL,
  reaction_type text NOT NULL,
  enthalpy_change numeric,
  observation text NOT NULL,
  balanced_equation text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- No RLS needed - reactions are public reference data
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reactions"
  ON public.reactions FOR SELECT
  USING (true);

-- Create simulation history table
CREATE TABLE public.simulation_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reactant_a text NOT NULL,
  reactant_b text NOT NULL,
  quantity_a numeric NOT NULL,
  unit_a text NOT NULL,
  quantity_b numeric NOT NULL,
  unit_b text NOT NULL,
  limiting_reagent text NOT NULL,
  products_formed jsonb NOT NULL,
  theoretical_yield numeric NOT NULL,
  balanced_equation text NOT NULL,
  reaction_type text NOT NULL,
  observation text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.simulation_history ENABLE ROW LEVEL SECURITY;

-- History policies
CREATE POLICY "Users can view their own simulations"
  ON public.simulation_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own simulations"
  ON public.simulation_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own simulations"
  ON public.simulation_history FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample reactions data
INSERT INTO public.reactions (reactant_a, reactant_b, products, reaction_type, enthalpy_change, observation, balanced_equation) VALUES
('HCl', 'NaOH', '[{"name": "NaCl", "coefficient": 1, "molar_mass": 58.44}, {"name": "H2O", "coefficient": 1, "molar_mass": 18.02}]', 'Neutralization', -57.3, 'Heat is released. Solution remains clear. No visible change.', 'HCl + NaOH → NaCl + H₂O'),
('H2SO4', 'NaOH', '[{"name": "Na2SO4", "coefficient": 1, "molar_mass": 142.04}, {"name": "H2O", "coefficient": 2, "molar_mass": 18.02}]', 'Neutralization', -111.0, 'Significant heat release. Solution becomes warm.', 'H₂SO₄ + 2NaOH → Na₂SO₄ + 2H₂O'),
('AgNO3', 'NaCl', '[{"name": "AgCl", "coefficient": 1, "molar_mass": 143.32}, {"name": "NaNO3", "coefficient": 1, "molar_mass": 85.0}]', 'Precipitation', 65.5, 'White precipitate forms instantly. Cloudy solution.', 'AgNO₃ + NaCl → AgCl↓ + NaNO₃'),
('Pb(NO3)2', 'KI', '[{"name": "PbI2", "coefficient": 1, "molar_mass": 461.0}, {"name": "KNO3", "coefficient": 2, "molar_mass": 101.1}]', 'Precipitation', -14.8, 'Bright yellow precipitate forms. Very visible reaction.', 'Pb(NO₃)₂ + 2KI → PbI₂↓ + 2KNO₃'),
('BaCl2', 'Na2SO4', '[{"name": "BaSO4", "coefficient": 1, "molar_mass": 233.43}, {"name": "NaCl", "coefficient": 2, "molar_mass": 58.44}]', 'Precipitation', -19.6, 'White precipitate forms immediately. Thick cloudy solution.', 'BaCl₂ + Na₂SO₄ → BaSO₄↓ + 2NaCl'),
('CaCO3', 'HCl', '[{"name": "CaCl2", "coefficient": 1, "molar_mass": 110.98}, {"name": "H2O", "coefficient": 1, "molar_mass": 18.02}, {"name": "CO2", "coefficient": 1, "molar_mass": 44.01}]', 'Gas Evolution', 13.2, 'Vigorous bubbling. CO₂ gas is released. Fizzing sound.', 'CaCO₃ + 2HCl → CaCl₂ + H₂O + CO₂↑'),
('NaHCO3', 'HCl', '[{"name": "NaCl", "coefficient": 1, "molar_mass": 58.44}, {"name": "H2O", "coefficient": 1, "molar_mass": 18.02}, {"name": "CO2", "coefficient": 1, "molar_mass": 44.01}]', 'Gas Evolution', -12.5, 'Rapid effervescence. Bubbles form quickly. CO₂ escapes.', 'NaHCO₃ + HCl → NaCl + H₂O + CO₂↑'),
('Zn', 'HCl', '[{"name": "ZnCl2", "coefficient": 1, "molar_mass": 136.29}, {"name": "H2", "coefficient": 1, "molar_mass": 2.02}]', 'Single Displacement', -153.9, 'Bubbles form on zinc surface. H₂ gas is released. Metal dissolves.', 'Zn + 2HCl → ZnCl₂ + H₂↑'),
('Mg', 'HCl', '[{"name": "MgCl2", "coefficient": 1, "molar_mass": 95.21}, {"name": "H2", "coefficient": 1, "molar_mass": 2.02}]', 'Single Displacement', -456.0, 'Vigorous bubbling. Exothermic reaction. Metal ribbon dissolves rapidly.', 'Mg + 2HCl → MgCl₂ + H₂↑'),
('Fe', 'CuSO4', '[{"name": "FeSO4", "coefficient": 1, "molar_mass": 151.91}, {"name": "Cu", "coefficient": 1, "molar_mass": 63.55}]', 'Single Displacement', -150.7, 'Blue solution turns greenish. Copper deposits on iron. Color change visible.', 'Fe + CuSO₄ → FeSO₄ + Cu'),
('Cu', 'AgNO3', '[{"name": "Cu(NO3)2", "coefficient": 1, "molar_mass": 187.56}, {"name": "Ag", "coefficient": 2, "molar_mass": 107.87}]', 'Single Displacement', -146.0, 'Silver crystals form on copper. Blue solution develops. Metal displacement visible.', 'Cu + 2AgNO₃ → Cu(NO₃)₂ + 2Ag'),
('NaCl', 'AgNO3', '[{"name": "AgCl", "coefficient": 1, "molar_mass": 143.32}, {"name": "NaNO3", "coefficient": 1, "molar_mass": 85.0}]', 'Double Displacement', 65.5, 'White precipitate forms. Classic precipitation reaction.', 'NaCl + AgNO₃ → AgCl↓ + NaNO₃'),
('KBr', 'AgNO3', '[{"name": "AgBr", "coefficient": 1, "molar_mass": 187.77}, {"name": "KNO3", "coefficient": 1, "molar_mass": 101.1}]', 'Precipitation', 84.4, 'Pale yellow precipitate forms. Light-sensitive compound.', 'KBr + AgNO₃ → AgBr↓ + KNO₃'),
('H2', 'O2', '[{"name": "H2O", "coefficient": 2, "molar_mass": 18.02}]', 'Combustion', -483.6, 'Explosive reaction. Water vapor forms. Highly exothermic.', '2H₂ + O₂ → 2H₂O'),
('CH4', 'O2', '[{"name": "CO2", "coefficient": 1, "molar_mass": 44.01}, {"name": "H2O", "coefficient": 2, "molar_mass": 18.02}]', 'Combustion', -890.0, 'Blue flame. Heat and light produced. Complete combustion.', 'CH₄ + 2O₂ → CO₂ + 2H₂O'),
('CuO', 'H2SO4', '[{"name": "CuSO4", "coefficient": 1, "molar_mass": 159.61}, {"name": "H2O", "coefficient": 1, "molar_mass": 18.02}]', 'Acid-Base', -85.2, 'Black powder dissolves. Blue solution forms. Copper sulfate created.', 'CuO + H₂SO₄ → CuSO₄ + H₂O'),
('NH3', 'HCl', '[{"name": "NH4Cl", "coefficient": 1, "molar_mass": 53.49}]', 'Neutralization', -176.0, 'White smoke forms. Dense fumes. Ammonium chloride crystals.', 'NH₃ + HCl → NH₄Cl'),
('Al', 'HCl', '[{"name": "AlCl3", "coefficient": 1, "molar_mass": 133.34}, {"name": "H2", "coefficient": 1.5, "molar_mass": 2.02}]', 'Single Displacement', -1049.0, 'Vigorous reaction. Hydrogen gas evolves rapidly. Aluminum dissolves.', '2Al + 6HCl → 2AlCl₃ + 3H₂↑'),
('Na2CO3', 'HCl', '[{"name": "NaCl", "coefficient": 2, "molar_mass": 58.44}, {"name": "H2O", "coefficient": 1, "molar_mass": 18.02}, {"name": "CO2", "coefficient": 1, "molar_mass": 44.01}]', 'Gas Evolution', 21.0, 'Effervescence. CO₂ bubbles released. Fizzing reaction.', 'Na₂CO₃ + 2HCl → 2NaCl + H₂O + CO₂↑'),
('CaCl2', 'Na2CO3', '[{"name": "CaCO3", "coefficient": 1, "molar_mass": 100.09}, {"name": "NaCl", "coefficient": 2, "molar_mass": 58.44}]', 'Precipitation', -2.7, 'White precipitate forms. Calcium carbonate settles. Milky solution.', 'CaCl₂ + Na₂CO₃ → CaCO₃↓ + 2NaCl');
