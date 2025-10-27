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
    const { linkId } = body;

    if (!linkId) {
      return json({ error: 'Link ID required' }, { status: 400 });
    }

    // Delete link (only if it belongs to this merchant)
    const { error } = await supabase
      .from('links')
      .delete()
      .eq('id', linkId)
      .eq('merchant_id', merchant.id);

    if (error) {
      console.error('Error deleting link:', error);
      return json({ error: 'Failed to delete link' }, { status: 500 });
    }

    return json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error in link deletion:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};

