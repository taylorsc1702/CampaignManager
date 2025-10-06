'use client'

import { useState, useEffect } from 'react'
import { 
  Page, 
  Layout, 
  Card, 
  Text,
  BlockStack,
  Button,
  Banner,
  FormLayout,
  TextField,
  Select,
  Icon,
  Box,
  Divider,
  InlineGrid,
  Badge,
  InlineStack
} from '@shopify/polaris'
import { supabase } from '@/lib/supabase'

interface Merchant {
  id: string
  shop_domain: string
  plan: 'starter' | 'growth' | 'pro'
}

export default function SettingsPage() {
  const [merchant, setMerchant] = useState<Merchant | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchMerchant()
  }, [])

  const fetchMerchant = async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search)
      const shop = urlParams.get('shop')
      
      if (!shop) return

      const { data, error } = await supabase
        .from('merchants')
        .select('*')
        .eq('shop_domain', shop)
        .single()

      if (error) throw error

      setMerchant(data)
    } catch (error) {
      console.error('Failed to fetch merchant:', error)
      setError('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const updatePlan = async (newPlan: 'starter' | 'growth' | 'pro') => {
    if (!merchant) return

    try {
      setSaving(true)
      setError(null)

      const { error } = await supabase
        .from('merchants')
        .update({ plan: newPlan })
        .eq('id', merchant.id)

      if (error) throw error

      setMerchant(prev => prev ? { ...prev, plan: newPlan } : null)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (error) {
      console.error('Failed to update plan:', error)
      setError('Failed to update plan')
    } finally {
      setSaving(false)
    }
  }

  const planOptions = [
    { label: 'Starter - 100 links/month', value: 'starter' },
    { label: 'Growth - 1,000 links/month', value: 'growth' },
    { label: 'Pro - Unlimited links', value: 'pro' }
  ]

  if (loading) {
    return (
      <Page title="Settings">
        <Layout>
          <Layout.Section>
            <Card>
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <Text variant="bodyMd" as="p">Loading settings...</Text>
              </div>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    )
  }

  return (
    <Page 
      title="Settings"
      subtitle="Configure your app preferences and account settings"
    >
      <Layout>
        {/* Header Section */}
        <Layout.Section>
          <Box padding="600" background="bg-surface-brand" borderRadius="300">
            <BlockStack gap="300">
              <InlineStack gap="300" align="start">
                <Box padding="300" background="bg-surface-base" borderRadius="200">
                  <Icon source="settings" tone="base" />
                </Box>
                <BlockStack gap="200">
                  <Text variant="headingLg" as="h2" tone="base">
                    Settings & Configuration
                  </Text>
                  <Text variant="bodyLg" as="p" tone="base">
                    Manage your account settings, plan preferences, and app configuration
                  </Text>
                </BlockStack>
              </InlineStack>
            </BlockStack>
          </Box>
        </Layout.Section>

        {/* Status Messages */}
        <Layout.Section>
          {success && (
            <Banner tone="success">
              <Text variant="bodyMd" as="p">Settings updated successfully!</Text>
            </Banner>
          )}

          {error && (
            <Banner tone="critical">
              <Text variant="bodyMd" as="p">{error}</Text>
            </Banner>
          )}
        </Layout.Section>

        {/* Account Information */}
        <Layout.Section>
          <Card>
            <BlockStack gap="500">
              <InlineStack gap="200" align="start">
                <Box padding="200" background="bg-surface-brand" borderRadius="100">
                  <Icon source="person" tone="base" />
                </Box>
                <BlockStack gap="100">
                  <Text variant="headingMd" as="h3">Account Information</Text>
                  <Text variant="bodySm" as="p" tone="subdued">
                    Your account details and subscription information
                  </Text>
                </BlockStack>
              </InlineStack>
              
              <Divider />
              
              <FormLayout>
                <TextField
                  label="Shop Domain"
                  value={merchant?.shop_domain || ''}
                  readOnly
                  autoComplete="off"
                  helpText="Your Shopify store domain"
                />

                <Select
                  label="Plan"
                  options={planOptions}
                  value={merchant?.plan || 'starter'}
                  onChange={updatePlan}
                  disabled={saving}
                  helpText="Choose the plan that best fits your needs"
                />

                <TextField
                  label="App Domain"
                  value={process.env.NEXT_PUBLIC_APP_DOMAIN || 'go.yourapp.com'}
                  readOnly
                  autoComplete="off"
                  helpText="This is the domain used for your short links"
                />
              </FormLayout>
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Webhook Configuration */}
        <Layout.Section>
          <Card>
            <BlockStack gap="500">
              <InlineStack gap="200" align="start">
                <Box padding="200" background="bg-surface-warning" borderRadius="100">
                  <Icon source="webhook" tone="base" />
                </Box>
                <BlockStack gap="100">
                  <Text variant="headingMd" as="h3">Webhook Configuration</Text>
                  <Text variant="bodySm" as="p" tone="subdued">
                    Set up automatic order tracking with Shopify webhooks
                  </Text>
                </BlockStack>
              </InlineStack>
              
              <Divider />
              
              <Box padding="400" background="bg-surface-secondary" borderRadius="200">
                <BlockStack gap="400">
                  <Text variant="bodyMd" as="p">
                    To track orders automatically, configure this webhook URL in your Shopify admin:
                  </Text>
                  
                  <TextField
                    label="Order Webhook URL"
                    value={`${process.env.SHOPIFY_APP_URL}/api/webhooks/orders-create`}
                    readOnly
                    autoComplete="off"
                    helpText="Add this URL in Shopify Admin > Settings > Notifications > Webhooks"
                  />

                  <Box padding="300" background="bg-surface-info" borderRadius="200">
                    <BlockStack gap="200">
                      <Text variant="bodySm" as="p" fontWeight="semibold">
                        Webhook Settings:
                      </Text>
                      <Text variant="bodySm" as="p" tone="subdued">
                        Event: Order creation<br />
                        Format: JSON
                      </Text>
                    </BlockStack>
                  </Box>
                </BlockStack>
              </Box>
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* App Information */}
        <Layout.Section>
          <Card>
            <BlockStack gap="500">
              <InlineStack gap="200" align="start">
                <Box padding="200" background="bg-surface-brand" borderRadius="100">
                  <Icon source="info" tone="base" />
                </Box>
                <BlockStack gap="100">
                  <Text variant="headingMd" as="h3">App Information</Text>
                  <Text variant="bodySm" as="p" tone="subdued">
                    Learn more about Campaign Manager and its features
                  </Text>
                </BlockStack>
              </InlineStack>
              
              <Divider />
              
              <Box padding="400" background="bg-surface-secondary" borderRadius="200">
                <BlockStack gap="400">
                  <Text variant="bodyMd" as="p">
                    <strong>Campaign Manager</strong> helps you track QR codes and permalinks for your Shopify store.
                  </Text>
                  
                  <InlineGrid columns={{ xs: 1, sm: 2 }} gap="400">
                    <Box padding="300" background="bg-surface-success" borderRadius="200">
                      <BlockStack gap="200">
                        <Text variant="bodySm" as="p" fontWeight="semibold">
                          🎯 Core Features:
                        </Text>
                        <ul style={{ margin: 0, paddingLeft: '1rem' }}>
                          <li>Generate QR codes and short links</li>
                          <li>Track scans and conversions</li>
                          <li>UTM parameter tracking</li>
                        </ul>
                      </BlockStack>
                    </Box>

                    <Box padding="300" background="bg-surface-info" borderRadius="200">
                      <BlockStack gap="200">
                        <Text variant="bodySm" as="p" fontWeight="semibold">
                          🚀 Advanced Features:
                        </Text>
                        <ul style={{ margin: 0, paddingLeft: '1rem' }}>
                          <li>Automatic discount code integration</li>
                          <li>Analytics dashboard</li>
                          <li>Bulk operations and CSV import</li>
                        </ul>
                      </BlockStack>
                    </Box>
                  </InlineGrid>
                </BlockStack>
              </Box>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  )
}
