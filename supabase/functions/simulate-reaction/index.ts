import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

interface SimulationRequest {
  reactantA: string;
  reactantB: string;
  quantityA: number;
  unitA: string;
  quantityB: number;
  unitB: string;
}

interface Product {
  name: string;
  coefficient: number;
  molar_mass: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { reactantA, reactantB, quantityA, unitA, quantityB, unitB }: SimulationRequest = await req.json();

    console.log('Simulating reaction:', { reactantA, reactantB });

    // Find matching reaction (order-independent)
    const { data: reactions, error: reactionError } = await supabase
      .from('reactions')
      .select('*')
      .or(`and(reactant_a.eq.${reactantA},reactant_b.eq.${reactantB}),and(reactant_a.eq.${reactantB},reactant_b.eq.${reactantA})`);

    if (reactionError) throw reactionError;
    if (!reactions || reactions.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Reaction not found in database' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    const reaction = reactions[0];
    const products = reaction.products as Product[];

    // Get molar masses for reactants
    const molarMasses: { [key: string]: number } = {
      'HCl': 36.46, 'NaOH': 40.0, 'H2SO4': 98.08, 'AgNO3': 169.87,
      'NaCl': 58.44, 'Pb(NO3)2': 331.2, 'KI': 166.0, 'BaCl2': 208.23,
      'Na2SO4': 142.04, 'CaCO3': 100.09, 'NaHCO3': 84.01, 'Zn': 65.38,
      'Mg': 24.31, 'Fe': 55.85, 'CuSO4': 159.61, 'Cu': 63.55,
      'KBr': 119.0, 'H2': 2.02, 'O2': 32.0, 'CH4': 16.04,
      'CuO': 79.55, 'NH3': 17.03, 'Al': 26.98, 'Na2CO3': 105.99,
      'CaCl2': 110.98
    };

    // Convert to moles
    const molesA = unitA === 'moles' ? quantityA : quantityA / molarMasses[reactantA];
    const molesB = unitB === 'moles' ? quantityB : quantityB / molarMasses[reactantB];

    // Determine stoichiometric ratios
    const ratioA = reaction.reactant_a === reactantA ? 1 : (reaction.reactant_a === reactantB ? 1 : 1);
    const ratioB = reaction.reactant_b === reactantB ? 1 : (reaction.reactant_b === reactantA ? 1 : 1);

    // Find limiting reagent
    const requiredBforA = molesA * ratioB / ratioA;
    const requiredAforB = molesB * ratioA / ratioB;

    let limitingReagent: string;
    let limitingMoles: number;
    let excessReagent: string;
    let excessMoles: number;

    if (requiredBforA <= molesB) {
      limitingReagent = reactantA;
      limitingMoles = molesA;
      excessReagent = reactantB;
      excessMoles = molesB - requiredBforA;
    } else {
      limitingReagent = reactantB;
      limitingMoles = molesB;
      excessReagent = reactantA;
      excessMoles = molesA - requiredAforB;
    }

    // Calculate products formed
    const productsFormed = products.map((product: Product) => {
      const productMoles = limitingMoles * product.coefficient;
      const productMass = productMoles * product.molar_mass;
      return {
        name: product.name,
        moles: productMoles,
        mass: productMass,
        coefficient: product.coefficient
      };
    });

    const theoreticalYield = productsFormed[0].mass;

    const result = {
      success: true,
      limitingReagent,
      excessReagent,
      excessMoles,
      productsFormed,
      theoreticalYield,
      balancedEquation: reaction.balanced_equation,
      reactionType: reaction.reaction_type,
      observation: reaction.observation,
      enthalpyChange: reaction.enthalpy_change,
      steps: [
        `Converted ${quantityA} ${unitA} of ${reactantA} to ${molesA.toFixed(4)} moles`,
        `Converted ${quantityB} ${unitB} of ${reactantB} to ${molesB.toFixed(4)} moles`,
        `Identified ${limitingReagent} as the limiting reagent`,
        `Calculated ${excessMoles.toFixed(4)} moles of ${excessReagent} remaining`,
        `Theoretical yield: ${theoreticalYield.toFixed(2)}g`
      ]
    };

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in simulate-reaction:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
