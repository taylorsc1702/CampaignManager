'use client'

import { useState, useEffect, Suspense } from 'react'
import { 
  Page, 
  Card, 
  DataTable, 
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
import { supabase } from '@/lib/supabase'
import '@shopify/polaris/build/esm/styles.css'

interface Campaign {
  id: string
  name: string
  description?: string
  status: 'active' | 'paused' | 'completed'
  created_at: string
  links_count?: number
  total_scans?: number
  total_orders?: number
}

function CampaignsPageContent() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalCampaigns: 0,
    activeCampaigns: 0,
    totalLinks: 0
  })

  useEffect(() => {
    fetchCampaigns()
  }, [])

  const fetchCampaigns = async () => {
    try {
      const merchantId = '550e8400-e29b-41d4-a716-446655440000'
      
      // Check if this is a demo merchant
      const isDemo = merchantId === '550e8400-e29b-41d4-a716-446655440000'
      
      if (isDemo) {
        // Set demo data
        setCampaigns([])
        setStats({
          totalCampaigns: 0,
          activeCampaigns: 0,
          totalLinks: 0
        })
        setLoading(false)
        return
      }

      // Fetch campaigns
      const { data: campaignsData, error: campaignsError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('merchant_id', merchantId)
        .order('created_at', { ascending: false })

      if (campaignsError) throw campaignsError

      // Fetch stats
      const [
        { count: totalCampaigns },
        { count: activeCampaigns },
        { count: totalLinks }
      ] = await Promise.all([
        supabase.from('campaigns').select('*', { count: 'exact', head: true }).eq('merchant_id', merchantId),
        supabase.from('campaigns').select('*', { count: 'exact', head: true }).eq('merchant_id', merchantId).eq('status', 'active'),
        supabase.from('links').select('*', { count: 'exact', head: true }).eq('merchant_id', merchantId)
      ])

      setCampaigns(campaignsData || [])
      setStats({
        totalCampaigns: totalCampaigns || 0,
        activeCampaigns: activeCampaigns || 0,
        totalLinks: totalLinks || 0
      })
    } catch (error) {
      console.error('Failed to fetch campaigns:', error)
      setCampaigns([])
      setStats({
        totalCampaigns: 0,
        activeCampaigns: 0,
        totalLinks: 0
      })
    } finally {
      setLoading(false)
    }
  }

  const campaignsRows = campaigns.map(campaign => [
    campaign.name,
    campaign.description || 'No description',
    <Badge key={`badge-${campaign.id}`} tone={
      campaign.status === 'active' ? 'success' : 
      campaign.status === 'paused' ? 'warning' : 'critical'
    }>
      {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
    </Badge>,
    campaign.links_count || 0,
    campaign.total_scans || 0,
    campaign.total_orders || 0,
    new Date(campaign.created_at).toLocaleDateString()
  ])

  const headings = [
    'Campaign Name',
    'Description',
    'Status',
    'Links',
    'Scans',
    'Orders',
    'Created'
  ]

  return (
    <Page
      title="Campaigns"
      subtitle="Organize and track your marketing campaigns"
      primaryAction={{
        content: 'Create Campaign',
        onAction: () => console.log('Create campaign')
      }}
    >
      <BlockStack gap="500">
        {/* Header Section */}
        <Card>
          <BlockStack gap="300">
            <InlineStack gap="200" align="center">
              <Icon source={HashtagIcon} />
              <Text variant="headingMd" as="h2">Campaign Management</Text>
            </InlineStack>
            <Text variant="bodyMd" as="p">
              Create and manage marketing campaigns. Track performance across all your links and optimize your marketing efforts.
            </Text>
          </BlockStack>
        </Card>

        {/* Stats Overview */}
        <InlineGrid columns={{ xs: 3 }} gap="300">
          <Card>
            <BlockStack gap="200">
              <Text variant="headingLg" as="h3">{stats.totalCampaigns}</Text>
              <Text variant="bodyMd" as="p" tone="subdued">Total Campaigns</Text>
            </BlockStack>
          </Card>
          <Card>
            <BlockStack gap="200">
              <Text variant="headingLg" as="h3">{stats.activeCampaigns}</Text>
              <Text variant="bodyMd" as="p" tone="subdued">Active Campaigns</Text>
            </BlockStack>
          </Card>
          <Card>
            <BlockStack gap="200">
              <Text variant="headingLg" as="h3">{stats.totalLinks}</Text>
              <Text variant="bodyMd" as="p" tone="subdued">Total Links</Text>
            </BlockStack>
          </Card>
        </InlineGrid>

        {/* Campaigns Table */}
        <Card>
          <BlockStack gap="300">
            <InlineStack gap="200" align="center">
              <Icon source={HashtagIcon} />
              <Text variant="headingMd" as="h2">All Campaigns</Text>
            </InlineStack>
            <Divider />
            <DataTable
              columnContentTypes={['text', 'text', 'text', 'numeric', 'numeric', 'numeric', 'text']}
              headings={headings}
              rows={campaignsRows}
              footerContent={
                <InlineStack align="space-between">
                  <Text variant="bodySm" as="p" tone="subdued">
                    Showing {campaigns.length} campaigns
                  </Text>
                  <Text variant="bodySm" as="p" tone="subdued">
                    Live campaign tracking
                  </Text>
                </InlineStack>
              }
            />
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  )
}

export default function CampaignsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CampaignsPageContent />
    </Suspense>
  )
}

export const dynamic = 'force-dynamic'
