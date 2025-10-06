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
  Banner,
  Icon,
  Box,
  Divider,
  InlineGrid,
  Badge
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
      subtitle="Collaborate with your team on campaigns and analytics"
      primaryAction={{
        content: 'Manage Team',
        onAction: () => setShowCollaboratorManager(true),
        icon: 'add'
      }}
    >
      <Layout>
        {/* Header Section */}
        <Layout.Section>
          <Box padding="600" background="bg-surface-brand" borderRadius="300">
            <BlockStack gap="300">
              <InlineStack gap="300" align="start">
                <Box padding="300" background="bg-surface-base" borderRadius="200">
                  <Icon source="person" tone="base" />
                </Box>
                <BlockStack gap="200">
                  <Text variant="headingLg" as="h2" tone="base">
                    Team Management
                  </Text>
                  <Text variant="bodyLg" as="p" tone="base">
                    Collaborate with your team members on campaigns, analytics, and link management
                  </Text>
                </BlockStack>
              </InlineStack>
            </BlockStack>
          </Box>
        </Layout.Section>

        {/* Current Plan Status */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <InlineStack gap="200" align="start">
                <Box padding="200" background="bg-surface-success" borderRadius="100">
                  <Icon source="checkmark" tone="base" />
                </Box>
                <BlockStack gap="100">
                  <Text variant="headingMd" as="h3">Current Plan</Text>
                  <Text variant="bodySm" as="p" tone="subdued">
                    Your current subscription and team limits
                  </Text>
                </BlockStack>
              </InlineStack>
              
              <Box padding="400" background="bg-surface-secondary" borderRadius="200">
                <InlineStack gap="400" align="space-between">
                  <BlockStack gap="200">
                    <Text variant="bodyMd" as="p" fontWeight="semibold">
                      {merchant.plan.charAt(0).toUpperCase() + merchant.plan.slice(1)} Plan
                    </Text>
                    <Text variant="bodySm" as="p" tone="subdued">
                      Active subscription
                    </Text>
                  </BlockStack>
                  <Badge status="success">Active</Badge>
                </InlineStack>
              </Box>
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Plan Features Grid */}
        <Layout.Section>
          <InlineGrid columns={{ xs: 1, sm: 3 }} gap="400">
            <Card>
              <BlockStack gap="400">
                <InlineStack gap="200" align="start">
                  <Box padding="200" background="bg-surface-info" borderRadius="100">
                    <Icon source="person" tone="base" />
                  </Box>
                  <BlockStack gap="100">
                    <Text variant="bodyMd" as="p" fontWeight="semibold">Starter</Text>
                    <Text variant="bodySm" as="p" tone="subdued">1 user (just you)</Text>
                  </BlockStack>
                </InlineStack>
                <Box padding="200" background="bg-surface-info" borderRadius="100">
                  <Text variant="bodySm" as="p" tone="base" fontWeight="semibold">
                    Perfect for individuals
                  </Text>
                </Box>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="400">
                <InlineStack gap="200" align="start">
                  <Box padding="200" background="bg-surface-warning" borderRadius="100">
                    <Icon source="person" tone="base" />
                  </Box>
                  <BlockStack gap="100">
                    <Text variant="bodyMd" as="p" fontWeight="semibold">Growth</Text>
                    <Text variant="bodySm" as="p" tone="subdued">Up to 3 collaborators</Text>
                  </BlockStack>
                </InlineStack>
                <Box padding="200" background="bg-surface-warning" borderRadius="100">
                  <Text variant="bodySm" as="p" tone="base" fontWeight="semibold">
                    Great for small teams
                  </Text>
                </Box>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="400">
                <InlineStack gap="200" align="start">
                  <Box padding="200" background="bg-surface-critical" borderRadius="100">
                    <Icon source="person" tone="base" />
                  </Box>
                  <BlockStack gap="100">
                    <Text variant="bodyMd" as="p" fontWeight="semibold">Pro</Text>
                    <Text variant="bodySm" as="p" tone="subdued">Unlimited collaborators</Text>
                  </BlockStack>
                </InlineStack>
                <Box padding="200" background="bg-surface-critical" borderRadius="100">
                  <Text variant="bodySm" as="p" tone="base" fontWeight="semibold">
                    For growing businesses
                  </Text>
                </Box>
              </BlockStack>
            </Card>
          </InlineGrid>
        </Layout.Section>

        {/* Team Management Section */}
        <Layout.Section>
          <Card>
            <BlockStack gap="500">
              <InlineStack gap="300" align="space-between">
                <InlineStack gap="200" align="start">
                  <Box padding="200" background="bg-surface-brand" borderRadius="100">
                    <Icon source="team" tone="base" />
                  </Box>
                  <BlockStack gap="100">
                    <Text variant="headingMd" as="h3">Team Collaborators</Text>
                    <Text variant="bodySm" as="p" tone="subdued">
                      Manage your team members and their access to the Campaign Manager app
                    </Text>
                  </BlockStack>
                </InlineStack>
                <Button 
                  variant="primary"
                  icon="add"
                  onClick={() => setShowCollaboratorManager(true)}
                >
                  Manage Team Members
                </Button>
              </InlineStack>
              
              <Divider />
              
              <Box padding="300" background="bg-surface-secondary" borderRadius="200">
                <Text variant="bodyMd" as="p">
                  Collaborate with your marketing team to create and track QR codes and campaigns. 
                  Invite team members, assign roles, and manage permissions to streamline your workflow.
                </Text>
              </Box>
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Role Permissions */}
        <Layout.Section>
          <Card>
            <BlockStack gap="500">
              <InlineStack gap="200" align="start">
                <Box padding="200" background="bg-surface-brand" borderRadius="100">
                  <Icon source="settings" tone="base" />
                </Box>
                <BlockStack gap="100">
                  <Text variant="headingMd" as="h3">Collaborator Roles</Text>
                  <Text variant="bodySm" as="p" tone="subdued">
                    Different permission levels for your team members
                  </Text>
                </BlockStack>
              </InlineStack>
              
              <InlineGrid columns={{ xs: 1, sm: 3 }} gap="400">
                <Box padding="400" background="bg-surface-success" borderRadius="200">
                  <BlockStack gap="300">
                    <InlineStack gap="200" align="start">
                      <Box padding="200" background="bg-surface-base" borderRadius="100">
                        <Icon source="crown" tone="base" />
                      </Box>
                      <BlockStack gap="100">
                        <Text variant="bodyMd" as="p" fontWeight="semibold">Owner</Text>
                        <Text variant="bodySm" as="p" tone="subdued">Full access</Text>
                      </BlockStack>
                    </InlineStack>
                    <Text variant="bodySm" as="p">
                      Full access to all features, billing, and team management
                    </Text>
                  </BlockStack>
                </Box>

                <Box padding="400" background="bg-surface-warning" borderRadius="200">
                  <BlockStack gap="300">
                    <InlineStack gap="200" align="start">
                      <Box padding="200" background="bg-surface-base" borderRadius="100">
                        <Icon source="settings" tone="base" />
                      </Box>
                      <BlockStack gap="100">
                        <Text variant="bodyMd" as="p" fontWeight="semibold">Admin</Text>
                        <Text variant="bodySm" as="p" tone="subdued">Management access</Text>
                      </BlockStack>
                    </InlineStack>
                    <Text variant="bodySm" as="p">
                      Can manage team members, create campaigns, and access analytics
                    </Text>
                  </BlockStack>
                </Box>

                <Box padding="400" background="bg-surface-info" borderRadius="200">
                  <BlockStack gap="300">
                    <InlineStack gap="200" align="start">
                      <Box padding="200" background="bg-surface-base" borderRadius="100">
                        <Icon source="person" tone="base" />
                      </Box>
                      <BlockStack gap="100">
                        <Text variant="bodyMd" as="p" fontWeight="semibold">Member</Text>
                        <Text variant="bodySm" as="p" tone="subdued">Basic access</Text>
                      </BlockStack>
                    </InlineStack>
                    <Text variant="bodySm" as="p">
                      Can create links and QR codes, view basic analytics
                    </Text>
                  </BlockStack>
                </Box>
              </InlineGrid>
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

