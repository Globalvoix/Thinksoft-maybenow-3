export interface DesignEntry {
  id: string;
  name: string;
  category: string;
  description: string;
  tags: string[];
}

export const designCatalog: DesignEntry[] = [
  // AI & LLM Platforms
  { id: 'claude', name: 'Claude', category: 'AI & LLM Platforms', description: 'Warm, conversational AI brand with soft gradients and friendly rounded UI. Earthy accent tones.', tags: ['ai', 'chat', 'llm', 'assistant', 'conversation'] },
  { id: 'cohere', name: 'Cohere', category: 'AI & LLM Platforms', description: 'Deep blue enterprise AI brand with geometric patterns and precise, technical typography.', tags: ['ai', 'enterprise', 'nlp', 'llm'] },
  { id: 'elevenlabs', name: 'ElevenLabs', category: 'AI & LLM Platforms', description: 'Dark, voice-focused AI brand with waveform motifs and dramatic gradient accents.', tags: ['ai', 'audio', 'voice', 'speech'] },
  { id: 'minimax', name: 'MiniMax', category: 'AI & LLM Platforms', description: 'Bold AI brand with vivid purple gradients and large, impactful typography.', tags: ['ai', 'video', 'generative', 'llm'] },
  { id: 'mistral-ai', name: 'Mistral AI', category: 'AI & LLM Platforms', description: 'Sleek French AI brand with minimalist design, sharp typography, and deep indigo palette.', tags: ['ai', 'llm', 'open-source', 'european'] },
  { id: 'ollama', name: 'Ollama', category: 'AI & LLM Platforms', description: 'Local AI brand with cozy, approachable design and warm amber tones.', tags: ['ai', 'local', 'open-source', 'developer'] },
  { id: 'opencode-ai', name: 'OpenCode AI', category: 'AI & LLM Platforms', description: 'Developer-first AI brand with clean code-inspired aesthetics and terminal-like design cues.', tags: ['ai', 'developer', 'code', 'cli'] },
  { id: 'replicate', name: 'Replicate', category: 'AI & LLM Platforms', description: 'AI model marketplace with clean, data-heavy UI and vibrant accent colors.', tags: ['ai', 'models', 'marketplace', 'api'] },
  { id: 'runwayml', name: 'RunwayML', category: 'AI & LLM Platforms', description: 'Creative AI brand with bold pink accents, experimental layout, and media-rich design.', tags: ['ai', 'video', 'creative', 'generative'] },
  { id: 'together-ai', name: 'Together AI', category: 'AI & LLM Platforms', description: 'High-performance AI infrastructure brand with electric blue palette and technical edge.', tags: ['ai', 'infrastructure', 'compute', 'llm'] },
  { id: 'voltagent', name: 'VoltAgent', category: 'AI & LLM Platforms', description: 'Agentic AI brand with lightning-bolt motifs, deep purple palette, and dynamic gradients.', tags: ['ai', 'agents', 'automation', 'developer'] },
  { id: 'x-ai', name: 'xAI', category: 'AI & LLM Platforms', description: 'Dark canvas minimalism with white pill outlines, muted sunset accents, and engineered-cosmic aesthetic.', tags: ['ai', 'grok', 'elon', 'dark', 'minimalist'] },

  // Developer Tools & IDEs
  { id: 'cursor', name: 'Cursor', category: 'Developer Tools & IDEs', description: 'AI-powered IDE brand with sleek dark theme, accent green highlights, and developer-focused utility.', tags: ['ide', 'editor', 'ai', 'developer', 'code'] },
  { id: 'expo', name: 'Expo', category: 'Developer Tools & IDEs', description: 'React Native platform with friendly purple branding and clean, approachable documentation design.', tags: ['mobile', 'react-native', 'developer', 'framework'] },
  { id: 'lovable', name: 'Lovable', category: 'Developer Tools & IDEs', description: 'AI app builder with warm, inviting design and pastel gradient accents.', tags: ['builder', 'no-code', 'ai', 'app-generator'] },
  { id: 'raycast', name: 'Raycast', category: 'Developer Tools & IDEs', description: 'Productivity launcher with clean macOS-native design, dark/light variants, and utility UI.', tags: ['productivity', 'mac', 'developer', 'launcher'] },
  { id: 'superhuman', name: 'Superhuman', category: 'Developer Tools & IDEs', description: 'Premium email client with luxury minimalism, gold accents, and high-end typography.', tags: ['email', 'productivity', 'premium', 'minimal'] },
  { id: 'vercel', name: 'Vercel', category: 'Developer Tools & IDEs', description: 'Deployment platform with clean black-and-white aesthetic, geometric geometry, and technical precision.', tags: ['deployment', 'developer', 'cloud', 'frontend'] },
  { id: 'warp', name: 'Warp', category: 'Developer Tools & IDEs', description: 'Modern terminal with rounded UI, AI integrations, and a polished developer experience design.', tags: ['terminal', 'developer', 'cli', 'productivity'] },

  // Backend, Database & DevOps
  { id: 'clickhouse', name: 'ClickHouse', category: 'Backend, Database & DevOps', description: 'Analytics database brand with data-visualization motifs, green accents, and technical seriousness.', tags: ['database', 'analytics', 'data', 'infrastructure'] },
  { id: 'composio', name: 'Composio', category: 'Backend, Database & DevOps', description: 'Integration platform with modular, connected-node visual design and modern gradients.', tags: ['integration', 'api', 'automation', 'saas'] },
  { id: 'hashicorp', name: 'HashiCorp', category: 'Backend, Database & DevOps', description: 'Infrastructure automation brand with clean corporate design, blue accents, and structured layouts.', tags: ['infrastructure', 'devops', 'cloud', 'enterprise'] },
  { id: 'mongodb', name: 'MongoDB', category: 'Backend, Database & DevOps', description: 'Document database brand with vibrant green palette and organic, data-flow visual language.', tags: ['database', 'nosql', 'developer', 'data'] },
  { id: 'posthog', name: 'PostHog', category: 'Backend, Database & DevOps', description: 'Product analytics brand with playful, quirky design and bright sunset palette.', tags: ['analytics', 'product', 'developer', 'open-source'] },
  { id: 'sanity', name: 'Sanity', category: 'Backend, Database & DevOps', description: 'Structured content platform with deep red branding and clean editorial-focused design.', tags: ['cms', 'content', 'headless', 'developer'] },
  { id: 'sentry', name: 'Sentry', category: 'Backend, Database & DevOps', description: 'Error monitoring brand with orange warning tones and clear, diagnostic-focused interface design.', tags: ['monitoring', 'errors', 'developer', 'debugging'] },
  { id: 'supabase', name: 'Supabase', category: 'Backend, Database & DevOps', description: 'Firebase alternative with vibrant forest green palette and open-source community-driven aesthetics.', tags: ['database', 'backend', 'open-source', 'firebase'] },

  // Productivity & SaaS
  { id: 'cal', name: 'Cal.com', category: 'Productivity & SaaS', description: 'Scheduling platform with clean calendar-inspired design and warm orange accents.', tags: ['scheduling', 'calendar', 'productivity', 'saas'] },
  { id: 'intercom', name: 'Intercom', category: 'Productivity & SaaS', description: 'Customer messaging platform with conversational UI patterns and friendly blue brand.', tags: ['customer-support', 'messaging', 'saas', 'conversation'] },
  { id: 'linear-app', name: 'Linear', category: 'Productivity & SaaS', description: 'Issue tracking with ultra-minimalist dark design, tight typography, and precision-engineered UI.', tags: ['project-management', 'developer', 'minimalist', 'dark'] },
  { id: 'mintlify', name: 'Mintlify', category: 'Productivity & SaaS', description: 'Documentation platform with clean reading-optimized design and modern tech aesthetics.', tags: ['docs', 'documentation', 'developer', 'writing'] },
  { id: 'notion', name: 'Notion', category: 'Productivity & SaaS', description: 'All-in-one workspace with illustration-rich design, pastel palette cards, and deep navy headers.', tags: ['workspace', 'docs', 'productivity', 'notes'] },
  { id: 'resend', name: 'Resend', category: 'Productivity & SaaS', description: 'Email API brand with clean dark design and pink-amber gradient accents.', tags: ['email', 'api', 'developer', 'communication'] },
  { id: 'zapier', name: 'Zapier', category: 'Productivity & SaaS', description: 'Automation platform with energetic orange brand and visual connector-style interface design.', tags: ['automation', 'integration', 'no-code', 'productivity'] },

  // Design & Creative Tools
  { id: 'airtable', name: 'Airtable', category: 'Design & Creative Tools', description: 'Spreadsheet-database hybrid with colorful pastel palette and grid-based visual language.', tags: ['database', 'spreadsheet', 'productivity', 'low-code'] },
  { id: 'clay', name: 'Clay', category: 'Design & Creative Tools', description: '3D design platform with sculptural visuals, beige tones, and creative tool aesthetics.', tags: ['3d', 'design', 'creative', 'sculpting'] },
  { id: 'figma', name: 'Figma', category: 'Design & Creative Tools', description: 'Collaborative design tool with clean interface, purple brand, and community-driven design patterns.', tags: ['design', 'collaboration', 'ui-ux', 'prototyping'] },
  { id: 'framer', name: 'Framer', category: 'Design & Creative Tools', description: 'Web design platform with dark modern aesthetics, motion-focused UI, and gradient accents.', tags: ['design', 'web', 'animation', 'no-code'] },
  { id: 'miro', name: 'Miro', category: 'Design & Creative Tools', description: 'Collaborative whiteboard with colorful, open-canvas design and infinite zoom visual language.', tags: ['whiteboard', 'collaboration', 'brainstorming', 'visual'] },
  { id: 'webflow', name: 'Webflow', category: 'Design & Creative Tools', description: 'Visual web development platform with crisp blue brand and clean, builder-focused interface.', tags: ['web', 'design', 'no-code', 'builder'] },

  // Fintech & Crypto
  { id: 'binance', name: 'Binance', category: 'Fintech & Crypto', description: 'Crypto exchange with bold yellow brand, data-rich dashboards, and trading-focused UI patterns.', tags: ['crypto', 'exchange', 'trading', 'finance'] },
  { id: 'coinbase', name: 'Coinbase', category: 'Fintech & Crypto', description: 'Crypto platform with clean blue brand, trusted financial design language, and beginner-friendly UI.', tags: ['crypto', 'finance', 'exchange', 'trust'] },
  { id: 'kraken', name: 'Kraken', category: 'Fintech & Crypto', description: 'Crypto exchange with dark nautical theme, deep blue palette, and professional trading interface.', tags: ['crypto', 'exchange', 'trading', 'dark'] },
  { id: 'mastercard', name: 'Mastercard', category: 'Fintech & Crypto', description: 'Global payments brand with iconic overlapping circles, red-orange palette, and enterprise trust.', tags: ['payment', 'finance', 'enterprise', 'global'] },
  { id: 'revolut', name: 'Revolut', category: 'Fintech & Crypto', description: 'Digital banking app with dark modern design, vibrant gradient accents, and fintech utility patterns.', tags: ['banking', 'finance', 'mobile', 'neobank'] },
  { id: 'stripe', name: 'Stripe', category: 'Fintech & Crypto', description: 'Payments platform with clean modern design, purple gradient brand, and developer-friendly aesthetic.', tags: ['payment', 'finance', 'developer', 'saas'] },
  { id: 'wise', name: 'Wise', category: 'Fintech & Crypto', description: 'Money transfer platform with green brand, transparent honesty design, and global financial visuals.', tags: ['transfer', 'finance', 'global', 'money'] },

  // E-commerce & Retail
  { id: 'airbnb', name: 'Airbnb', category: 'E-commerce & Retail', description: 'Travel marketplace with warm coral brand, rounded organic shapes, and hospitality-focused imagery.', tags: ['travel', 'marketplace', 'hospitality', 'booking'] },
  { id: 'meta', name: 'Meta', category: 'E-commerce & Retail', description: 'Social technology brand with gradient blue logo, rounded social UI, and connected-world visuals.', tags: ['social', 'technology', 'vr', 'connection'] },
  { id: 'nike', name: 'Nike', category: 'E-commerce & Retail', description: 'Sportswear brand with bold black-and-white minimalism, dynamic typography, and athletic energy.', tags: ['sports', 'fashion', 'retail', 'minimal'] },
  { id: 'shopify', name: 'Shopify', category: 'E-commerce & Retail', description: 'E-commerce platform with green brand, clean merchant-focused design, and scalable store patterns.', tags: ['ecommerce', 'retail', 'shop', 'business'] },
  { id: 'starbucks', name: 'Starbucks', category: 'E-commerce & Retail', description: 'Coffee brand with green siren logo, warm earthy tones, and premium food-service design.', tags: ['coffee', 'food', 'retail', 'hospitality'] },

  // Media & Consumer Tech
  { id: 'apple', name: 'Apple', category: 'Media & Consumer Tech', description: 'Premium consumer tech with minimalist white design, refined typography, and product-centric imagery.', tags: ['tech', 'hardware', 'premium', 'minimalist'] },
  { id: 'hp', name: 'HP', category: 'Media & Consumer Tech', description: 'Technology brand with simple blue logo and clean corporate design patterns.', tags: ['tech', 'hardware', 'enterprise', 'computing'] },
  { id: 'ibm', name: 'IBM', category: 'Media & Consumer Tech', description: 'Enterprise tech with distinguished blue brand, structured corporate design, and professional gravitas.', tags: ['tech', 'enterprise', 'cloud', 'consulting'] },
  { id: 'nvidia', name: 'NVIDIA', category: 'Media & Consumer Tech', description: 'GPU brand with green neon accents, dark futuristic design, and cutting-edge tech aesthetics.', tags: ['tech', 'gpu', 'gaming', 'ai', 'dark'] },
  { id: 'pinterest', name: 'Pinterest', category: 'Media & Consumer Tech', description: 'Visual discovery platform with red brand, masonry grid layouts, and creative inspiration design.', tags: ['social', 'visual', 'discovery', 'creative'] },
  { id: 'playstation', name: 'PlayStation', category: 'Media & Consumer Tech', description: 'Gaming brand with electric blue, dynamic shapes, and immersive entertainment UI patterns.', tags: ['gaming', 'entertainment', 'console', 'play'] },
  { id: 'spacex', name: 'SpaceX', category: 'Media & Consumer Tech', description: 'Space technology brand with dark cosmic design, aerospace precision, and futuristic engineering aesthetics.', tags: ['space', 'tech', 'aerospace', 'engineering'] },
  { id: 'spotify', name: 'Spotify', category: 'Media & Consumer Tech', description: 'Music streaming brand with dark green palette, vibrant playlist gradients, and circular audio motifs.', tags: ['music', 'audio', 'streaming', 'entertainment'] },
  { id: 'theverge', name: 'The Verge', category: 'Media & Consumer Tech', description: 'Tech news brand with orange accent, editorial layout, and modern media publication design.', tags: ['news', 'media', 'tech', 'publishing'] },
  { id: 'uber', name: 'Uber', category: 'Media & Consumer Tech', description: 'Ride-hailing brand with black-and-white design, blue accents, and map-centric UI patterns.', tags: ['transport', 'mobility', 'delivery', 'urban'] },
  { id: 'vodafone', name: 'Vodafone', category: 'Media & Consumer Tech', description: 'Telecom brand with red signature and clean, accessible mobile-first design.', tags: ['telecom', 'mobile', 'network', 'connectivity'] },
  { id: 'wired', name: 'Wired', category: 'Media & Consumer Tech', description: 'Tech magazine with black-yellow brand, bold editorial typography, and futuristic covers.', tags: ['media', 'magazine', 'tech', 'publishing'] },

  // Automotive
  { id: 'bmw', name: 'BMW', category: 'Automotive', description: 'Luxury automotive brand with blue-and-white roundel, premium engineering aesthetics, and sophisticated design.', tags: ['automotive', 'luxury', 'premium', 'german'] },
  { id: 'bmw-m', name: 'BMW M', category: 'Automotive', description: 'Performance BMW sub-brand with tri-color stripes, aggressive styling, and motorsport-inspired design.', tags: ['automotive', 'performance', 'sports', 'racing'] },
  { id: 'bugatti', name: 'Bugatti', category: 'Automotive', description: 'Ultra-luxury hypercar brand with horseshoe grille motif, elite craftsmanship, and aristocratic design.', tags: ['automotive', 'luxury', 'hypercar', 'exclusive'] },
  { id: 'ferrari', name: 'Ferrari', category: 'Automotive', description: 'Italian sports car brand with prancing horse logo, red signature, and racing heritage aesthetics.', tags: ['automotive', 'sports', 'luxury', 'italian'] },
  { id: 'lamborghini', name: 'Lamborghini', category: 'Automotive', description: 'Italian supercar brand with aggressive angular design, bold yellow branding, and dramatic styling.', tags: ['automotive', 'luxury', 'supercar', 'italian'] },
  { id: 'renault', name: 'Renault', category: 'Automotive', description: 'French automotive brand with clean modern design and accessible, friendly visual language.', tags: ['automotive', 'french', 'electric', 'accessible'] },
  { id: 'tesla', name: 'Tesla', category: 'Automotive', description: 'Electric vehicle brand with clean minimalist design, red accent, and futuristic technology aesthetics.', tags: ['automotive', 'electric', 'tech', 'minimalist'] },

  // Retro
  { id: 'dell-1996', name: 'Dell 1996', category: 'Retro', description: 'Vintage 90s tech brand with classic blue logo, beige-era computing aesthetics, and nostalgic elements.', tags: ['retro', '90s', 'vintage', 'nostalgia'] },
  { id: 'nintendo-2001', name: 'Nintendo 2001', category: 'Retro', description: 'Early 2000s gaming brand with playful primary colors, rounded shapes, and nostalgic gaming design.', tags: ['retro', 'gaming', '2000s', 'nostalgia'] },
];
