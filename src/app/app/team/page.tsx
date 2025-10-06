'use client'

import { useState, useEffect } from 'react'
import { 
  Page, 
  Layout, 
  Card, 
  Button,
  BlockStack,
  InlineStack,
  Text,
  Banner
} from '@shopify/polaris'
import { supabase } from '@/lib/supabase'
import CollaboratorManager from '@/components/CollaboratorManager'

interface Merchant {
  id: string
  shop_domain: string
  plan: string
}

export default function TeamPage() {
  const [merchant, setMerchant] = useState<Merchant | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCollaboratorManager, setShowCollaboratorManager] = useState(false)

  useEffect(() => {
    fetchMerchant()
  }, [])

  const fetchMerchant = async () => {
    try {
      setLoading(true)
      
      // Get shop from URL
      const urlParams = new URLSearchParams(window.location.search)
      const shop = urlParams.get('shop')
      
      if (!shop) {
        setLoading(false)
        return
      }

      // Demo mode - show demo merchant
      if (shop === 'demo-shop.myshopify.com') {
        setMerchant({
          id: 'demo-merchant',
          shop_domain: shop,
          plan: 'growth'
        })
        setLoading(false)
        return
      }

      // Real mode - fetch from database
      try {
        const { data, error } = await supabase
          .from('merchants')
          .select('*')
          .eq('shop_domain', shop)
          .single()

        if (error && error.code === 'PGRST116') {
          // Table doesn't exist yet - show demo mode
          setMerchant({
            id: 'demo-merchant',
            shop_domain: shop,
            plan: 'growth'
          })
        } else if (error) {
          throw error
        } else if (data) {
          setMerchant(data)
        }
      } catch (dbError) {
        // Database not set up yet - show demo mode
        setMerchant({
          id: 'demo-merchant',
          shop_domain: shop,
          plan: 'growth'
        })
      }
    } catch (err) {
      console.error('Error fetching merchant:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Page title="Team">
        <Layout>
          <Layout.Section>
            <Card>
              <Text variant="bodyMd" as="p">Loading team information...</Text>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    )
  }

  if (!merchant) {
    return (
      <Page title="Team">
        <Layout>
          <Layout.Section>
            <Card>
              <Banner tone="critical">
                <Text variant="bodyMd" as="p">
                  No shop parameter found. Please access this page through the Shopify app.
                </Text>
              </Banner>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    )
  }

  return (
    <Page 
      title="Team Management"
      primaryAction={{
        content: 'Manage Team',
        onAction: () => setShowCollaboratorManager(true)
      }}
    >
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h3">Team Collaborators</Text>
              <Text variant="bodyMd" as="p">
                Manage your team members and their access to the Campaign Manager app. 
                Collaborate with your marketing team to create and track QR codes and campaigns.
              </Text>
              
              <InlineStack gap="200">
                <Button 
                  variant="primary"
                  onClick={() => setShowCollaboratorManager(true)}
                >
                  Manage Team Members
                </Button>
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h3">Current Plan: {merchant.plan.charAt(0).toUpperCase() + merchant.plan.slice(1)}</Text>
              
              <BlockStack gap="200">
                <Text variant="bodyMd" as="p">
                  <strong>Collaborator Limits:</strong>
                </Text>
                <Text variant="bodyMd" as="p">
                  • <strong>Starter:</strong> 1 user (just you)
                </Text>
                <Text variant="bodyMd" as="p">
                  • <strong>Growth:</strong> Up to 3 collaborators
                </Text>
                <Text variant="bodyMd" as="p">
                  • <strong>Pro:</strong> Unlimited collaborators
                </Text>
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h3">Collaborator Roles</Text>
              
              <BlockStack gap="200">
                <Text variant="bodyMd" as="p">
                  <strong>Owner:</strong> Full access to all features and billing
                </Text>
                <Text variant="bodyMd" as="p">
                  <strong>Admin:</strong> Can manage team members, create campaigns, and access analytics
                </Text>
                <Text variant="bodyMd" as="p">
                  <strong>Member:</strong> Can create links and QR codes, view basic analytics
                </Text>
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>

      {showCollaboratorManager && (
        <CollaboratorManager
          merchant={merchant}
          onClose={() => setShowCollaboratorManager(false)}
        />
      )}
    </Page>
  )
}

