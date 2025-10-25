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

export default function CampaignsPage() {
  return (
    <s-page heading="Campaigns">
      <s-section heading="Marketing Campaigns">
        <s-paragraph>
          Organize and manage your marketing campaigns with permalinks and QR codes.
        </s-paragraph>
        <s-button variant="primary">Create New Campaign</s-button>
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
