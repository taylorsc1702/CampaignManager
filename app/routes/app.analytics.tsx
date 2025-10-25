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

export default function AnalyticsPage() {
  return (
    <s-page heading="Analytics">
      <s-section heading="Performance Analytics">
        <s-paragraph>
          Track the performance of your marketing links and campaigns.
        </s-paragraph>
        <s-button variant="primary">View Reports</s-button>
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
