import type { LoaderFunctionArgs } from "react-router";
import { json } from "react-router";
import { authenticate } from "../shopify.server";
import { getMerchantByShop } from "../lib/supabase.server";
import { supabase } from "../lib/supabase";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const { session } = await authenticate.admin(request);
    
    // Get merchant
    const merchant = await getMerchantByShop(session.shop);
    if (!merchant) {
      return json({ error: 'Merchant not found' }, { status: 404 });
    }

    // Get query params
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');

    // Fetch bulk operations
    const { data, count, error } = await supabase
      .from('bulk_operations')
      .select('*', { count: 'exact' })
      .eq('merchant_id', merchant.id)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) {
      console.error('Error fetching bulk operations:', error);
      return json({ error: 'Failed to fetch operations' }, { status: 500 });
    }

    return json({ 
      operations: data || [], 
      total: count || 0 
    }, { status: 200 });
  } catch (error) {
    console.error('Error in bulk operations:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};

