/*
# Seed Configuration Data — Industries, Capabilities, Fingerprints, Adoption Stats, Recommendations

1. Overview
   Seeds the full configuration dataset for the audit engine:
   - 8 industries, 16 capabilities, 30+ fingerprints, adoption stats, recommendations

2. Notes
   - All data is idempotent (INSERT ... ON CONFLICT DO NOTHING)
*/

-- ============ CAPABILITIES ============
INSERT INTO capabilities (id, label, category, description) VALUES
('website_chat', 'Website Chat / Chatbot', 'Communication', 'Live chat or chatbot widget on the website'),
('online_booking', 'Online Booking / Scheduling', 'Operations', 'Customers can book appointments online'),
('crm', 'CRM / Customer Management', 'Operations', 'Customer relationship management system'),
('email_marketing', 'Email Marketing', 'Marketing', 'Email marketing platform integration'),
('analytics', 'Web Analytics', 'Marketing', 'Web analytics tracking'),
('seo_tools', 'SEO Tools', 'Marketing', 'SEO optimization or meta tag management'),
('ecommerce', 'E-commerce / Online Store', 'Sales', 'Online store or product sales'),
('payment_processing', 'Online Payment Processing', 'Sales', 'Online payment or checkout system'),
('ai_voice_receptionist', 'AI Voice Receptionist', 'Communication', 'AI-powered voice assistant for calls'),
('ai_chatbot', 'AI-Powered Chatbot', 'Communication', 'AI-driven conversational chatbot'),
('lead_capture', 'Lead Capture Forms', 'Marketing', 'Forms that capture visitor information'),
('social_media', 'Social Media Integration', 'Marketing', 'Social media feeds or links'),
('review_management', 'Review Management', 'Reputation', 'Online review collection or display'),
('sms_marketing', 'SMS / Text Marketing', 'Marketing', 'SMS marketing or text messaging'),
('inventory_mgmt', 'Inventory Management', 'Operations', 'Inventory tracking system'),
('knowledge_base', 'Knowledge Base / FAQ', 'Support', 'Self-service help content')
ON CONFLICT (id) DO NOTHING;

-- ============ INDUSTRIES ============
INSERT INTO industries (id, label, description) VALUES
('dental', 'Dental Practice', 'Dental offices, orthodontists, oral surgeons'),
('legal', 'Legal Services', 'Law firms, attorneys, legal consultants'),
('restaurant', 'Restaurant / Hospitality', 'Restaurants, cafes, bars, food service'),
('retail', 'Retail Store', 'Physical retail stores and shops'),
('real_estate', 'Real Estate', 'Realtors, property managers, real estate agencies'),
('fitness', 'Fitness / Wellness', 'Gyms, yoga studios, personal trainers, wellness centers'),
('automotive', 'Automotive Services', 'Auto repair, car dealerships, detailing services'),
('home_services', 'Home Services', 'Plumbers, electricians, HVAC, cleaning, contractors')
ON CONFLICT (id) DO NOTHING;

