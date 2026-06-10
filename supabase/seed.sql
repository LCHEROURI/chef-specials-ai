insert into public.templates (
  id,
  owner_id,
  title,
  description,
  prompt_text,
  category,
  ai_platform,
  is_system
) values
(
  '11111111-1111-4111-8111-111111111111',
  null,
  'Business Analysis',
  'Assess a business model, market position, risks, and opportunities.',
  'Act as a senior business strategist. Analyze the following business using: executive summary, customer segments, value proposition, revenue model, cost structure, competitive position, risks, opportunities, and a prioritized 90-day action plan.\n\nBusiness context:\n{{business_context}}',
  'Business',
  'ChatGPT',
  true
),
(
  '22222222-2222-4222-8222-222222222222',
  null,
  'SWOT Analysis',
  'Create a practical SWOT analysis with actions.',
  'Create a rigorous SWOT analysis for {{subject}}. For each strength, weakness, opportunity, and threat, explain the evidence and business impact. Finish with five actions that connect strengths to opportunities and reduce the most important risks.',
  'Business',
  'Claude',
  true
),
(
  '33333333-3333-4333-8333-333333333333',
  null,
  'Restaurant Consulting Audit',
  'Review restaurant operations, menu, marketing, and guest retention.',
  'Act as an experienced restaurant consultant. Audit the restaurant information below across concept clarity, menu engineering, food cost, labor, service, reviews, local marketing, and customer retention. Rank findings by urgency and provide a 30-day implementation plan.\n\nRestaurant information:\n{{restaurant_information}}',
  'Restaurants',
  'ChatGPT',
  true
),
(
  '44444444-4444-4444-8444-444444444444',
  null,
  'App Planning Brief',
  'Turn an app idea into an actionable product brief.',
  'Turn this app idea into a concise product brief with target users, core problem, key workflows, MVP scope, data model, edge cases, success metrics, and a phased implementation plan. Identify assumptions explicitly.\n\nApp idea:\n{{app_idea}}',
  'Vibe Coding',
  'Lovable',
  true
),
(
  '55555555-5555-4555-8555-555555555555',
  null,
  'Product Validation',
  'Evaluate demand, differentiation, and validation experiments.',
  'Evaluate this product idea as a skeptical product strategist. Define the target buyer, painful problem, existing alternatives, differentiation, willingness-to-pay signals, major risks, and the three fastest validation experiments. Do not assume demand without evidence.\n\nProduct idea:\n{{product_idea}}',
  'Research',
  'Claude',
  true
),
(
  '66666666-6666-4666-8666-666666666666',
  null,
  'Landing Page Creation',
  'Draft focused landing-page copy for a clear audience and offer.',
  'Write conversion-focused landing page copy for {{offer}} aimed at {{audience}}. Include headline, supporting copy, problem, outcome, how it works, benefits, objection handling, proof placeholders, FAQ, and one primary call to action. Keep claims specific and credible.',
  'Marketing',
  'ChatGPT',
  true
),
(
  '77777777-7777-4777-8777-777777777777',
  null,
  'Marketing Strategy',
  'Build a practical channel and campaign strategy.',
  'Create a 90-day marketing strategy for {{business}}. Define audience segments, positioning, channel priorities, campaign themes, weekly execution rhythm, content requirements, budget assumptions, KPIs, and stop-or-scale decision rules.',
  'Marketing',
  'Gemini',
  true
),
(
  '88888888-8888-4888-8888-888888888888',
  null,
  'Social Media System',
  'Generate a repeatable social content plan.',
  'Create a four-week social media system for {{brand}} on {{platforms}}. Provide content pillars, weekly cadence, post concepts, hooks, calls to action, repurposing instructions, and a lightweight measurement dashboard. Match the brand voice: {{brand_voice}}.',
  'Social Media',
  'ChatGPT',
  true
),
(
  '99999999-9999-4999-8999-999999999999',
  null,
  'Customer Avatar',
  'Develop an evidence-aware customer profile.',
  'Develop a detailed customer avatar for {{product_or_service}}. Separate known facts from assumptions. Cover context, goals, frustrations, triggers, objections, buying criteria, language they use, trusted sources, and the best interview questions to validate the profile.',
  'Marketing',
  'Claude',
  true
)
on conflict (id) do update
set title = excluded.title,
    description = excluded.description,
    prompt_text = excluded.prompt_text,
    category = excluded.category,
    ai_platform = excluded.ai_platform,
    is_system = excluded.is_system,
    updated_at = now();
