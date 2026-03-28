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
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a professional nutritionist AI that analyzes food images. You MUST respond with valid JSON only, no markdown.

Analyze the image and return a JSON object with this exact structure:
{
  "foods": [
    {
      "name": "Food Name",
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

Rules:
- If no food is detected, return empty foods array and zeros for totals
- Confidence is 0-1 scale
- Portion is "small", "medium", or "large"
- All nutrition values are per detected portion
- Provide 2-4 actionable nutrition insights
- Be accurate with calorie estimates using USDA nutrition data
- Detect ALL food items visible in the image`
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Analyze this food image and provide detailed nutrition information.' },
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