-- ============ TECHNOLOGY FINGERPRINTS ============
INSERT INTO technology_fingerprints (id, label, category, capability_id, confidence, dom, js, meta) VALUES
('intercom', 'Intercom', 'Chat', 'website_chat', 'high', 'intercom', 'Intercom', null),
('drift', 'Drift', 'Chat', 'website_chat', 'high', 'drift', 'drift', null),
('tawk_to', 'Tawk.to', 'Chat', 'website_chat', 'high', 'tawk.to', 'Tawk_API', null),
('livechat', 'LiveChat', 'Chat', 'website_chat', 'high', 'livechat', 'LiveChat', null),
('zendesk_chat', 'Zendesk Chat', 'Chat', 'website_chat', 'high', 'zendesk', 'zE', null),
('hubspot_chat', 'HubSpot Chat', 'Chat', 'website_chat', 'high', 'hubspot', 'hubspot', null),
('freshchat', 'Freshchat', 'Chat', 'website_chat', 'medium', 'freshchat', 'freshchat', null),
('crisp_chat', 'Crisp Chat', 'Chat', 'website_chat', 'high', 'crisp', 'CRISP', null),
('chatgpt_widget', 'ChatGPT Widget', 'AI Chat', 'ai_chatbot', 'medium', 'chatgpt', 'chatgpt', null),
('dialogflow', 'Dialogflow', 'AI Chat', 'ai_chatbot', 'high', 'dialogflow', 'dialogflow', null),
('botpress', 'Botpress', 'AI Chat', 'ai_chatbot', 'high', 'botpress', 'botpress', null),
('calendly', 'Calendly', 'Booking', 'online_booking', 'high', 'calendly', 'calendly', null),
('acuity', 'Acuity Scheduling', 'Booking', 'online_booking', 'high', 'acuity', 'acuity', null),
('square_appointments', 'Square Appointments', 'Booking', 'online_booking', 'high', 'square', 'squareup', null),
('setmore', 'Setmore', 'Booking', 'online_booking', 'medium', 'setmore', 'setmore', null),
('booker', 'Booker', 'Booking', 'online_booking', 'medium', 'booker', 'booker', null),
('mindbody', 'Mindbody', 'Booking', 'online_booking', 'high', 'mindbody', 'mindbody', null),
('vagaro', 'Vagaro', 'Booking', 'online_booking', 'high', 'vagaro', 'vagaro', null),
('salesforce', 'Salesforce', 'CRM', 'crm', 'high', 'salesforce', 'salesforce', null),
('hubspot_crm', 'HubSpot CRM', 'CRM', 'crm', 'high', 'hubspot', 'hubspot', null),
('pipedrive', 'Pipedrive', 'CRM', 'crm', 'high', 'pipedrive', 'pipedrive', null),
('zoho_crm', 'Zoho CRM', 'CRM', 'crm', 'high', 'zoho', 'zoho', null),
('ga4', 'Google Analytics 4', 'Analytics', 'analytics', 'high', null, 'gtag', null),
('ga_universal', 'Google Analytics Universal', 'Analytics', 'analytics', 'high', null, 'google-analytics', null),
('gtm', 'Google Tag Manager', 'Analytics', 'analytics', 'high', null, 'googletagmanager', null),
('plausible', 'Plausible', 'Analytics', 'analytics', 'high', 'plausible', 'plausible', null),
('hotjar', 'Hotjar', 'Analytics', 'analytics', 'high', 'hotjar', 'hotjar', null),
('mixpanel', 'Mixpanel', 'Analytics', 'analytics', 'high', 'mixpanel', 'mixpanel', null),
('mailchimp', 'Mailchimp', 'Email Marketing', 'email_marketing', 'high', 'mailchimp', 'mailchimp', null),
('klaviyo', 'Klaviyo', 'Email Marketing', 'email_marketing', 'high', 'klaviyo', 'klaviyo', null),
('constant_contact', 'Constant Contact', 'Email Marketing', 'email_marketing', 'high', 'constant_contact', 'constant_contact', null),
('shopify', 'Shopify', 'E-commerce', 'ecommerce', 'high', 'shopify', 'Shopify', null),
('woocommerce', 'WooCommerce', 'E-commerce', 'ecommerce', 'high', 'woocommerce', 'woocommerce', null),
('magento', 'Magento', 'E-commerce', 'ecommerce', 'high', 'magento', 'mage', null),
('bigcommerce', 'BigCommerce', 'E-commerce', 'ecommerce', 'high', 'bigcommerce', 'bigcommerce', null),
('squarespace_commerce', 'Squarespace Commerce', 'E-commerce', 'ecommerce', 'medium', 'squarespace', 'squarespace', null),
('stripe', 'Stripe', 'Payment', 'payment_processing', 'high', 'stripe', 'Stripe', null),
('paypal', 'PayPal', 'Payment', 'payment_processing', 'high', 'paypal', 'paypal', null),
('square_pay', 'Square Pay', 'Payment', 'payment_processing', 'high', 'square', 'squareup', null),
('yoast', 'Yoast SEO', 'SEO', 'seo_tools', 'high', 'yoast', 'yoast', null),
('rank_math', 'Rank Math', 'SEO', 'seo_tools', 'high', 'rank-math', 'rankMath', null),
('all_in_one_seo', 'All in One SEO', 'SEO', 'seo_tools', 'medium', 'all-in-one-seo', 'aioseo', null),
('instagram_embed', 'Instagram Embed', 'Social Media', 'social_media', 'medium', 'instagram', 'instagram', null),
('facebook_embed', 'Facebook Embed', 'Social Media', 'social_media', 'medium', 'facebook', 'fb-root', null),
('twitter_embed', 'Twitter/X Embed', 'Social Media', 'social_media', 'medium', 'twitter', 'twitter', null),
('trustpilot', 'Trustpilot', 'Reviews', 'review_management', 'high', 'trustpilot', 'trustpilot', null),
('yotpo', 'Yotpo', 'Reviews', 'review_management', 'high', 'yotpo', 'yotpo', null),
('google_reviews', 'Google Reviews Widget', 'Reviews', 'review_management', 'medium', 'google-review', 'googleReview', null),
('attentive', 'Attentive', 'SMS Marketing', 'sms_marketing', 'high', 'attentive', 'attentive', null),
('postscript', 'Postscript', 'SMS Marketing', 'sms_marketing', 'high', 'postscript', 'postscript', null),
('simpletexting', 'SimpleTexting', 'SMS Marketing', 'sms_marketing', 'medium', 'simpletexting', 'simpletexting', null),
('hubspot_forms', 'HubSpot Forms', 'Lead Capture', 'lead_capture', 'high', 'hbspt-form', 'hbspt', null),
('gravity_forms', 'Gravity Forms', 'Lead Capture', 'lead_capture', 'high', 'gravity_form', 'gravityforms', null),
('typeform', 'Typeform', 'Lead Capture', 'lead_capture', 'high', 'typeform', 'typeform', null),
('formstack', 'Formstack', 'Lead Capture', 'lead_capture', 'medium', 'formstack', 'formstack', null)
ON CONFLICT (id) DO NOTHING;

