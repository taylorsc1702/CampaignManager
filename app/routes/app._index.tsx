import type {
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { Page } from "@shopify/polaris";
import { getMerchantByShop } from "../lib/supabase.server";
import { supabase } from "../lib/supabase";
import Dashboard from "../components/Dashboard";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  
  // Fetch merchant from Supabase
  const merchant = await getMerchantByShop(session.shop);
  
  if (!merchant) {
    throw new Error('Merchant not found. Please reinstall the app.');
  }

  assure Fetch recent links
  const { data: linksData } = await supabase
    .from('links')
    .select('id, code, product_id, variant_id, quantity, active, created_at')
    .eq('merchant_id', merchant.id)
    .order('created_at', { ascending: false })
    .limit(10);

  // Fetch stats
  const [
    { count: totalLinks },
    { count: totalScans },
    { count: totalOrders },
    { data: revenueData }
  ] = await Promise.all([
    supabase.from('links').select('*', { count: 'exact', head: true }).eq('merchant_id', merchant.id),
    supabase.from('scans').select('*', { count: 'exact', head: true }).eq('merchant_id', merchant.id),
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('merchant_id', merchant.id),
    supabase.from('orders').select('total').eq('merchant_id', merchant.id)
  ]);

  const totalRevenue = revenueData?.reduce((sum, order) => sum + parseFloat(order.total.toString()), 0) || 0;
  const conversionRate = (totalScans && totalScans > 0 && totalOrders) ? (totalOrders / totalScans) * 100 : 0;

  return {
    merchant: {
      id: merchant.id,
      shop_domain: merchant.shop_domain,
      plan: merchant.plan,
      access_token: merchant.access_token
    },
    links: linksData || [],
    stats: {
      totalLinks: totalLinks || 0,
      totalScans: totalScans || 0,
      totalOrders: totalOrders || 0,
      conversionRate: Math.round(conversionRate * 100) / 100,
      totalRevenue: Math.round(totalRevenue * 100) / 100
    }
  };
};

export default function Index() {
  const { merchant, links, stats } = useLoaderData<typeof loader>();

  return (
    <Page title="CampaignLink Dashboard">
      <Dashboard merchant={merchant} links={links} stats={stats} />
    </Page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};