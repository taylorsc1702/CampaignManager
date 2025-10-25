import { useState, useEffect } from "react";
import type {
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import Dashboard from "../components/Dashboard";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  return null;
};

export default function Index() {
  const [merchant, setMerchant] = useState({
    id: 'demo-merchant',
    shop_domain: 'demo-shop.myshopify.com',
    plan: 'pro'
  });

  return (
    <s-page heading="CampaignLink Dashboard">
      <Dashboard merchant={merchant} />
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};