-- ============ INDUSTRY CAPABILITIES ============
INSERT INTO industry_capabilities (industry_id, capability_id, weight) VALUES
('dental', 'website_chat', 1.5), ('dental', 'online_booking', 2.0), ('dental', 'ai_voice_receptionist', 1.5),
('dental', 'ai_chatbot', 1.5), ('dental', 'crm', 1.0), ('dental', 'email_marketing', 1.0),
('dental', 'analytics', 1.0), ('dental', 'lead_capture', 1.2), ('dental', 'review_management', 1.3),
('dental', 'sms_marketing', 1.0), ('dental', 'social_media', 0.8), ('dental', 'seo_tools', 1.0)
ON CONFLICT (industry_id, capability_id) DO NOTHING;

INSERT INTO industry_capabilities (industry_id, capability_id, weight) VALUES
('legal', 'website_chat', 1.5), ('legal', 'online_booking', 1.5), ('legal', 'crm', 1.5),
('legal', 'lead_capture', 2.0), ('legal', 'email_marketing', 1.0), ('legal', 'analytics', 1.0),
('legal', 'seo_tools', 1.5), ('legal', 'review_management', 1.2), ('legal', 'ai_chatbot', 1.3),
('legal', 'knowledge_base', 1.0), ('legal', 'social_media', 0.8), ('legal', 'ai_voice_receptionist', 1.0)
ON CONFLICT (industry_id, capability_id) DO NOTHING;

