'use client'

import { AppProvider, Frame } from '@shopify/polaris'
import { Provider as AppBridgeProvider } from '@shopify/app-bridge-react'
import Navigation from '@/components/Navigation'
import '@shopify/polaris/build/esm/styles.css'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Get shop from URL parameters
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
  const shop = searchParams?.get('shop')

  const appBridgeConfig = {
    apiKey: process.env.NEXT_PUBLIC_SHOPIFY_API_KEY!,
    shopOrigin: shop || '',
    forceRedirect: true,
  }

  return (
    <AppBridgeProvider config={appBridgeConfig}>
      <AppProvider
        i18n={{
          Polaris: {
            Avatar: {
              label: 'Avatar',
              labelWithInitials: 'Avatar with initials {initials}',
            },
            ContextualSaveBar: {
              save: 'Save',
              discard: 'Discard',
            },
            TextField: {
              characterCount: '{count} characters',
            },
            TopBar: {
              toggleMenuLabel: 'Toggle menu',
              SearchField: {
                clearButtonLabel: 'Clear',
                search: 'Search',
              },
            },
            Modal: {
              iFrameTitle: 'body markup',
            },
            Frame: {
              skipToContent: 'Skip to content',
              navigationLabel: 'Navigation',
              Navigation: {
                closeMobileNavigationLabel: 'Close navigation',
              },
            },
          },
        }}
      >
        <Frame navigation={<Navigation />}>
          {children}
        </Frame>
      </AppProvider>
    </AppBridgeProvider>
  )
}
