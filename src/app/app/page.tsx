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
import BulkLinkCreator from '@/components/BulkLinkCreator'
import BulkPermalinkCreator from '@/components/BulkPermalinkCreator'
import BulkOperationsManager from '@/components/BulkOperationsManager'
import LinkTemplateManager from '@/components/LinkTemplateManager'
import CollaboratorManager from '@/components/CollaboratorManager'

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
  const [showBulkLinkCreator, setShowBulkLinkCreator] = useState(false)
  const [showBulkPermalinkCreator, setShowBulkPermalinkCreator] = useState(false)
  const [showBulkOperationsManager, setShowBulkOperationsManager] = useState(false)
  const [showLinkTemplateManager, setShowLinkTemplateManager] = useState(false)
  const [showCollaboratorManager, setShowCollaboratorManager] = useState(false)
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

      // Check if we're in demo mode or if database tables exist
      try {
        const { data, error } = await supabase
          .from('merchants')
          .select('*')
          .eq('shop_domain', shop)
          .single()

        if (error && error.code === 'PGRST116') {
          // Table doesn't exist yet - show demo mode
          setMerchant(null)
          setLoading(false)
          return
        }

        if (error) {
          setError('Failed to load merchant data')
          return
        }

        if (!data) {
          setError('Merchant not found. Please install the app.')
          return
        }

        setMerchant(data)
      } catch (dbError) {
        // Database not set up yet - show demo mode
        console.log('Database not set up yet, showing demo mode')
        setMerchant(null)
      }
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
    // Show demo mode if no environment variables are configured OR if shop is demo-shop
    const isDemo = !process.env.NEXT_PUBLIC_SUPABASE_URL || 
                   process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your_') ||
                   getShop() === 'demo-shop.myshopify.com'
    
    if (isDemo) {
      return (
        <Page title="Campaign Manager - Demo Mode">
          <Layout>
            <Layout.Section>
              <Card>
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <Text variant="headingMd" as="h2">🎯 Campaign Manager Demo</Text>
                  <Text variant="bodyMd" as="p">
                    This is a demo of the Campaign Manager Shopify app. 
                    To see the full functionality, you'll need to configure Supabase and Shopify credentials.
                  </Text>
                  <div style={{ marginTop: '2rem' }}>
                    <Button 
                      variant="primary" 
                      onClick={() => setShowLinkCreator(true)}
                    >
                      🚀 Try Link Creator (Demo)
                    </Button>
                  </div>
                </div>
              </Card>
            </Layout.Section>
            
            <Layout.Section>
              <Card>
                <Text variant="headingMd" as="h3">📱 App Features Preview</Text>
                <div style={{ marginTop: '1rem' }}>
                  <Text variant="bodyMd" as="p">
                    <strong>Dashboard:</strong> View analytics, scans, conversions, and revenue tracking
                  </Text>
                  <Text variant="bodyMd" as="p">
                    <strong>Link Creator:</strong> Generate QR codes and short links for products with discount codes
                  </Text>
                  <Text variant="bodyMd" as="p">
                    <strong>Campaign Management:</strong> Organize links into marketing campaigns with UTM tracking
                  </Text>
                  <Text variant="bodyMd" as="p">
                    <strong>Analytics:</strong> Track conversion rates, top performing links, and revenue attribution
                  </Text>
                </div>
              </Card>
            </Layout.Section>
            
            <Layout.Section>
              <Card>
                <Text variant="headingMd" as="h3">🚀 NEW: Bulk Features Demo</Text>
                <div style={{ marginTop: '1rem' }}>
                  <Text variant="bodyMd" as="p">
                    <strong>Bulk Permalinks:</strong> Create hundreds of permalinks at once with CSV upload
                  </Text>
                  <Text variant="bodyMd" as="p">
                    <strong>Link Templates:</strong> Save reusable UTM parameter sets for consistency
                  </Text>
                  <Text variant="bodyMd" as="p">
                    <strong>Bulk Operations:</strong> Track and manage all bulk operations with progress monitoring
                  </Text>
                  <Text variant="bodyMd" as="p">
                    <strong>CSV Import:</strong> Upload CSV files with automatic validation and processing
                  </Text>
                </div>
                <div style={{ marginTop: '1rem' }}>
                  <Button 
                    variant="primary" 
                    onClick={() => setShowBulkPermalinkCreator(true)}
                  >
                    🚀 Try Bulk Permalinks (Demo)
                  </Button>
                </div>
              </Card>
            </Layout.Section>
          </Layout>
          
          {showLinkCreator && (
            <LinkCreator
              merchant={{
                id: 'demo-merchant',
                shop_domain: 'demo-shop.myshopify.com',
                plan: 'starter'
              }}
              onClose={() => setShowLinkCreator(false)}
            />
          )}
          
          {showBulkPermalinkCreator && (
            <BulkPermalinkCreator
              merchant={{
                id: 'demo-merchant',
                shop_domain: 'demo-shop.myshopify.com',
                plan: 'starter'
              }}
              onClose={() => setShowBulkPermalinkCreator(false)}
            />
          )}
          
          {showBulkOperationsManager && (
            <BulkOperationsManager
              merchant={{
                id: 'demo-merchant',
                shop_domain: 'demo-shop.myshopify.com',
                plan: 'starter'
              }}
              onClose={() => setShowBulkOperationsManager(false)}
            />
          )}
          
          {showLinkTemplateManager && (
            <LinkTemplateManager
              merchant={{
                id: 'demo-merchant',
                shop_domain: 'demo-shop.myshopify.com',
                plan: 'starter'
              }}
              onClose={() => setShowLinkTemplateManager(false)}
            />
          )}
        </Page>
      )
    }
    
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
      secondaryActions={[
        {
          content: 'Bulk Links',
          onAction: () => setShowBulkLinkCreator(true)
        },
        {
          content: 'Bulk Permalinks',
          onAction: () => setShowBulkPermalinkCreator(true)
        },
        {
          content: 'Templates',
          onAction: () => setShowLinkTemplateManager(true)
        },
        {
          content: 'Operations',
          onAction: () => setShowBulkOperationsManager(true)
        },
        {
          content: 'Team',
          onAction: () => setShowCollaboratorManager(true)
        }
      ]}
    >
      <Layout>
        <Layout.Section>
          <Dashboard merchant={merchant} />
        </Layout.Section>
        
        {/* Demo Mode - Show Bulk Features */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingLg" as="h2">🚀 Bulk Features Demo</Text>
              <Text variant="bodyMd" as="p">
                Here are the new bulk features you requested! (These will be in the main navigation when you set up your database)
              </Text>
              
              <InlineStack gap="300">
                <Button 
                  variant="primary" 
                  onClick={() => setShowBulkPermalinkCreator(true)}
                >
                  📋 Bulk Permalinks
                </Button>
                <Button 
                  onClick={() => setShowLinkTemplateManager(true)}
                >
                  📝 Templates
                </Button>
                <Button 
                  onClick={() => setShowBulkOperationsManager(true)}
                >
                  📊 Operations
                </Button>
              </InlineStack>
              
              <Text variant="bodySm" as="p" tone="subdued">
                These features include CSV upload, template management, and bulk operation tracking.
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>

      {showLinkCreator && (
        <LinkCreator
          merchant={merchant}
          onClose={() => setShowLinkCreator(false)}
        />
      )}

      {showBulkLinkCreator && (
        <BulkLinkCreator
          merchant={merchant}
          onClose={() => setShowBulkLinkCreator(false)}
        />
      )}

      {showBulkPermalinkCreator && (
        <BulkPermalinkCreator
          merchant={merchant}
          onClose={() => setShowBulkPermalinkCreator(false)}
        />
      )}

      {showBulkOperationsManager && (
        <BulkOperationsManager
          merchant={merchant}
          onClose={() => setShowBulkOperationsManager(false)}
        />
      )}

      {showLinkTemplateManager && (
        <LinkTemplateManager
          merchant={merchant}
          onClose={() => setShowLinkTemplateManager(false)}
        />
      )}

      {showCollaboratorManager && (
        <CollaboratorManager
          merchant={merchant}
          onClose={() => setShowCollaboratorManager(false)}
        />
      )}
    </Page>
  )
}
