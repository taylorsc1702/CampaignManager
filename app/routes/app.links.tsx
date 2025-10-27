import type {
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { useLoaderData, Link } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { Page, Card, Text, Button, BlockStack, InlineStack, Layout, DataTable, Badge, Box } from "@shopify/polaris";
import { getMerchantByShop } from "../lib/supabase.server";
import { supabase } from "../lib/supabase";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  
  // Fetch merchant from Supabase
  const merchant = await getMerchantByShop(session.shop);
  
  if (!merchant) {
    throw new Error('Merchant not found. Please reinstall the app.');
  }

  // Fetch all links
  const { data: linksData } = await supabase
    .from('links')
    .select('id, code, product_id, variant_id, quantity, active, created_at, target_url')
    .eq('merchant_id', merchant.id)
    .order('created_at', { ascending: false });

  return {
    merchant: {
      id: merchant.id,
      shop_domain: merchant.shop_domain,
      plan: merchant.plan
    },
    links: linksData || []
  };
};

export default function LinksPage() {
  const { merchant, links } = useLoaderData<typeof loader>();

  const linksRows = links.map(link => [
    link.code,
    link.product_id,
    link.variant_id,
    link.quantity.toString(),
    <Badge key={`badge-${link.id}`} tone={link.active ? 'success' : 'critical'}>
      {link.active ? 'Active' : 'Inactive'}
    </Badge>,
    new Date(link.created_at).toLocaleDateString(),
    link.target_url
  ]);

  return (
    <Page title="Links Management">
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <InlineStack gap="400" align="space-between">
                <BlockStack gap="200">
                  <Text variant="headingLg" as="h2">Your Marketing Links</Text>
                  <Text variant="bodyMd" as="p" tone="subdued">
                    Manage and track all your marketing links, QR codes, and campaigns.
                  </Text>
                </BlockStack>
                
                <InlineStack gap="200">
                  <Button variant="primary">Create New Link</Button>
                  <Button variant="secondary">Bulk Upload</Button>
                </InlineStack>
              </InlineStack>

              {links.length > 0 ? (
                <Box padding="400" background="bg-surface-secondary" borderRadius="200">
                  <DataTable
                    columnContentTypes={['text', 'text', 'text', 'text', 'text', 'text', 'text']}
                    headings={['Code', 'Product ID', 'Variant ID', 'Quantity', 'Status', 'Created', 'URL']}
                    rows={linksRows}
                  />
                </Box>
              ) : (
                <Card>
                  <BlockStack gap="200" inlineAlign="center">
                    <Text variant="headingMd" as="h3">No links yet</Text>
                    <Text variant="bodyMd" as="p" tone="subdued">
                      Create your first marketing link to get started
                    </Text>
                  </BlockStack>
                </Card>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
