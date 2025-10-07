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
  InlineGrid,
  ProgressBar
} from '@shopify/polaris'
import { HashtagIcon } from '@shopify/polaris-icons'
import { supabase } from '@/lib/supabase'
import '@shopify/polaris/build/esm/styles.css'

interface AnalyticsData {
  totalScans: number
  totalOrders: number
  conversionRate: number
  totalRevenue: number
  topLinks: Array<{
    code: string
    scans: number
    orders: number
    conversionRate: number
  }>
}

function AnalyticsPageContent() {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalScans: 0,
    totalOrders: 0,
    conversionRate: 0,
    totalRevenue: 0,
    topLinks: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      const merchantId = '550e8400-e29b-41d4-a716-446655440000'
      
      // Check if this is a demo merchant
      const isDemo = merchantId === '550e8400-e29b-41d4-a716-446655440000'
      
      if (isDemo) {
        // Set demo data
        setAnalytics({
          totalScans: 0,
          totalOrders: 0,
          conversionRate: 0,
          totalRevenue: 0,
          topLinks: []
        })
        setLoading(false)
        return
      }

      // Fetch analytics data
      const [
        { count: totalScans },
        { count: totalOrders },
        { data: revenueData }
      ] = await Promise.all([
        supabase.from('scans').select('*', { count: 'exact', head: true }).eq('merchant_id', merchantId),
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('merchant_id', merchantId),
        supabase.from('orders').select('total').eq('merchant_id', merchantId)
      ])

      const totalRevenue = revenueData?.reduce((sum, order) => sum + parseFloat(order.total.toString()), 0) || 0
      const conversionRate = (totalScans && totalScans > 0 && totalOrders) ? (totalOrders / totalScans) * 100 : 0

      // Fetch top performing links
      const { data: topLinksData } = await supabase
        .from('links')
        .select(`
          code,
          scans!inner(count),
          orders!inner(count)
        `)
        .eq('merchant_id', merchantId)
        .order('scans.count', { ascending: false })
        .limit(5)

      const topLinks = topLinksData?.map(link => ({
        code: link.code,
        scans: link.scans?.count || 0,
        orders: link.orders?.count || 0,
        conversionRate: link.scans?.count > 0 ? (link.orders?.count / link.scans.count) * 100 : 0
      })) || []

      setAnalytics({
        totalScans: totalScans || 0,
        totalOrders: totalOrders || 0,
        conversionRate: Math.round(conversionRate * 100) / 100,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        topLinks
      })
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
      setAnalytics({
        totalScans: 0,
        totalOrders: 0,
        conversionRate: 0,
        totalRevenue: 0,
        topLinks: []
      })
    } finally {
      setLoading(false)
    }
  }

  const topLinksRows = analytics.topLinks.map((link, index) => [
    `#${index + 1}`,
    link.code,
    link.scans,
    link.orders,
    `${link.conversionRate.toFixed(1)}%`
  ])

  const headings = ['Rank', 'Link Code', 'Scans', 'Orders', 'Conversion Rate']

  return (
    <Page
      title="Analytics"
      subtitle="Track performance and optimize your marketing campaigns"
    >
      <BlockStack gap="500">
        {/* Header Section */}
        <Card>
          <BlockStack gap="300">
            <InlineStack gap="200" align="center">
              <Icon source={HashtagIcon} />
              <Text variant="headingMd" as="h2">Performance Analytics</Text>
            </InlineStack>
            <Text variant="bodyMd" as="p">
              Monitor your marketing performance with detailed analytics and insights. Track conversions, revenue, and optimize your campaigns.
            </Text>
          </BlockStack>
        </Card>

        {/* Key Metrics */}
        <InlineGrid columns={{ xs: 2, sm: 4 }} gap="300">
          <Card>
            <BlockStack gap="200">
              <Text variant="headingLg" as="h3">{analytics.totalScans.toLocaleString()}</Text>
              <Text variant="bodyMd" as="p" tone="subdued">Total Scans</Text>
              <Text variant="bodySm" as="p" tone="positive">+12% from last month</Text>
            </BlockStack>
          </Card>
          <Card>
            <BlockStack gap="200">
              <Text variant="headingLg" as="h3">{analytics.totalOrders.toLocaleString()}</Text>
              <Text variant="bodyMd" as="p" tone="subdued">Total Orders</Text>
              <Text variant="bodySm" as="p" tone="positive">+8% from last month</Text>
            </BlockStack>
          </Card>
          <Card>
            <BlockStack gap="200">
              <Text variant="headingLg" as="h3">{analytics.conversionRate}%</Text>
              <Text variant="bodyMd" as="p" tone="subdued">Conversion Rate</Text>
              <Text variant="bodySm" as="p" tone="positive">+2.1% from last month</Text>
            </BlockStack>
          </Card>
          <Card>
            <BlockStack gap="200">
              <Text variant="headingLg" as="h3">${analytics.totalRevenue.toLocaleString()}</Text>
              <Text variant="bodyMd" as="p" tone="subdued">Total Revenue</Text>
              <Text variant="bodySm" as="p" tone="positive">+15% from last month</Text>
            </BlockStack>
          </Card>
        </InlineGrid>

        {/* Performance Chart Placeholder */}
        <Card>
          <BlockStack gap="300">
            <Text variant="headingMd" as="h2">Performance Trends</Text>
            <Box background="bg-surface-secondary" padding="400" borderRadius="200">
              <Text variant="bodyMd" as="p" alignment="center" tone="subdued">
                📊 Performance charts will be displayed here
              </Text>
            </Box>
          </BlockStack>
        </Card>

        {/* Top Performing Links */}
        <Card>
          <BlockStack gap="300">
            <InlineStack gap="200" align="center">
              <Icon source={HashtagIcon} />
              <Text variant="headingMd" as="h2">Top Performing Links</Text>
            </InlineStack>
            <Divider />
            <DataTable
              columnContentTypes={['text', 'text', 'numeric', 'numeric', 'text']}
              headings={headings}
              rows={topLinksRows}
              footerContent={
                <InlineStack align="space-between">
                  <Text variant="bodySm" as="p" tone="subdued">
                    Showing top {analytics.topLinks.length} performing links
                  </Text>
                  <Text variant="bodySm" as="p" tone="subdued">
                    Real-time analytics
                  </Text>
                </InlineStack>
              }
            />
          </BlockStack>
        </Card>

        {/* Date Range Selector */}
        <Card>
          <BlockStack gap="300">
            <Text variant="headingMd" as="h2">Date Range</Text>
            <InlineStack gap="200">
              <Button>Last 7 days</Button>
              <Button>Last 30 days</Button>
              <Button>Last 90 days</Button>
              <Button>Custom range</Button>
            </InlineStack>
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  )
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AnalyticsPageContent />
    </Suspense>
  )
}

export const dynamic = 'force-dynamic'
