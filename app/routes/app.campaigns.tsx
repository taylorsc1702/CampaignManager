import type {
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { Page, Card, Text, Button, Layout } from "@shopify/polaris";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return null;
};

export default function CampaignsPage() {
  return (
    <Page title="Campaigns">
      <Layout>
        <Layout.Section>
          <Card>
            <Text variant="headingMd" as="h2">Marketing Campaigns</Text>
            <Text variant="bodyMd" as="p">
              Organize and manage your marketing campaigns with permalinks and QR codes.
            </Text>
            <Button variant="primary">Create New Campaign</Button>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