INSERT INTO industry_capabilities (industry_id, capability_id, weight) VALUES
('restaurant', 'online_booking', 1.5), ('restaurant', 'ecommerce', 1.3), ('restaurant', 'payment_processing', 1.5),
('restaurant', 'social_media', 1.5), ('restaurant', 'email_marketing', 1.0), ('restaurant', 'analytics', 1.0),
('restaurant', 'review_management', 1.5), ('restaurant', 'sms_marketing', 1.3), ('restaurant', 'website_chat', 1.0),
('restaurant', 'ai_chatbot', 1.0), ('restaurant', 'lead_capture', 0.8), ('restaurant', 'seo_tools', 1.0)
ON CONFLICT (industry_id, capability_id) DO NOTHING;

INSERT INTO industry_capabilities (industry_id, capability_id, weight) VALUES
('retail', 'ecommerce', 2.0), ('retail', 'payment_processing', 1.5), ('retail', 'email_marketing', 1.5),
('retail', 'analytics', 1.2), ('retail', 'social_media', 1.3), ('retail', 'inventory_mgmt', 1.5),
('retail', 'seo_tools', 1.2), ('retail', 'review_management', 1.0), ('retail', 'sms_marketing', 1.0),
('retail', 'lead_capture', 1.0), ('retail', 'website_chat', 1.0), ('retail', 'ai_chatbot', 1.0)
ON CONFLICT (industry_id, capability_id) DO NOTHING;

INSERT INTO industry_capabilities (industry_id, capability_id, weight) VALUES
('real_estate', 'crm', 2.0), ('real_estate', 'lead_capture', 2.0), ('real_estate', 'email_marketing', 1.5),
('real_estate', 'analytics', 1.0), ('real_estate', 'seo_tools', 1.5), ('real_estate', 'social_media', 1.3),
('real_estate', 'website_chat', 1.5), ('real_estate', 'ai_chatbot', 1.3), ('real_estate', 'online_booking', 1.0),
('real_estate', 'review_management', 1.0), ('real_estate', 'ai_voice_receptionist', 1.0), ('real_estate', 'sms_marketing', 0.8)
ON CONFLICT (industry_id, capability_id) DO NOTHING;

INSERT INTO industry_capabilities (industry_id, capability_id, weight) VALUES
('fitness', 'online_booking', 2.0), ('fitness', 'crm', 1.5), ('fitness', 'email_marketing', 1.3),
('fitness', 'social_media', 1.5), ('fitness', 'analytics', 1.0), ('fitness', 'lead_capture', 1.5),
('fitness', 'sms_marketing', 1.3), ('fitness', 'review_management', 1.2), ('fitness', 'website_chat', 1.0),
('fitness', 'ai_chatbot', 1.0), ('fitness', 'payment_processing', 1.0), ('fitness', 'ai_voice_receptionist', 0.8)
ON CONFLICT (industry_id, capability_id) DO NOTHING;

INSERT INTO industry_capabilities (industry_id, capability_id, weight) VALUES
('automotive', 'online_booking', 1.5), ('automotive', 'crm', 1.5), ('automotive', 'review_management', 1.5),
('automotive', 'analytics', 1.0), ('automotive', 'seo_tools', 1.3), ('automotive', 'email_marketing', 1.0),
('automotive', 'sms_marketing', 1.0), ('automotive', 'lead_capture', 1.3), ('automotive', 'website_chat', 1.0),
('automotive', 'ai_voice_receptionist', 1.3), ('automotive', 'social_media', 0.8), ('automotive', 'ai_chatbot', 0.8)
ON CONFLICT (industry_id, capability_id) DO NOTHING;

