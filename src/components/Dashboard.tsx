'use client'

import { useState, useEffect } from 'react'
import { 
  Layout, 
  Card, 
  Text, 
  Badge, 
  DataTable,
  Button,
  BlockStack,
  InlineStack
} from '@shopify/polaris'
import { supabase } from '@/lib/supabase'

interface Merchant {
  id: string
  shop_domain: string
  plan: string
}

interface Link {
  id: string
  code: string
  product_id: string
  variant_id: string
  quantity: number
  active: boolean
  created_at: string
  scans_count?: number
  orders_count?: number
}

interface DashboardStats {
  totalLinks: number
  totalScans: number
  totalOrders: number
  conversionRate: number
  totalRevenue: number
}

export default function Dashboard({ merchant }: { merchant: Merchant }) {
  const [links, setLinks] = useState<Link[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    totalLinks: 0,
    totalScans: 0,
    totalOrders: 0,
    conversionRate: 0,
    totalRevenue: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [merchant.id])

  const fetchDashboardData = async () => {
    try {
      // Fetch links with scan and order counts
      const { data: linksData, error: linksError } = await supabase
        .from('links')
        .select(`
          id,
          code,
          product_id,
          variant_id,
          quantity,
          active,
          created_at
        `)
        .eq('merchant_id', merchant.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (linksError) throw linksError

      // Fetch stats
      const [
        { count: totalLinks },
        { count: totalScans },
        { count: totalOrders },
        { data: revenueData }
      ] = await Promise.all([
        supabase.from('links').select('*', { count: 'exact', head: true }).eq('merchant_id', merchant.id),
        supabase.from('scans').select('*', { count: 'exact', head: true }).eq('merchant_id', merchant.id),
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('merchant_id', merchant.id),
        supabase.from('orders').select('total').eq('merchant_id', merchant.id)
      ])

      const totalRevenue = revenueData?.reduce((sum, order) => sum + parseFloat(order.total.toString()), 0) || 0
      const conversionRate = (totalScans && totalScans > 0 && totalOrders) ? (totalOrders / totalScans) * 100 : 0

      setLinks(linksData || [])
      setStats({
        totalLinks: totalLinks || 0,
        totalScans: totalScans || 0,
        totalOrders: totalOrders || 0,
        conversionRate: Math.round(conversionRate * 100) / 100,
        totalRevenue: Math.round(totalRevenue * 100) / 100
      })
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const linksRows = links.map(link => [
    link.code,
    link.product_id,
    link.variant_id,
    link.quantity.toString(),
    <Badge key={`badge-${link.id}`} tone={link.active ? 'success' : 'critical'}>
      {link.active ? 'Active' : 'Inactive'}
    </Badge>,
    new Date(link.created_at).toLocaleDateString()
  ])

  return (
    <Layout>
      {/* Stats Cards */}
      <Layout.Section>
        <InlineStack gap="400">
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h3">Total Links</Text>
              <Text variant="heading2xl" as="p" tone="success">
                {stats.totalLinks}
              </Text>
            </BlockStack>
          </Card>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h3">Total Scans</Text>
              <Text variant="heading2xl" as="p">
                {stats.totalScans}
              </Text>
            </BlockStack>
          </Card>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h3">Orders</Text>
              <Text variant="heading2xl" as="p" tone="success">
                {stats.totalOrders}
              </Text>
            </BlockStack>
          </Card>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h3">Conversion Rate</Text>
              <Text variant="heading2xl" as="p">
                {stats.conversionRate}%
              </Text>
            </BlockStack>
          </Card>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h3">Revenue</Text>
              <Text variant="heading2xl" as="p" tone="success">
                ${stats.totalRevenue}
              </Text>
            </BlockStack>
          </Card>
        </InlineStack>
      </Layout.Section>

      {/* Recent Links */}
      <Layout.Section>
        <Card>
          <BlockStack gap="400">
            <InlineStack align="space-between">
              <Text variant="headingMd" as="h3">Recent Links</Text>
              <Button>View All</Button>
            </InlineStack>
            <DataTable
              columnContentTypes={['text', 'text', 'text', 'text', 'text', 'text']}
              headings={['Code', 'Product ID', 'Variant ID', 'Quantity', 'Status', 'Created']}
              rows={linksRows}
              footerContent={`Showing ${links.length} of ${stats.totalLinks} links`}
            />
            </BlockStack>
        </Card>
      </Layout.Section>
    </Layout>
  )
}
