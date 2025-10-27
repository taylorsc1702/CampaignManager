import type { ActionFunctionArgs } from "react-router";
import { json } from "react-router";
import { authenticate } from "../shopify.server";
import { getMerchantByShop } from "../lib/supabase.server";
import { supabase } from "../lib/supabase";
import { generateShortCode } from "../lib/shopify";

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const { session } = await authenticate.admin(request);
    
    // Get merchant
    const merchant = await getMerchantByShop(session.shop);
    if (!merchant) {
      return json({ error: 'Merchant not found' }, { status: 404 });
    }

    // Parse request body
    const body = await request.json();
    const {
      product_id,
      product_handle,
      variant_id,
      quantity = 1,
      discount_code,
      utm_source,
      utm_medium,
      utm_campaign,
      utm_term,
      utm_content,
      target_url
    } = body;

    // Generate unique code
    const code = generateShortCode();

    // Create link in Supabase
    const { data, error } = await supabase
      .from('links')
      .insert({
        merchant_id: merchant.id,
        code,
        product_id,
        product_handle,
        variant_id,
        quantity,
        discount_code,
        utm_source,
        utm_medium,
        utm_campaign,
        utm_term,
        utm_content,
        target_url,
        permalink_type: 'product',
        active: true
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating link:', error);
      return json({ error: 'Failed to create link' }, { status: 500 });
    }

    return json({ success: true, link: data }, { status: 201 });
  } catch (error) {
    console.error('Error in link creation:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};

