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
  Select
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
    <Page title="Settings">
      <Layout>
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

          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h3">Account Information</Text>
              
              <FormLayout>
                <TextField
                  label="Shop Domain"
                  value={merchant?.shop_domain || ''}
                  readOnly
                  autoComplete="off"
                />

                <Select
                  label="Plan"
                  options={planOptions}
                  value={merchant?.plan || 'starter'}
                  onChange={updatePlan}
                  disabled={saving}
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

          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h3">Webhook Configuration</Text>
              
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

                <Text variant="bodyMd" as="p" tone="subdued">
                  Event: Order creation<br />
                  Format: JSON
                </Text>
              </BlockStack>
            </BlockStack>
          </Card>

          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h3">App Information</Text>
              
              <BlockStack gap="400">
                <Text variant="bodyMd" as="p">
                  <strong>Campaign Manager</strong> helps you track QR codes and permalinks for your Shopify store.
                </Text>
                
                <Text variant="bodyMd" as="p">
                  Features:
                </Text>
                <ul>
                  <li>Generate QR codes and short links for products</li>
                  <li>Track scans and conversions</li>
                  <li>UTM parameter tracking</li>
                  <li>Automatic discount code integration</li>
                  <li>Analytics dashboard</li>
                </ul>
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  )
}
