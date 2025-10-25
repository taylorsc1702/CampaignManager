import { useState, useEffect } from "react";
import type {
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";

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
    <s-page heading="Links Management">
      <s-section heading="Your Marketing Links">
        <s-paragraph>
          Manage and track all your marketing links, QR codes, and campaigns.
        </s-paragraph>
        
        <s-stack direction="block" gap="base">
          <s-button variant="primary">Create New Link</s-button>
          <s-button variant="secondary">Bulk Upload</s-button>
        </s-stack>
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