INSERT INTO industry_capabilities (industry_id, capability_id, weight) VALUES
('home_services', 'online_booking', 2.0), ('home_services', 'crm', 1.5), ('home_services', 'lead_capture', 2.0),
('home_services', 'review_management', 1.5), ('home_services', 'seo_tools', 1.5), ('home_services', 'analytics', 1.0),
('home_services', 'email_marketing', 1.0), ('home_services', 'sms_marketing', 1.3), ('home_services', 'website_chat', 1.0),
('home_services', 'ai_voice_receptionist', 1.5), ('home_services', 'social_media', 0.8), ('home_services', 'ai_chatbot', 0.8)
ON CONFLICT (industry_id, capability_id) DO NOTHING;

-- ============ ADOPTION STATS ============
INSERT INTO adoption_stats (industry_id, capability_id, adoption_pct, sample_size, trend, source) VALUES
('dental', 'website_chat', 35.2, 5000, 'stable', 'Internal scan data'),
('dental', 'online_booking', 52.0, 5000, 'growing', 'Internal scan data'),
('dental', 'ai_voice_receptionist', 8.4, 5000, 'growing', 'Internal scan data'),
('dental', 'ai_chatbot', 12.1, 5000, 'growing', 'Internal scan data'),
('dental', 'crm', 28.5, 5000, 'stable', 'Internal scan data'),
('dental', 'email_marketing', 31.0, 5000, 'stable', 'Internal scan data'),
('dental', 'analytics', 68.0, 5000, 'stable', 'Internal scan data'),
('dental', 'lead_capture', 45.0, 5000, 'growing', 'Internal scan data'),
('dental', 'review_management', 22.0, 5000, 'growing', 'Internal scan data'),
('dental', 'sms_marketing', 15.0, 5000, 'growing', 'Internal scan data'),
('dental', 'social_media', 58.0, 5000, 'stable', 'Internal scan data'),
('dental', 'seo_tools', 42.0, 5000, 'stable', 'Internal scan data')
ON CONFLICT (industry_id, capability_id) DO NOTHING;

INSERT INTO adoption_stats (industry_id, capability_id, adoption_pct, sample_size, trend, source) VALUES
('legal', 'website_chat', 28.0, 3000, 'stable', 'Internal scan data'),
('legal', 'online_booking', 18.0, 3000, 'growing', 'Internal scan data'),
('legal', 'crm', 45.0, 3000, 'stable', 'Internal scan data'),
('legal', 'lead_capture', 52.0, 3000, 'growing', 'Internal scan data'),
('legal', 'email_marketing', 35.0, 3000, 'stable', 'Internal scan data'),
('legal', 'analytics', 62.0, 3000, 'stable', 'Internal scan data'),
('legal', 'seo_tools', 55.0, 3000, 'stable', 'Internal scan data'),
('legal', 'review_management', 15.0, 3000, 'growing', 'Internal scan data'),
('legal', 'ai_chatbot', 8.0, 3000, 'growing', 'Internal scan data'),
('legal', 'knowledge_base', 25.0, 3000, 'stable', 'Internal scan data'),
('legal', 'social_media', 38.0, 3000, 'stable', 'Internal scan data'),
('legal', 'ai_voice_receptionist', 5.0, 3000, 'growing', 'Internal scan data')
ON CONFLICT (industry_id, capability_id) DO NOTHING;

INSERT INTO adoption_stats (industry_id, capability_id, adoption_pct, sample_size, trend, source) VALUES
('restaurant', 'online_booking', 38.0, 8000, 'growing', 'Internal scan data'),
('restaurant', 'ecommerce', 25.0, 8000, 'growing', 'Internal scan data'),
('restaurant', 'payment_processing', 42.0, 8000, 'growing', 'Internal scan data'),
('restaurant', 'social_media', 72.0, 8000, 'stable', 'Internal scan data'),
('restaurant', 'email_marketing', 28.0, 8000, 'stable', 'Internal scan data'),
('restaurant', 'analytics', 55.0, 8000, 'stable', 'Internal scan data'),
('restaurant', 'review_management', 35.0, 8000, 'growing', 'Internal scan data'),
('restaurant', 'sms_marketing', 18.0, 8000, 'growing', 'Internal scan data'),
('restaurant', 'website_chat', 15.0, 8000, 'stable', 'Internal scan data'),
('restaurant', 'ai_chatbot', 6.0, 8000, 'growing', 'Internal scan data'),
('restaurant', 'lead_capture', 12.0, 8000, 'stable', 'Internal scan data'),
('restaurant', 'seo_tools', 35.0, 8000, 'stable', 'Internal scan data')
ON CONFLICT (industry_id, capability_id) DO NOTHING;

