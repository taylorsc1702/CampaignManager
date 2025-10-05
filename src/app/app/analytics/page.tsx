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
  DataTable
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
    <Page title="Analytics">
      <Layout>
        {/* Date Range Selector */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h3">Date Range</Text>
              <Text variant="bodyMd" as="p">
                Last 30 days (Date picker coming soon)
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Summary Stats */}
        <Layout.Section>
          <InlineStack gap="400">
            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd" as="h3">Total Scans</Text>
                <Text variant="heading2xl" as="p">
                  {analyticsData.totalScans}
                </Text>
              </BlockStack>
            </Card>
            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd" as="h3">Total Orders</Text>
                <Text variant="heading2xl" as="p" tone="success">
                  {analyticsData.totalOrders}
                </Text>
              </BlockStack>
            </Card>
            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd" as="h3">Conversion Rate</Text>
                <Text variant="heading2xl" as="p">
                  {analyticsData.conversionRate}%
                </Text>
              </BlockStack>
            </Card>
            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd" as="h3">Total Revenue</Text>
                <Text variant="heading2xl" as="p" tone="success">
                  ${analyticsData.totalRevenue}
                </Text>
              </BlockStack>
            </Card>
          </InlineStack>
        </Layout.Section>

        {/* Top Performing Links */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h3">Top Performing Links</Text>
              <DataTable
                columnContentTypes={['text', 'text', 'text', 'text']}
                headings={['Link Code', 'Scans', 'Orders', 'Revenue']}
                rows={topLinksRows}
                footerContent={`Showing top ${analyticsData.topLinks.length} links`}
              />
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  )
}
