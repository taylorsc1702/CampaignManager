'use client'

import { useState, useEffect } from 'react'
import { 
  Page, 
  Layout, 
  Card, 
  Text, 
  Button, 
  Banner,
  Spinner,
  EmptyState
} from '@shopify/polaris'
import { PlusIcon } from '@shopify/polaris-icons'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Dashboard from '@/components/Dashboard'
import LinkCreator from '@/components/LinkCreator'

interface Merchant {
  id: string
  shop_domain: string
  plan: string
}

export default function AppPage() {
  const [merchant, setMerchant] = useState<Merchant | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showLinkCreator, setShowLinkCreator] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const getShop = () => {
      const urlParams = new URLSearchParams(window.location.search)
      return urlParams.get('shop')
    }

    const fetchMerchant = async () => {
      try {
        const shop = getShop()
        if (!shop) {
          setError('No shop parameter found')
          setLoading(false)
          return
        }

        const { data, error } = await supabase
          .from('merchants')
          .select('*')
          .eq('shop_domain', shop)
          .single()

        if (error) {
          setError('Failed to load merchant data')
          return
        }

        if (!data) {
          setError('Merchant not found. Please install the app.')
          return
        }

        setMerchant(data)
      } catch (err) {
        setError('An error occurred while loading the app')
      } finally {
        setLoading(false)
      }
    }

    fetchMerchant()
  }, [])

  if (loading) {
    return (
      <Page>
        <Layout>
          <Layout.Section>
            <Card>
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <Spinner size="large" />
                <Text variant="headingMd" as="p" tone="subdued">
                  Loading your campaign manager...
                </Text>
              </div>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    )
  }

  if (error) {
    return (
      <Page>
        <Layout>
          <Layout.Section>
            <Banner tone="critical">
              <Text variant="headingMd" as="p">
                {error}
              </Text>
            </Banner>
          </Layout.Section>
        </Layout>
      </Page>
    )
  }

  if (!merchant) {
    return (
      <Page>
        <Layout>
          <Layout.Section>
            <Card>
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <Text variant="headingMd" as="h2">Welcome to Campaign Manager</Text>
                <Text variant="bodyMd" as="p">Track QR codes and permalinks for your Shopify store</Text>
                <Button 
                  variant="primary" 
                  onClick={() => window.location.href = '/api/auth/install?shop=' + new URLSearchParams(window.location.search).get('shop')}
                >
                  Install App
                </Button>
              </div>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    )
  }

  return (
    <Page
      title="Campaign Manager"
      primaryAction={{
        content: 'Create Link',
        icon: PlusIcon,
        onAction: () => setShowLinkCreator(true)
      }}
    >
      <Layout>
        <Layout.Section>
          <Dashboard merchant={merchant} />
        </Layout.Section>
      </Layout>

      {showLinkCreator && (
        <LinkCreator
          merchant={merchant}
          onClose={() => setShowLinkCreator(false)}
        />
      )}
    </Page>
  )
}