INSERT INTO adoption_stats (industry_id, capability_id, adoption_pct, sample_size, trend, source) VALUES
('retail', 'ecommerce', 65.0, 10000, 'growing', 'Internal scan data'),
('retail', 'payment_processing', 72.0, 10000, 'stable', 'Internal scan data'),
('retail', 'email_marketing', 48.0, 10000, 'stable', 'Internal scan data'),
('retail', 'analytics', 78.0, 10000, 'stable', 'Internal scan data'),
('retail', 'social_media', 68.0, 10000, 'stable', 'Internal scan data'),
('retail', 'inventory_mgmt', 42.0, 10000, 'stable', 'Internal scan data'),
('retail', 'seo_tools', 52.0, 10000, 'stable', 'Internal scan data'),
('retail', 'review_management', 38.0, 10000, 'growing', 'Internal scan data'),
('retail', 'sms_marketing', 22.0, 10000, 'growing', 'Internal scan data'),
('retail', 'lead_capture', 35.0, 10000, 'stable', 'Internal scan data'),
('retail', 'website_chat', 25.0, 10000, 'stable', 'Internal scan data'),
('retail', 'ai_chatbot', 10.0, 10000, 'growing', 'Internal scan data')
ON CONFLICT (industry_id, capability_id) DO NOTHING;

INSERT INTO adoption_stats (industry_id, capability_id, adoption_pct, sample_size, trend, source) VALUES
('real_estate', 'crm', 68.0, 4000, 'stable', 'Internal scan data'),
('real_estate', 'lead_capture', 72.0, 4000, 'growing', 'Internal scan data'),
('real_estate', 'email_marketing', 52.0, 4000, 'stable', 'Internal scan data'),
('real_estate', 'analytics', 65.0, 4000, 'stable', 'Internal scan data'),
('real_estate', 'seo_tools', 58.0, 4000, 'stable', 'Internal scan data'),
('real_estate', 'social_media', 75.0, 4000, 'stable', 'Internal scan data'),
('real_estate', 'website_chat', 32.0, 4000, 'growing', 'Internal scan data'),
('real_estate', 'ai_chatbot', 10.0, 4000, 'growing', 'Internal scan data'),
('real_estate', 'online_booking', 22.0, 4000, 'growing', 'Internal scan data'),
('real_estate', 'review_management', 28.0, 4000, 'growing', 'Internal scan data'),
('real_estate', 'ai_voice_receptionist', 6.0, 4000, 'growing', 'Internal scan data'),
('real_estate', 'sms_marketing', 15.0, 4000, 'growing', 'Internal scan data')
ON CONFLICT (industry_id, capability_id) DO NOTHING;

