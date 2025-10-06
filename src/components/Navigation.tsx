'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { 
  Navigation as PolarisNavigation, 
  Text 
} from '@shopify/polaris'
import { 
  HomeIcon, 
  LinkIcon, 
  HashtagIcon,
  SettingsIcon,
  PersonIcon,
  AnalyticsIcon
} from '@shopify/polaris-icons'

export default function Navigation() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const shop = searchParams.get('shop')

  const navigationItems = [
    {
      label: 'Dashboard',
      icon: HomeIcon,
      url: `/app?shop=${shop}`,
      selected: pathname === '/app'
    },
    {
      label: 'Links',
      icon: LinkIcon,
      url: `/app/links?shop=${shop}`,
      selected: pathname === '/app/links'
    },
    {
      label: 'Campaigns',
      icon: HashtagIcon,
      url: `/app/campaigns?shop=${shop}`,
      selected: pathname === '/app/campaigns'
    },
    {
      label: 'Analytics',
      icon: AnalyticsIcon,
      url: `/app/analytics?shop=${shop}`,
      selected: pathname === '/app/analytics'
    },
    {
      label: 'Team',
      icon: PersonIcon,
      url: `/app/team?shop=${shop}`,
      selected: pathname === '/app/team'
    },
    {
      label: 'Settings',
      icon: SettingsIcon,
      url: `/app/settings?shop=${shop}`,
      selected: pathname === '/app/settings'
    }
  ]

  return (
    <PolarisNavigation location="/">
      <PolarisNavigation.Section
        items={navigationItems}
        rollup={{
          after: 3,
          view: 'view',
          hide: 'hide',
          activePath: pathname,
        }}
      />
    </PolarisNavigation>
  )
}
