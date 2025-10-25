import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { Outlet, useLoaderData, useRouteError, Link } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { AppProvider } from "@shopify/shopify-app-react-router/react";
import { AppProvider as PolarisAppProvider, Navigation, Frame } from "@shopify/polaris";
import "@shopify/polaris/build/esm/styles.css";

import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  // eslint-disable-next-line no-undef
  return { apiKey: process.env.SHOPIFY_API_KEY || "" };
};

export default function App() {
  const { apiKey } = useLoaderData<typeof loader>();

  const navigationMarkup = (
    <Navigation location="/">
      <Navigation.Section
        items={[
          {
            label: 'Dashboard',
            url: '/app',
            icon: 'home'
          },
          {
            label: 'Links',
            url: '/app/links',
            icon: 'link'
          },
          {
            label: 'Campaigns',
            url: '/app/campaigns',
            icon: 'campaign'
          },
          {
            label: 'Analytics',
            url: '/app/analytics',
            icon: 'analytics'
          },
          {
            label: 'Team',
            url: '/app/team',
            icon: 'team'
          },
          {
            label: 'Settings',
            url: '/app/settings',
            icon: 'settings'
          }
        ]}
      />
    </Navigation>
  );

  return (
    <AppProvider embedded apiKey={apiKey}>
      <PolarisAppProvider i18n={{}}>
        <Frame navigation={navigationMarkup}>
          <Outlet />
        </Frame>
      </PolarisAppProvider>
    </AppProvider>
  );
}

// Shopify needs React Router to catch some thrown responses, so that their headers are included in the response.
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