INSERT INTO adoption_stats (industry_id, capability_id, adoption_pct, sample_size, trend, source) VALUES
('fitness', 'online_booking', 75.0, 3000, 'stable', 'Internal scan data'),
('fitness', 'crm', 55.0, 3000, 'stable', 'Internal scan data'),
('fitness', 'email_marketing', 42.0, 3000, 'stable', 'Internal scan data'),
('fitness', 'social_media', 82.0, 3000, 'stable', 'Internal scan data'),
('fitness', 'analytics', 58.0, 3000, 'stable', 'Internal scan data'),
('fitness', 'lead_capture', 48.0, 3000, 'growing', 'Internal scan data'),
('fitness', 'sms_marketing', 25.0, 3000, 'growing', 'Internal scan data'),
('fitness', 'review_management', 32.0, 3000, 'growing', 'Internal scan data'),
('fitness', 'website_chat', 18.0, 3000, 'stable', 'Internal scan data'),
('fitness', 'ai_chatbot', 8.0, 3000, 'growing', 'Internal scan data'),
('fitness', 'payment_processing', 45.0, 3000, 'stable', 'Internal scan data'),
('fitness', 'ai_voice_receptionist', 4.0, 3000, 'growing', 'Internal scan data')
ON CONFLICT (industry_id, capability_id) DO NOTHING;

INSERT INTO adoption_stats (industry_id, capability_id, adoption_pct, sample_size, trend, source) VALUES
('automotive', 'online_booking', 28.0, 4000, 'growing', 'Internal scan data'),
('automotive', 'crm', 42.0, 4000, 'stable', 'Internal scan data'),
('automotive', 'review_management', 38.0, 4000, 'growing', 'Internal scan data'),
('automotive', 'analytics', 52.0, 4000, 'stable', 'Internal scan data'),
('automotive', 'seo_tools', 48.0, 4000, 'stable', 'Internal scan data'),
('automotive', 'email_marketing', 32.0, 4000, 'stable', 'Internal scan data'),
('automotive', 'sms_marketing', 18.0, 4000, 'growing', 'Internal scan data'),
('automotive', 'lead_capture', 35.0, 4000, 'growing', 'Internal scan data'),
('automotive', 'website_chat', 22.0, 4000, 'stable', 'Internal scan data'),
('automotive', 'ai_voice_receptionist', 7.0, 4000, 'growing', 'Internal scan data'),
('automotive', 'social_media', 45.0, 4000, 'stable', 'Internal scan data'),
('automotive', 'ai_chatbot', 5.0, 4000, 'growing', 'Internal scan data')
ON CONFLICT (industry_id, capability_id) DO NOTHING;

INSERT INTO adoption_stats (industry_id, capability_id, adoption_pct, sample_size, trend, source) VALUES
('home_services', 'online_booking', 35.0, 5000, 'growing', 'Internal scan data'),
('home_services', 'crm', 32.0, 5000, 'growing', 'Internal scan data'),
('home_services', 'lead_capture', 48.0, 5000, 'growing', 'Internal scan data'),
('home_services', 'review_management', 42.0, 5000, 'growing', 'Internal scan data'),
('home_services', 'seo_tools', 52.0, 5000, 'stable', 'Internal scan data'),
('home_services', 'analytics', 58.0, 5000, 'stable', 'Internal scan data'),
('home_services', 'email_marketing', 25.0, 5000, 'stable', 'Internal scan data'),
('home_services', 'sms_marketing', 22.0, 5000, 'growing', 'Internal scan data'),
('home_services', 'website_chat', 18.0, 5000, 'stable', 'Internal scan data'),
('home_services', 'ai_voice_receptionist', 6.0, 5000, 'growing', 'Internal scan data'),
('home_services', 'social_media', 38.0, 5000, 'stable', 'Internal scan data'),
('home_services', 'ai_chatbot', 4.0, 5000, 'growing', 'Internal scan data')
ON CONFLICT (industry_id, capability_id) DO NOTHING;

