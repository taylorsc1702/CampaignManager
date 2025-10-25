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

export default function TeamPage() {
  return (
    <s-page heading="Team Management">
      <s-section heading="Team Collaboration">
        <s-paragraph>
          Manage team members and collaboration features for your CampaignLink app.
        </s-paragraph>
        <s-button variant="primary">Invite Team Member</s-button>
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
