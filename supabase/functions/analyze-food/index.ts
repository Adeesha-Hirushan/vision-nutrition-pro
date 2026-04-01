import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { image } = await req.json();
    if (!image) {
      return new Response(JSON.stringify({ error: 'No image provided' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          {
            role: 'system',
            content: `You are an expert nutritionist and food recognition AI with deep knowledge of USDA nutrition databases. You MUST respond with valid JSON only, no markdown.

Analyze the food image with extreme precision and return a JSON object with this exact structure:
{
  "foods": [
    {
      "name": "Food Name (be very specific, e.g. 'Grilled Chicken Breast' not just 'Chicken')",
      "confidence": 0.85,
      "portion": "medium",
      "calories": 250,
      "protein": 12,
      "carbs": 30,
      "fats": 8,
      "fiber": 3
    }
  ],
  "totalCalories": 250,
  "totalProtein": 12,
  "totalCarbs": 30,
  "totalFats": 8,
  "insights": [
    "This meal is balanced with good protein content",
    "Consider adding more vegetables for fiber"
  ]
}

CRITICAL RULES:
- If no food is detected or the image does not contain food, return empty foods array, zeros for totals, and set confidence to 0
- Confidence is 0-1 scale. Be honest about confidence. Only give >0.7 if you are very sure
- If the image is blurry, dark, or unclear, lower confidence significantly
- Portion is "small", "medium", or "large" — estimate based on visual cues
- All nutrition values are per detected portion in the image
- Use USDA nutrition database values for accuracy
- Cross-reference with known food databases: USDA FoodData Central, CalorieKing
- Be very specific with food names (e.g., "Brown Rice" not "Rice", "Whole Wheat Bread" not "Bread")
- Detect ALL food items visible in the image separately
- For mixed dishes, break down visible components when possible
- Provide 2-4 actionable, specific nutrition insights
- NEVER guess wildly — if uncertain, lower the confidence score`
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Analyze this food image with high accuracy. Identify each food item, estimate portions carefully, and provide precise nutritional data based on USDA values.' },
              { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${image}` } }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limited, please try again shortly' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const t = await response.text();
      console.error('AI error:', response.status, t);
      throw new Error('AI analysis failed');
    }

    const aiData = await response.json();
    let content = aiData.choices?.[0]?.message?.content || '';
    
    // Strip markdown code fences if present
    content = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    
    const parsed = JSON.parse(content);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('analyze-food error:', e);
    return new Response(JSON.stringify({
      foods: [],
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFats: 0,
      insights: ['Unable to analyze image. Please try again.'],
      error: e instanceof Error ? e.message : 'Unknown error',
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
