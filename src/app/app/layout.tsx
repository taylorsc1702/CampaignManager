'use client'

import { AppProvider, Frame } from '@shopify/polaris'
import Navigation from '@/components/Navigation'
import '@shopify/polaris/build/esm/styles.css'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
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