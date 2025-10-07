'use client'

import { useState, useEffect, Suspense } from 'react'
import { 
  Page, 
  Card, 
  Button, 
  TextField,
  Text, 
  BlockStack, 
  InlineStack,
  Icon,
  Box,
  Divider,
  InlineGrid,
  Badge
} from '@shopify/polaris'
import { SettingsIcon } from '@shopify/polaris-icons'
import '@shopify/polaris/build/esm/styles.css'

function SettingsPageContent() {
  const [settings, setSettings] = useState({
    shopDomain: 'demo-shop.myshopify.com',
    plan: 'pro',
    webhookUrl: 'https://your-app.vercel.app/api/webhooks/orders-create',
    timezone: 'UTC',
    currency: 'USD'
  })
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    try {
      // Save settings logic here
      console.log('Saving settings:', settings)
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
    } catch (error) {
      console.error('Error saving settings:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Page
      title="Settings"
      subtitle="Configure your app settings and preferences"
      primaryAction={{
        content: 'Save Changes',
        onAction: handleSave,
        loading
      }}
    >
      <BlockStack gap="500">
        {/* Header Section */}
        <Card>
          <BlockStack gap="300">
            <InlineStack gap="200" align="center">
              <Icon source={SettingsIcon} />
              <Text variant="headingMd" as="h2">App Configuration</Text>
            </InlineStack>
            <Text variant="bodyMd" as="p">
              Manage your app settings, webhook configuration, and account preferences.
            </Text>
          </BlockStack>
        </Card>

        {/* Account Information */}
        <Card>
          <BlockStack gap="300">
            <Text variant="headingMd" as="h2">Account Information</Text>
            <Divider />
            <InlineGrid columns={{ xs: 2 }} gap="300">
              <TextField
                label="Shop Domain"
                value={settings.shopDomain}
                onChange={(value) => setSettings(prev => ({ ...prev, shopDomain: value }))}
                disabled
                helpText="Your Shopify store domain"
              />
              <TextField
                label="Current Plan"
                value={settings.plan}
                onChange={(value) => setSettings(prev => ({ ...prev, plan: value }))}
                disabled
                helpText="Your current subscription plan"
              />
            </InlineGrid>
            <InlineGrid columns={{ xs: 2 }} gap="300">
              <TextField
                label="Timezone"
                value={settings.timezone}
                onChange={(value) => setSettings(prev => ({ ...prev, timezone: value }))}
                helpText="Default timezone for reports and analytics"
              />
              <TextField
                label="Currency"
                value={settings.currency}
                onChange={(value) => setSettings(prev => ({ ...prev, currency: value }))}
                helpText="Default currency for revenue tracking"
              />
            </InlineGrid>
          </BlockStack>
        </Card>

        {/* Webhook Configuration */}
        <Card>
          <BlockStack gap="300">
            <Text variant="headingMd" as="h2">Webhook Configuration</Text>
            <Divider />
            <TextField
              label="Order Webhook URL"
              value={settings.webhookUrl}
              onChange={(value) => setSettings(prev => ({ ...prev, webhookUrl: value }))}
              helpText="This URL will receive order notifications from Shopify"
            />
            <Box background="bg-surface-secondary" padding="300" borderRadius="200">
              <BlockStack gap="200">
                <Text variant="bodyMd" as="p" fontWeight="semibold">Webhook Setup Instructions:</Text>
                <Text variant="bodySm" as="p">1. Copy the webhook URL above</Text>
                <Text variant="bodySm" as="p">2. Go to your Shopify admin → Settings → Notifications</Text>
                <Text variant="bodySm" as="p">3. Add a new webhook for "Order creation"</Text>
                <Text variant="bodySm" as="p">4. Paste the URL and select JSON format</Text>
              </BlockStack>
            </Box>
          </BlockStack>
        </Card>

        {/* App Information */}
        <Card>
          <BlockStack gap="300">
            <Text variant="headingMd" as="h2">App Information</Text>
            <Divider />
            <InlineGrid columns={{ xs: 2 }} gap="300">
              <Card>
                <BlockStack gap="200">
                  <Text variant="headingMd" as="h3">CampaignLink</Text>
                  <Text variant="bodyMd" as="p" tone="subdued">Version 1.0.0</Text>
                  <Text variant="bodySm" as="p">Marketing link and QR code management for Shopify stores</Text>
                </BlockStack>
              </Card>
              <Card>
                <BlockStack gap="200">
                  <Text variant="headingMd" as="h3">Features</Text>
                  <BlockStack gap="100">
                    <Text variant="bodySm" as="p">✓ Link creation and management</Text>
                    <Text variant="bodySm" as="p">✓ QR code generation</Text>
                    <Text variant="bodySm" as="p">✓ Campaign tracking</Text>
                    <Text variant="bodySm" as="p">✓ Analytics and reporting</Text>
                  </BlockStack>
                </BlockStack>
              </Card>
            </InlineGrid>
          </BlockStack>
        </Card>

        {/* Support */}
        <Card>
          <BlockStack gap="300">
            <Text variant="headingMd" as="h2">Support & Resources</Text>
            <Divider />
            <InlineGrid columns={{ xs: 2 }} gap="300">
              <Card>
                <BlockStack gap="200">
                  <Text variant="headingMd" as="h3">Documentation</Text>
                  <Text variant="bodySm" as="p">Learn how to use CampaignLink effectively</Text>
                  <Button>View Documentation</Button>
                </BlockStack>
              </Card>
              <Card>
                <BlockStack gap="200">
                  <Text variant="headingMd" as="h3">Contact Support</Text>
                  <Text variant="bodySm" as="p">Get help from our support team</Text>
                  <Button>Contact Support</Button>
                </BlockStack>
              </Card>
            </InlineGrid>
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  )
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SettingsPageContent />
    </Suspense>
  )
}

export const dynamic = 'force-dynamic'
