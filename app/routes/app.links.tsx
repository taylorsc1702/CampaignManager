import { useState, useEffect } from "react";
import type {
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { Page, Card, Text, Button, BlockStack, InlineStack, Layout } from "@shopify/polaris";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  return null;
};

export default function LinksPage() {
  const [merchant, setMerchant] = useState({
    id: 'demo-merchant',
    shop_domain: 'demo-shop.myshopify.com',
    plan: 'pro'
  });

  return (
    <Page title="Links Management">
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">Your Marketing Links</Text>
              <Text variant="bodyMd" as="p">
                Manage and track all your marketing links, QR codes, and campaigns.
              </Text>
              
              <InlineStack gap="200">
                <Button variant="primary">Create New Link</Button>
                <Button variant="secondary">Bulk Upload</Button>
              </InlineStack>
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