-- ============ RECOMMENDATIONS ============
INSERT INTO recommendations (industry_id, capability_id, name, category, why_it_fits, best_for, priority) VALUES
('dental', 'ai_voice_receptionist', 'AI Voice Receptionist', 'Communication', 'Dental offices lose 20-30% of calls to voicemail. An AI voice receptionist can answer 24/7, book appointments, and handle FAQs.', 'Practices with high call volume and front desk bottlenecks', 1),
('dental', 'ai_chatbot', 'AI-Powered Dental Chatbot', 'Communication', 'Patients often have repetitive questions. An AI chatbot can answer instantly 24/7, qualify leads, and route complex questions to staff.', 'Practices that want to reduce front desk workload and capture after-hours leads', 2),
('legal', 'ai_chatbot', 'AI Legal Intake Chatbot', 'Communication', 'Law firms spend significant time on initial consultations. An AI chatbot can pre-qualify cases and schedule consultations.', 'Firms with high intake volume and limited support staff', 1),
('legal', 'ai_voice_receptionist', 'AI Voice Receptionist', 'Communication', 'Potential clients often call outside business hours. An AI voice assistant can capture leads 24/7 and schedule consultations.', 'Firms that want to capture after-hours leads and reduce missed calls', 2),
('restaurant', 'ai_chatbot', 'AI Reservation & Menu Chatbot', 'Communication', 'Restaurants get repetitive calls. An AI chatbot can handle reservations, answer menu questions, and upsell specials 24/7.', 'Restaurants with high call volume and online presence', 1),
('restaurant', 'sms_marketing', 'AI-Powered SMS Marketing', 'Marketing', 'SMS has 98% open rates. AI can personalize offers based on dining patterns and recover no-shows with automated reminders.', 'Restaurants looking to increase repeat visits and reduce no-shows', 2),
('retail', 'ai_chatbot', 'AI Shopping Assistant', 'Communication', 'Online shoppers abandon carts when they cant get quick answers. An AI shopping assistant can recommend products and recover carts.', 'Retailers with online stores and high cart abandonment', 1),
('retail', 'sms_marketing', 'AI-Driven SMS Campaigns', 'Marketing', 'SMS marketing with AI segmentation can deliver personalized offers at optimal times, driving repeat purchases.', 'Retailers wanting to increase customer lifetime value', 2),
('real_estate', 'ai_chatbot', 'AI Property Match Chatbot', 'Communication', 'Buyers expect instant responses. An AI chatbot can qualify leads, match properties, and schedule viewings 24/7.', 'Agencies with high online lead volume', 1),
('real_estate', 'ai_voice_receptionist', 'AI Voice Lead Capture', 'Communication', 'Property inquiries come at all hours. An AI voice assistant can capture lead details and schedule viewings.', 'Agencies that want 24/7 lead capture without hiring staff', 2),
('fitness', 'ai_chatbot', 'AI Fitness Membership Chatbot', 'Communication', 'Gyms get repetitive questions about classes, pricing, and schedules. An AI chatbot can answer instantly and book trials.', 'Studios and gyms with high inquiry volume', 1),
('fitness', 'sms_marketing', 'AI-Powered Member Retention SMS', 'Marketing', 'AI can predict churn risk and send personalized re-engagement messages to keep members active.', 'Gyms wanting to reduce churn and increase member retention', 2),
('automotive', 'ai_voice_receptionist', 'AI Service Desk Voice Assistant', 'Communication', 'Auto shops lose customers to voicemail. An AI voice assistant can book service appointments and provide quotes 24/7.', 'Shops with high call volume and limited front desk staff', 1),
('automotive', 'ai_chatbot', 'AI Service Inquiry Chatbot', 'Communication', 'Customers ask about services, pricing, and availability. An AI chatbot can answer instantly and schedule services.', 'Shops wanting to reduce phone time and capture online leads', 2),
('home_services', 'ai_voice_receptionist', 'AI Dispatch Voice Assistant', 'Communication', 'Contractors miss calls while on job sites. An AI voice assistant can answer 24/7 and schedule appointments.', 'Contractors and trades with mobile workforces', 1),
('home_services', 'ai_chatbot', 'AI Service Quote Chatbot', 'Communication', 'Homeowners want quick quotes. An AI chatbot can gather project details and schedule site visits 24/7.', 'Service businesses wanting to capture and qualify leads online', 2)
ON CONFLICT DO NOTHING;