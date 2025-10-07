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
import { LinkIcon } from '@shopify/polaris-icons'
import { supabase } from '@/lib/supabase'
import '@shopify/polaris/build/esm/styles.css'

interface Link {
  id: string
  code: string
  product_id: string
  product_handle: string
  variant_id: string
  quantity: number
  active: boolean
  created_at: string
  permalink_type: 'product' | 'cart' | 'custom'
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  scans_count?: number
  orders_count?: number
}

function LinksPageContent() {
  const [links, setLinks] = useState<Link[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalLinks: 0,
    activeLinks: 0,
    totalScans: 0,
    totalOrders: 0
  })

  useEffect(() => {
    fetchLinks()
  }, [])

  const fetchLinks = async () => {
    try {
      const merchantId = '550e8400-e29b-41d4-a716-446655440000'
      
      // Check if this is a demo merchant
      const isDemo = merchantId === '550e8400-e29b-41d4-a716-446655440000'
      
      if (isDemo) {
        // Set demo data
        setLinks([])
        setStats({
          totalLinks: 0,
          activeLinks: 0,
          totalScans: 0,
          totalOrders: 0
        })
        setLoading(false)
        return
      }

      // Fetch links
      const { data: linksData, error: linksError } = await supabase
        .from('links')
        .select('*')
        .eq('merchant_id', merchantId)
        .order('created_at', { ascending: false })

      if (linksError) throw linksError

      // Fetch stats
      const [
        { count: totalLinks },
        { count: activeLinks },
        { count: totalScans },
        { count: totalOrders }
      ] = await Promise.all([
        supabase.from('links').select('*', { count: 'exact', head: true }).eq('merchant_id', merchantId),
        supabase.from('links').select('*', { count: 'exact', head: true }).eq('merchant_id', merchantId).eq('active', true),
        supabase.from('scans').select('*', { count: 'exact', head: true }).eq('merchant_id', merchantId),
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('merchant_id', merchantId)
      ])

      setLinks(linksData || [])
      setStats({
        totalLinks: totalLinks || 0,
        activeLinks: activeLinks || 0,
        totalScans: totalScans || 0,
        totalOrders: totalOrders || 0
      })
    } catch (error) {
      console.error('Failed to fetch links:', error)
      setLinks([])
      setStats({
        totalLinks: 0,
        activeLinks: 0,
        totalScans: 0,
        totalOrders: 0
      })
    } finally {
      setLoading(false)
    }
  }

  const linksRows = links.map(link => [
    link.code,
    link.product_handle || 'N/A',
    <Badge key={`badge-${link.id}`} tone={link.active ? 'success' : 'critical'}>
      {link.active ? 'Active' : 'Inactive'}
    </Badge>,
    <Badge key={`type-${link.id}`} tone="info">
      {link.permalink_type}
    </Badge>,
    link.scans_count || 0,
    link.orders_count || 0,
    new Date(link.created_at).toLocaleDateString()
  ])

  const headings = [
    'Code',
    'Product Handle',
    'Status',
    'Type',
    'Scans',
    'Orders',
    'Created'
  ]

  return (
    <Page
      title="Links"
      subtitle="Manage your marketing links and track performance"
      primaryAction={{
        content: 'Create Link',
        onAction: () => window.location.href = '/app'
      }}
      secondaryActions={[
        {
          content: 'Bulk Upload',
          onAction: () => window.location.href = '/app'
        }
      ]}
    >
      <BlockStack gap="500">
        {/* Header Section */}
        <Card>
          <BlockStack gap="300">
            <InlineStack gap="200" align="center">
              <Icon source={LinkIcon} />
              <Text variant="headingMd" as="h2">Link Management</Text>
            </InlineStack>
            <Text variant="bodyMd" as="p">
              Create, manage, and track your marketing links. Monitor performance and optimize your campaigns.
            </Text>
          </BlockStack>
        </Card>

        {/* Stats Overview */}
        <InlineGrid columns={{ xs: 2, sm: 4 }} gap="300">
          <Card>
            <BlockStack gap="200">
              <Text variant="headingLg" as="h3">{stats.totalLinks}</Text>
              <Text variant="bodyMd" as="p" tone="subdued">Total Links</Text>
            </BlockStack>
          </Card>
          <Card>
            <BlockStack gap="200">
              <Text variant="headingLg" as="h3">{stats.activeLinks}</Text>
              <Text variant="bodyMd" as="p" tone="subdued">Active Links</Text>
            </BlockStack>
          </Card>
          <Card>
            <BlockStack gap="200">
              <Text variant="headingLg" as="h3">{stats.totalScans}</Text>
              <Text variant="bodyMd" as="p" tone="subdued">Total Scans</Text>
            </BlockStack>
          </Card>
          <Card>
            <BlockStack gap="200">
              <Text variant="headingLg" as="h3">{stats.totalOrders}</Text>
              <Text variant="bodyMd" as="p" tone="subdued">Total Orders</Text>
            </BlockStack>
          </Card>
        </InlineGrid>

        {/* Links Table */}
        <Card>
          <BlockStack gap="300">
            <InlineStack gap="200" align="center">
              <Icon source={LinkIcon} />
              <Text variant="headingMd" as="h2">All Links</Text>
            </InlineStack>
            <Divider />
            <DataTable
              columnContentTypes={['text', 'text', 'text', 'text', 'numeric', 'numeric', 'text']}
              headings={headings}
              rows={linksRows}
              footerContent={
                <InlineStack align="space-between">
                  <Text variant="bodySm" as="p" tone="subdued">
                    Showing {links.length} links
                  </Text>
                  <Text variant="bodySm" as="p" tone="subdued">
                    Real-time tracking enabled
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

export default function LinksPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LinksPageContent />
    </Suspense>
  )
}

export const dynamic = 'force-dynamic'
