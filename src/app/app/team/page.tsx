'use client'

import { useState, useEffect, Suspense } from 'react'
import { 
  Page, 
  Card, 
  Button, 
  Badge, 
  Text, 
  BlockStack, 
  InlineStack,
  Icon,
  Box,
  Divider,
  InlineGrid
} from '@shopify/polaris'
import { HashtagIcon } from '@shopify/polaris-icons'
import '@shopify/polaris/build/esm/styles.css'

interface Collaborator {
  id: string
  email: string
  role: 'owner' | 'admin' | 'member'
  status: 'active' | 'pending' | 'inactive'
  created_at: string
}

function TeamPageContent() {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [loading, setLoading] = useState(true)
  const [merchant, setMerchant] = useState({
    id: '550e8400-e29b-41d4-a716-446655440000',
    shop_domain: 'demo-shop.myshopify.com',
    plan: 'pro'
  })

  useEffect(() => {
    loadTeamData()
  }, [])

  const loadTeamData = async () => {
    try {
      // For demo purposes, set empty collaborators
      setCollaborators([])
    } catch (error) {
      console.error('Error loading team data:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Page
      title="Team"
      subtitle="Manage team members and collaboration settings"
      primaryAction={{
        content: 'Invite Team Member',
        onAction: () => console.log('Invite team member')
      }}
    >
      <BlockStack gap="500">
        {/* Header Section */}
        <Card>
          <BlockStack gap="300">
            <InlineStack gap="200" align="center">
              <Icon source={HashtagIcon} />
              <Text variant="headingMd" as="h2">Team Collaboration</Text>
            </InlineStack>
            <Text variant="bodyMd" as="p">
              Invite team members to collaborate on your marketing campaigns. Manage permissions and access levels for your organization.
            </Text>
          </BlockStack>
        </Card>

        {/* Current Plan Status */}
        <Card>
          <BlockStack gap="300">
            <InlineStack align="space-between">
              <Text variant="headingMd" as="h2">Current Plan</Text>
              <Badge tone="success">Pro Plan Active</Badge>
            </InlineStack>
            <Text variant="bodyMd" as="p">
              Your Pro plan includes team collaboration features, advanced analytics, and priority support.
            </Text>
          </BlockStack>
        </Card>

        {/* Plan Comparison */}
        <Card>
          <BlockStack gap="300">
            <Text variant="headingMd" as="h2">Plan Features</Text>
            <InlineGrid columns={{ xs: 3 }} gap="300">
              <Card>
                <BlockStack gap="200">
                  <Text variant="headingMd" as="h3">Starter</Text>
                  <Text variant="bodyMd" as="p" tone="subdued">Perfect for individuals</Text>
                  <BlockStack gap="100">
                    <Text variant="bodySm" as="p">✓ 1 team member</Text>
                    <Text variant="bodySm" as="p">✓ Basic analytics</Text>
                    <Text variant="bodySm" as="p">✓ 100 links/month</Text>
                  </BlockStack>
                </BlockStack>
              </Card>
              <Card>
                <BlockStack gap="200">
                  <Text variant="headingMd" as="h3">Growth</Text>
                  <Text variant="bodyMd" as="p" tone="subdued">For growing teams</Text>
                  <BlockStack gap="100">
                    <Text variant="bodySm" as="p">✓ 5 team members</Text>
                    <Text variant="bodySm" as="p">✓ Advanced analytics</Text>
                    <Text variant="bodySm" as="p">✓ 1,000 links/month</Text>
                  </BlockStack>
                </BlockStack>
              </Card>
              <Card>
                <BlockStack gap="200">
                  <Text variant="headingMd" as="h3">Pro</Text>
                  <Text variant="bodyMd" as="p" tone="subdued">For large organizations</Text>
                  <BlockStack gap="100">
                    <Text variant="bodySm" as="p">✓ Unlimited team members</Text>
                    <Text variant="bodySm" as="p">✓ Custom analytics</Text>
                    <Text variant="bodySm" as="p">✓ Unlimited links</Text>
                  </BlockStack>
                </BlockStack>
              </Card>
            </InlineGrid>
          </BlockStack>
        </Card>

        {/* Team Collaborators */}
        <Card>
          <BlockStack gap="300">
            <InlineStack align="space-between">
              <Text variant="headingMd" as="h2">Team Collaborators</Text>
              <Button>Invite Member</Button>
            </InlineStack>
            <Divider />
            {collaborators.length === 0 ? (
              <Box background="bg-surface-secondary" padding="400" borderRadius="200">
                <BlockStack gap="200" align="center">
                  <Text variant="bodyMd" as="p" alignment="center" tone="subdued">
                    No team members yet
                  </Text>
                  <Text variant="bodySm" as="p" alignment="center" tone="subdued">
                    Invite team members to start collaborating on your campaigns
                  </Text>
                  <Button>Invite Your First Team Member</Button>
                </BlockStack>
              </Box>
            ) : (
              <Text variant="bodyMd" as="p">Team members will be listed here</Text>
            )}
          </BlockStack>
        </Card>

        {/* Role Permissions */}
        <Card>
          <BlockStack gap="300">
            <Text variant="headingMd" as="h2">Role Permissions</Text>
            <InlineGrid columns={{ xs: 3 }} gap="300">
              <Card>
                <BlockStack gap="200">
                  <Text variant="headingMd" as="h3">Owner</Text>
                  <Text variant="bodyMd" as="p" tone="subdued">Full access to all features</Text>
                  <BlockStack gap="100">
                    <Text variant="bodySm" as="p">✓ Create and manage links</Text>
                    <Text variant="bodySm" as="p">✓ View all analytics</Text>
                    <Text variant="bodySm" as="p">✓ Manage team members</Text>
                    <Text variant="bodySm" as="p">✓ Billing and settings</Text>
                  </BlockStack>
                </BlockStack>
              </Card>
              <Card>
                <BlockStack gap="200">
                  <Text variant="headingMd" as="h3">Admin</Text>
                  <Text variant="bodyMd" as="p" tone="subdued">Manage campaigns and team</Text>
                  <BlockStack gap="100">
                    <Text variant="bodySm" as="p">✓ Create and manage links</Text>
                    <Text variant="bodySm" as="p">✓ View all analytics</Text>
                    <Text variant="bodySm" as="p">✓ Invite team members</Text>
                    <Text variant="bodySm" as="p">✗ Billing and settings</Text>
                  </BlockStack>
                </BlockStack>
              </Card>
              <Card>
                <BlockStack gap="200">
                  <Text variant="headingMd" as="h3">Member</Text>
                  <Text variant="bodyMd" as="p" tone="subdued">Create and manage links</Text>
                  <BlockStack gap="100">
                    <Text variant="bodySm" as="p">✓ Create and manage links</Text>
                    <Text variant="bodySm" as="p">✓ View assigned analytics</Text>
                    <Text variant="bodySm" as="p">✗ Invite team members</Text>
                    <Text variant="bodySm" as="p">✗ Billing and settings</Text>
                  </BlockStack>
                </BlockStack>
              </Card>
            </InlineGrid>
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  )
}

export default function TeamPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TeamPageContent />
    </Suspense>
  )
}

export const dynamic = 'force-dynamic'
