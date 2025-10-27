import type { ActionFunctionArgs } from "react-router";
import { json } from "react-router";
import { authenticate } from "../shopify.server";
import { getMerchantByShop } from "../lib/supabase.server";
import { fetchShopifyProducts } from "../lib/shopify";

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const { session } = await authenticate.admin(request);
    
    // Get merchant and access token
    const merchant = await getMerchantByShop(session.shop);
    if (!merchant) {
      return json({ error: 'Merchant not found' }, { status: 404 });
    }

    // Parse request
    const body = await request.json();
    const { input } = body;

    if (!input) {
      return json({ error: 'Product handle or URL required' }, { status: 400 });
    }

    // Fetch products from Shopify
    const products = await fetchShopifyProducts(session.shop, merchant.access_token);

    // Try to find by handle (e.g., "awesome-t-shirt")
    let product = products.find(p => p.handle === input);

    // If not found by handle, try to extract handle from URL
    if (!product && input.includes('/')) {
      const urlMatch = input.match(/\/products\/([^/?]+)/);
      if (urlMatch) {
        const handle = urlMatch[1];
        product = products.find(p => p.handle === handle);
      }
    }

    if (!product) {
      return json({ error: 'Product not found' }, { status: 404 });
    }

    return json({ success: true, product }, { status: 200 });
  } catch (error) {
    console.error('Error in product lookup:', error);
    return json({ error: 'Failed to lookup product' }, { status: 500 });
  }
};

