import type { ActionFunctionArgs } from "react-router";
import { json } from "react-router";
import { authenticate } from "../shopify.server";
import { getMerchantByShop } from "../lib/supabase.server";
import { supabase } from "../lib/supabase";

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const { session } = await authenticate.admin(request);
    
    // Get merchant
    const merchant = await getMerchantByShop(session.shop);
    if (!merchant) {
      return json({ error: 'Merchant not found' }, { status: 404 });
    }

    // Parse request
    const body = await request.json();
    const { linkId, updates } = body;

    if (!linkId || !updates) {
      return json({ error: 'Link ID and updates required' }, { status: 400 });
    }

    // Update link (only if it belongs to this merchant)
    const { data, error } = await supabase
      .from('links')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', linkId)
      .eq('merchant_id', merchant.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating link:', error);
      return json({ error: 'Failed to update link' }, { status: 500 });
    }

    return json({ success: true, link: data }, { status: 200 });
  } catch (error) {
    console.error('Error in link update:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};

