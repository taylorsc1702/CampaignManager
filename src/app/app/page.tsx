'use client'

import { useState, useEffect } from 'react'
import { Page, Card, BlockStack, Text, Button, InlineStack, Banner } from '@shopify/polaris'
import Dashboard from '@/components/Dashboard'
import LinkCreator from '@/components/LinkCreator'
import BulkPermalinkCreator from '@/components/BulkPermalinkCreator'
import BulkOperationsManager from '@/components/BulkOperationsManager'
import LinkTemplateManager from '@/components/LinkTemplateManager'
import { supabase } from '@/lib/supabase'
import '@shopify/polaris/build/esm/styles.css'

interface Merchant {
  id: string
  shop_domain: string
  plan: string
  access_token?: string
}

export default function AppPage() {
  const [merchant, setMerchant] = useState<Merchant | null>(null)
  const [loading, setLoading] = useState(true)
  const [showLinkCreator, setShowLinkCreator] = useState(false)
  const [showBulkPermalinkCreator, setShowBulkPermalinkCreator] = useState(false)
  const [showBulkOperationsManager, setShowBulkOperationsManager] = useState(false)
  const [showLinkTemplateManager, setShowLinkTemplateManager] = useState(false)

  useEffect(() => {
    loadMerchant()
  }, [])

  const loadMerchant = async () => {
    try {
      // For now, use a demo merchant
      // In production, you'll get this from Shopify session/OAuth
      const demoMerchant: Merchant = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        shop_domain: 'demo-shop.myshopify.com',
        plan: 'pro'
      }
      
      setMerchant(demoMerchant)
    } catch (error) {
      console.error('Error loading merchant:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Page title="CampaignLink">
        <Card>
          <BlockStack gap="300">
            <Text variant="bodyMd" as="p">Loading...</Text>
          </BlockStack>
        </Card>
      </Page>
    )
  }

  if (!merchant) {
    return (
      <Page title="CampaignLink">
        <Banner tone="warning">
          <p>Unable to load merchant data. Please reinstall the app.</p>
        </Banner>
      </Page>
    )
  }

  return (
    <>
      <Page
        title="CampaignLink"
        subtitle="Create and manage your marketing links"
        primaryAction={{
          content: 'Create Link',
          onAction: () => setShowLinkCreator(true),
        }}
        secondaryActions={[
          {
            content: 'Bulk Permalinks',
            onAction: () => setShowBulkPermalinkCreator(true),
          },
          {
            content: 'Templates',
            onAction: () => setShowLinkTemplateManager(true),
          },
          {
            content: 'Operations',
            onAction: () => setShowBulkOperationsManager(true),
          },
        ]}
      >
        <BlockStack gap="500">
          <Card>
            <BlockStack gap="300">
              <Text variant="headingMd" as="h2">Welcome to CampaignLink! 🎉</Text>
              <Text variant="bodyMd" as="p">
                Create marketing permalinks, generate QR codes, and track your campaign performance.
              </Text>
              <InlineStack gap="300">
                <Button onClick={() => setShowLinkCreator(true)}>Create Your First Link</Button>
                <Button onClick={() => setShowBulkPermalinkCreator(true)}>Bulk Upload</Button>
              </InlineStack>
            </BlockStack>
          </Card>

          <Dashboard merchant={merchant} />
        </BlockStack>
      </Page>

      {showLinkCreator && (
        <LinkCreator
          merchantId={merchant.id}
          shopDomain={merchant.shop_domain}
          onClose={() => setShowLinkCreator(false)}
        />
      )}

      {showBulkPermalinkCreator && (
        <BulkPermalinkCreator
          merchantId={merchant.id}
          shopDomain={merchant.shop_domain}
          onClose={() => setShowBulkPermalinkCreator(false)}
        />
      )}

      {showBulkOperationsManager && (
        <BulkOperationsManager
          merchantId={merchant.id}
          onClose={() => setShowBulkOperationsManager(false)}
        />
      )}

      {showLinkTemplateManager && (
        <LinkTemplateManager
          merchantId={merchant.id}
          onClose={() => setShowLinkTemplateManager(false)}
        />
      )}
    </>
  )
}

export const dynamic = 'force-dynamic'