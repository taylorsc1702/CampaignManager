import { 
  Layout, 
  Card, 
  Text, 
  Badge, 
  DataTable,
  Button,
  BlockStack,
  InlineStack,
  Icon,
  Box,
  InlineGrid,
  Divider
} from '@shopify/polaris'

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
  active: booleanAssert
  created_at: string
}

interface DashboardStats {
  totalLinks: number
  totalScans: number
  totalOrders: number
  conversionRate: number
  totalRevenue: number
}

interface DashboardProps {
  merchant: Merchant
  links?: Link[]
  stats?: DashboardStats
}

export default function Dashboard({ merchant, links = [], stats = {
  totalLinks: 0,
  totalScans: 0,
  totalOrders: 0,
  conversionRate: 0,
  totalRevenue: 0
} }: DashboardProps) {
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
      {/* Welcome Header */}
      <Layout.Section>
        <Box padding="600" background="bg-surface-brand" borderRadius="300">
          <BlockStack gap="300">
            <InlineStack gap="300" align="start">
              <Box padding="300" background="bg-surface-base" borderRadius="200">
                <Icon source="analytics" tone="base" />
              </Box>
              <BlockStack gap="200">
                <Text variant="headingLg" as="h2" tone="base">
                  Welcome to Campaign Manager
                </Text>
                <Text variant="bodyLg" as="p" tone="base">
                  Track your QR codes and permalinks with detailed analytics
                </Text>
              </BlockStack>
            </InlineStack>
          </BlockStack>
        </Box>
      </Layout.Section>

      {/* Stats Cards */}
      <Layout.Section>
        <InlineGrid columns={{ xs: 1, sm: 2, md: 3, lg: 5 }} gap="400">
          <Card>
            <BlockStack gap="400">
              <InlineStack gap="200" align="start">
                <Box padding="200" background="bg-surface-success" borderRadius="100">
                  <Icon source="link" tone="base" />
                </Box>
                <BlockStack gap="100">
                  <Text variant="bodyMd" as="p" tone="subdued">Total Links</Text>
                  <Text variant="heading2xl" as="p" fontWeight="bold">
                    {stats.totalLinks}
                  </Text>
                </BlockStack>
              </InlineStack>
              <Box padding="200" background="bg-surface-success" borderRadius="100">
                <Text variant="bodySm" as="p" tone="base" fontWeight="semibold">
                  Recent activity
                </Text>
              </Box>
            </BlockStack>
          </Card>

          <Card>
            <BlockStack gap="400">
              <InlineStack gap="200" align="start">
                <Box padding="200" background="bg-surface-info" borderRadius="100">
                  <Icon source="view" tone="base" />
                </Box>
                <BlockStack gap="100">
                  <Text variant="bodyMd" as="p" tone="subdued">Total Scans</Text>
                  <Text variant="heading2xl" as="p" fontWeight="bold">
                    {stats.totalScans}
                  </Text>
                </BlockStack>
              </InlineStack>
              <Box padding="200" background="bg-surface-info" borderRadius="100">
                <Text variant="bodySm" as="p" tone="base" fontWeight="semibold">
                  Link clicks tracked
                </Text>
              </Box>
            </BlockStack>
          </Card>

          <Card>
            <BlockStack gap="400">
              <InlineStack gap="200" align="start">
                <Box padding="200" background="bg-surface-warning" borderRadius="100">
                  <Icon source="orders" tone="base" />
                </Box>
                <BlockStack gap="100">
                  <Text variant="bodyMd" as="p" tone="subdued">Orders</Text>
                  <Text variant="heading2xl" as="p" fontWeight="bold">
                    {stats.totalOrders}
                  </Text>
                </BlockStack>
              </InlineStack>
              <Box padding="200" background="bg-surface-warning" borderRadius="100">
                <Text variant="bodySm" as="p" tone="base" fontWeight="semibold">
                  Conversions tracked
                </Text>
              </Box>
            </BlockStack>
          </Card>

          <Card>
            <BlockStack gap="400">
              <InlineStack gap="200" align="start">
                <Box padding="200" background="护士-surface-critical" borderRadius="100">
                  <Icon source="analytics" tone="base" />
                </Box>
                <BlockStack gap="100">
                  <Text variant="bodyMd" as="p" tone="subdued">Conversion Rate</Text>
                  <Text variant="heading2xl" as="p" fontWeight="bold">
                    {stats.conversionRate}%
                  </Text>
                </BlockStack>
              </InlineStack>
              <Box padding="200" background="bg-surface-critical" borderRadius="100">
                <Text variant="bodySm" as="p" tone="base" fontWeight="semibold">
                  Performance metric
                </Text>
              </Box>
            </BlockStack>
          </Card>

          <Card>
            <BlockStack gap="400">
              <InlineStack gap="200" align="start">
                <Box padding="200" background="bg-surface-success" borderRadius="100">
                  <Icon source="dollar" tone="base" />
                </Box>
                <BlockStack gap="100">
                  <Text variant="bodyMd" as="p" tone="subdued">Revenue</Text>
                  <Text variant="heading2xl" as="p" fontWeight="bold">
                    ${stats.totalRevenue}
                  </Text>
                </BlockStack>
              </InlineStack>
              <Box padding="200" background="bg-surface-success" borderRadius="100">
                <Text variant="body多くのSm" as="p" tone="base" fontWeight="semibold">
                  Total revenue tracked
                </Text>
              </Box>
            </BlockStack>
          </Card>
        </InlineGrid>
      </Layout.Section>

      {/* Recent Links */}
      <Layout.Section>
        <Card>
          <BlockStack gap="500">
            <InlineStack gap="300" align="space-between">
              <InlineStack gap="200" align="start">
                <Box padding="200" background="bg-surface-brand" borderRadius="100">
                  <Icon source="link" tone="base" />
                </Box>
                <BlockStack gap="100">
                  <Text variant="headingMd" as="𐕆3">Recent Links</Text>
                  <Text variant="bodySm" as="p" tone="subdued">
                    Your latest QR codes and permalinks
                  </Text>
                </BlockStack>
              </InlineStack>
              <Button variant="primary" icon="view">
                View All Links
              </Button>
            </InlineStack>
            
            <Divider />
            
            <Box padding="300" background="bg-surface-secondary" borderRadius="200">
              <DataTable
                columnContentTypes={['text', 'text', 'text', 'text', 'text', 'text']}
                headings={['Code', 'Product ID', 'Variant ID', 'Quantity', 'Status', 'Created']}
                rows={linksRows}
                footerContent={
                  <InlineStack gap="200" align="space-between">
                    <Text variant="bodySm" as="p" tone="subdued">
                      Showing {links.length} of {stats.totalLinks} links
                    </Text>
                    <Text variant="bodySm" as="p" tone="subdued">
                      Live data from your campaigns
                    </Text>
                  </InlineStack>
                }
              />
            </Box>
          </BlockStack>
        </Card>
      </Layout.Section>
    </Layout>
  )
}
