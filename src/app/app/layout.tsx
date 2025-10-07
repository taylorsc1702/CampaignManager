'use client'

import { AppProvider, Frame } from '@shopify/polaris'
import { Provider as AppBridgeProvider } from '@shopify/app-bridge-react'
import Navigation from '@/components/Navigation'
import '@shopify/polaris/build/esm/styles.css'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'

function AppLayoutContent({
  children,
}: {
  children: React.ReactNode
}) {
  const searchParams = useSearchParams()
  const shop = searchParams.get('shop')
  const host = searchParams.get('host')
  const [appBridgeConfig, setAppBridgeConfig] = useState<any>(null)

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_SHOPIFY_API_KEY
    if (apiKey && (shop || host)) {
      setAppBridgeConfig({
        apiKey: apiKey,
        host: host || shop || '',
        forceRedirect: false,
      })
    }
  }, [shop, host])

  if (!appBridgeConfig) {
    return (
      <AppProvider
        i18n={{
          Polaris: {
            Avatar: {
              label: 'Avatar',
              labelWithInitials: 'Avatar with initials {initials}',
            },
            Frame: { skipToContent: 'Skip to content' },
            TopBar: {
              toggleMenuLabel: 'Toggle menu',
              SearchField: {
                clearButtonLabel: 'Clear',
                search: 'Search',
              },
            },
          },
        }}
      >
        <Frame navigation={<Navigation />}>
          {children}
        </Frame>
      </AppProvider>
    )
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
            Frame: { skipToContent: 'Skip to content' },
            TopBar: {
              toggleMenuLabel: 'Toggle menu',
              SearchField: {
                clearButtonLabel: 'Clear',
                search: 'Search',
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

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AppLayoutContent>{children}</AppLayoutContent>
    </Suspense>
  )
}