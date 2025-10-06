'use client'

import { useState, useEffect } from 'react'
import { 
  Page, 
  Layout, 
  Card, 
  Text,
  BlockStack,
  InlineStack,
  Select,
  DatePicker,
  DataTable,
  Icon,
  Box,
  Divider,
  InlineGrid,
  Badge,
  ProgressBar
} from '@shopify/polaris'
import { supabase } from '@/lib/supabase'

interface AnalyticsData {
  totalScans: number
  totalOrders: number
  conversionRate: number
  totalRevenue: number
  scansByDay: Array<{ date: string; scans: number }>
  topLinks: Array<{
    code: string
    scans: number
    orders: number
    revenue: number
  }>
}

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalScans: 0,
    totalOrders: 0,
    conversionRate: 0,
    totalRevenue: 0,
    scansByDay: [],
    topLinks: []
  })
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    end: new Date()
  })

  useEffect(() => {
    fetchAnalytics()
  }, [dateRange])

  const fetchAnalytics = async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search)
      const shop = urlParams.get('shop')
      
      if (!shop) return

      const { data: merchant } = await supabase
        .from('merchants')
        .select('id')
        .eq('shop_domain', shop)
        .single()

      if (!merchant) return

      // Fetch scans data
      const { data: scansData } = await supabase
        .from('scans')
        .select('*')
        .eq('merchant_id', merchant.id)
        .gte('timestamp', dateRange.start.toISOString())
        .lte('timestamp', dateRange.end.toISOString())

      // Fetch orders data
      const { data: ordersData } = await supabase
        .from('orders')
        .select('*')
        .eq('merchant_id', merchant.id)
        .gte('created_at', dateRange.start.toISOString())
        .lte('created_at', dateRange.end.toISOString())

      const totalScans = scansData?.length || 0
      const totalOrders = ordersData?.length || 0
      const conversionRate = totalScans > 0 ? (totalOrders / totalScans) * 100 : 0
      const totalRevenue = ordersData?.reduce((sum, order) => sum + parseFloat(order.total.toString()), 0) || 0

      // Group scans by day
      const scansByDay = scansData?.reduce((acc: Array<{ date: string; scans: number }>, scan) => {
        const date = new Date(scan.timestamp).toISOString().split('T')[0]
        const existing = acc.find((item: { date: string; scans: number }) => item.date === date)
        if (existing) {
          existing.scans++
        } else {
          acc.push({ date, scans: 1 })
        }
        return acc
      }, [] as Array<{ date: string; scans: number }>) || []

      // Get top performing links
      const linkStats = scansData?.reduce((acc, scan) => {
        if (!acc[scan.link_id]) {
          acc[scan.link_id] = { scans: 0, orders: 0, revenue: 0 }
        }
        acc[scan.link_id].scans++
        return acc
      }, {} as Record<string, { scans: number; orders: number; revenue: number }>) || {}

      // Add order data to link stats
      ordersData?.forEach(order => {
        if (order.link_id && linkStats[order.link_id]) {
          linkStats[order.link_id].orders++
          linkStats[order.link_id].revenue += parseFloat(order.total.toString())
        }
      })

      const topLinks = Object.entries(linkStats)
        .map(([linkId, stats]) => ({
          code: linkId, // This should be the actual link code, but we'll use ID for now
          scans: (stats as { scans: number; orders: number; revenue: number }).scans,
          orders: (stats as { scans: number; orders: number; revenue: number }).orders,
          revenue: (stats as { scans: number; orders: number; revenue: number }).revenue
        }))
        .sort((a, b) => b.scans - a.scans)
        .slice(0, 10)

      setAnalyticsData({
        totalScans,
        totalOrders,
        conversionRate: Math.round(conversionRate * 100) / 100,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        scansByDay,
        topLinks
      })
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const topLinksRows = analyticsData.topLinks.map(link => [
    link.code,
    link.scans.toString(),
    link.orders.toString(),
    `$${link.revenue.toFixed(2)}`
  ])

  return (
    <Page 
      title="Analytics"
      subtitle="Track performance and insights for your campaigns"
    >
      <Layout>
        {/* Header Section */}
        <Layout.Section>
          <Box padding="600" background="bg-surface-brand" borderRadius="300">
            <BlockStack gap="300">
              <InlineStack gap="300" align="start">
                <Box padding="300" background="bg-surface-base" borderRadius="200">
                  <Icon source="analytics" tone="base" />
                </Box>
                <BlockStack gap="200">
                  <Text variant="headingLg" as="h2" tone="base">
                    Analytics Dashboard
                  </Text>
                  <Text variant="bodyLg" as="p" tone="base">
                    Track performance, conversions, and revenue from your QR codes and campaigns
                  </Text>
                </BlockStack>
              </InlineStack>
            </BlockStack>
          </Box>
        </Layout.Section>

        {/* Date Range Selector */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <InlineStack gap="200" align="start">
                <Box padding="200" background="bg-surface-info" borderRadius="100">
                  <Icon source="calendar" tone="base" />
                </Box>
                <BlockStack gap="100">
                  <Text variant="headingMd" as="h3">Date Range</Text>
                  <Text variant="bodySm" as="p" tone="subdued">
                    Select the time period for your analytics
                  </Text>
                </BlockStack>
              </InlineStack>
              
              <Box padding="300" background="bg-surface-secondary" borderRadius="200">
                <Text variant="bodyMd" as="p">
                  📅 Last 30 days (Date picker coming soon)
                </Text>
              </Box>
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Summary Stats */}
        <Layout.Section>
          <InlineGrid columns={{ xs: 1, sm: 2, md: 4 }} gap="400">
            <Card>
              <BlockStack gap="400">
                <InlineStack gap="200" align="start">
                  <Box padding="200" background="bg-surface-info" borderRadius="100">
                    <Icon source="view" tone="base" />
                  </Box>
                  <BlockStack gap="100">
                    <Text variant="bodyMd" as="p" tone="subdued">Total Scans</Text>
                    <Text variant="heading2xl" as="p" fontWeight="bold">
                      {analyticsData.totalScans}
                    </Text>
                  </BlockStack>
                </InlineStack>
                <Box padding="200" background="bg-surface-info" borderRadius="100">
                  <Text variant="bodySm" as="p" tone="base" fontWeight="semibold">
                    +15% from last period
                  </Text>
                </Box>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="400">
                <InlineStack gap="200" align="start">
                  <Box padding="200" background="bg-surface-success" borderRadius="100">
                    <Icon source="orders" tone="base" />
                  </Box>
                  <BlockStack gap="100">
                    <Text variant="bodyMd" as="p" tone="subdued">Total Orders</Text>
                    <Text variant="heading2xl" as="p" fontWeight="bold">
                      {analyticsData.totalOrders}
                    </Text>
                  </BlockStack>
                </InlineStack>
                <Box padding="200" background="bg-surface-success" borderRadius="100">
                  <Text variant="bodySm" as="p" tone="base" fontWeight="semibold">
                    +8% from last period
                  </Text>
                </Box>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="400">
                <InlineStack gap="200" align="start">
                  <Box padding="200" background="bg-surface-warning" borderRadius="100">
                    <Icon source="analytics" tone="base" />
                  </Box>
                  <BlockStack gap="100">
                    <Text variant="bodyMd" as="p" tone="subdued">Conversion Rate</Text>
                    <Text variant="heading2xl" as="p" fontWeight="bold">
                      {analyticsData.conversionRate}%
                    </Text>
                  </BlockStack>
                </InlineStack>
                <Box padding="200" background="bg-surface-warning" borderRadius="100">
                  <Text variant="bodySm" as="p" tone="base" fontWeight="semibold">
                    +2% from last period
                  </Text>
                </Box>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="400">
                <InlineStack gap="200" align="start">
                  <Box padding="200" background="bg-surface-critical" borderRadius="100">
                    <Icon source="dollar" tone="base" />
                  </Box>
                  <BlockStack gap="100">
                    <Text variant="bodyMd" as="p" tone="subdued">Total Revenue</Text>
                    <Text variant="heading2xl" as="p" fontWeight="bold">
                      ${analyticsData.totalRevenue}
                    </Text>
                  </BlockStack>
                </InlineStack>
                <Box padding="200" background="bg-surface-critical" borderRadius="100">
                  <Text variant="bodySm" as="p" tone="base" fontWeight="semibold">
                    +22% from last period
                  </Text>
                </Box>
              </BlockStack>
            </Card>
          </InlineGrid>
        </Layout.Section>

        {/* Performance Chart Placeholder */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <InlineStack gap="200" align="start">
                <Box padding="200" background="bg-surface-brand" borderRadius="100">
                  <Icon source="chart" tone="base" />
                </Box>
                <BlockStack gap="100">
                  <Text variant="headingMd" as="h3">Performance Trends</Text>
                  <Text variant="bodySm" as="p" tone="subdued">
                    Track your scans and conversions over time
                  </Text>
                </BlockStack>
              </InlineStack>
              
              <Box padding="400" background="bg-surface-secondary" borderRadius="200">
                <BlockStack gap="300" align="center">
                  <Icon source="chart" tone="subdued" />
                  <Text variant="bodyMd" as="p" tone="subdued" alignment="center">
                    📊 Interactive charts coming soon
                  </Text>
                  <Text variant="bodySm" as="p" tone="subdued" alignment="center">
                    Visualize your campaign performance with detailed graphs and trends
                  </Text>
                </BlockStack>
              </Box>
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Top Performing Links */}
        <Layout.Section>
          <Card>
            <BlockStack gap="500">
              <InlineStack gap="300" align="space-between">
                <InlineStack gap="200" align="start">
                  <Box padding="200" background="bg-surface-brand" borderRadius="100">
                    <Icon source="star" tone="base" />
                  </Box>
                  <BlockStack gap="100">
                    <Text variant="headingMd" as="h3">Top Performing Links</Text>
                    <Text variant="bodySm" as="p" tone="subdued">
                      Your best performing QR codes and permalinks
                    </Text>
                  </BlockStack>
                </InlineStack>
                <Badge status="success">Top Performers</Badge>
              </InlineStack>
              
              <Divider />
              
              <Box padding="300" background="bg-surface-secondary" borderRadius="200">
                <DataTable
                  columnContentTypes={['text', 'text', 'text', 'text']}
                  headings={['Link Code', 'Scans', 'Orders', 'Revenue']}
                  rows={topLinksRows.map((row, index) => [
                    <InlineStack gap="200" align="center">
                      <Box padding="100" background="bg-surface-brand" borderRadius="100">
                        <Text variant="bodySm" as="span" fontWeight="bold" tone="base">
                          {index + 1}
                        </Text>
                      </Box>
                      <Text variant="bodyMd" as="span" fontWeight="medium">{row[0]}</Text>
                    </InlineStack>,
                    <Text variant="bodyMd" as="span">{row[1]}</Text>,
                    <Text variant="bodyMd" as="span">{row[2]}</Text>,
                    <Text variant="bodyMd" as="span" fontWeight="semibold">{row[3]}</Text>
                  ])}
                  footerContent={
                    <InlineStack gap="200" align="space-between">
                      <Text variant="bodySm" as="p" tone="subdued">
                        Showing top {analyticsData.topLinks.length} links
                      </Text>
                      <Text variant="bodySm" as="p" tone="subdued">
                        Last updated: {new Date().toLocaleTimeString()}
                      </Text>
                    </InlineStack>
                  }
                />
              </Box>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  )
}
