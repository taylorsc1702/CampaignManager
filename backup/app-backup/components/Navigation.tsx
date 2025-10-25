'use client'

import { usePathname } from 'next/navigation'
import { Navigation as PolarisNavigation } from '@shopify/polaris'
import {
  HomeIcon,
  LinkIcon,
  HashtagIcon,
  SettingsIcon,
} from '@shopify/polaris-icons'

export default function Navigation() {
  const pathname = usePathname()
  
  // For Shopify embedded apps, we'll use simple navigation without shop params
  const getHref = (path: string) => `/app${path}`

  return (
    <PolarisNavigation location={pathname}>
      <PolarisNavigation.Section
        items={[
          {
            label: 'Dashboard',
            icon: HomeIcon,
            url: getHref(''),
            exactMatch: true,
            selected: pathname === '/app',
          },
          {
            label: 'Links',
            icon: LinkIcon,
            url: getHref('/links'),
            selected: pathname?.startsWith('/app/links'),
          },
          {
            label: 'Campaigns',
            icon: HashtagIcon,
            url: getHref('/campaigns'),
            selected: pathname?.startsWith('/app/campaigns'),
          },
          {
            label: 'Analytics',
            icon: HashtagIcon,
            url: getHref('/analytics'),
            selected: pathname?.startsWith('/app/analytics'),
          },
          {
            label: 'Team',
            icon: HashtagIcon,
            url: getHref('/team'),
            selected: pathname?.startsWith('/app/team'),
          },
          {
            label: 'Settings',
            icon: SettingsIcon,
            url: getHref('/settings'),
            selected: pathname?.startsWith('/app/settings'),
          },
        ]}
      />
    </PolarisNavigation>
  )
}
