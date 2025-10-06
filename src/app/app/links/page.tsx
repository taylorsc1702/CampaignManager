'use client'

import { useState, useEffect } from 'react'
import { 
  Page, 
  Layout, 
  Card, 
  DataTable,
  Button,
  BlockStack,
  InlineStack,
  Text,
  Badge,
  ButtonGroup,
  Modal,
  TextContainer,
  Icon,
  Box,
  Divider,
  InlineGrid
} from '@shopify/polaris'
import { EditIcon, DeleteIcon, ViewIcon } from '@shopify/polaris-icons'
import { supabase } from '@/lib/supabase'
import { buildShortUrl, generateQRCode } from '@/lib/qrcode'

interface Link {
  id: string
  code: string
  product_id: string
  product_handle: string
  variant_id: string
  quantity: number
  discount_code?: string
  permalink_type: 'product' | 'cart' | 'custom'
  active: boolean
  created_at: string
  scans_count?: number
  orders_count?: number
}

export default function LinksPage() {
  const [links, setLinks] = useState<Link[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLink, setSelectedLink] = useState<Link | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [generatingQR, setGeneratingQR] = useState<string | null>(null)
  const [downloadingAll, setDownloadingAll] = useState(false)

  useEffect(() => {
    fetchLinks()
  }, [])

  const fetchLinks = async () => {
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

      const { data, error } = await supabase
        .from('links')
        .select('*')
        .eq('merchant_id', merchant.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setLinks(data || [])
    } catch (error) {
      console.error('Failed to fetch links:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleLinkStatus = async (linkId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('links')
        .update({ active: !currentStatus })
        .eq('id', linkId)

      if (error) throw error

      setLinks(prev => prev.map(link => 
        link.id === linkId ? { ...link, active: !currentStatus } : link
      ))
    } catch (error) {
      console.error('Failed to update link status:', error)
    }
  }

  const deleteLink = async (linkId: string) => {
    try {
      const { error } = await supabase
        .from('links')
        .delete()
        .eq('id', linkId)

      if (error) throw error

      setLinks(prev => prev.filter(link => link.id !== linkId))
      setShowModal(false)
      setSelectedLink(null)
    } catch (error) {
      console.error('Failed to delete link:', error)
    }
  }

  const generateQRCodeForLink = async (link: Link) => {
    try {
      setGeneratingQR(link.id)
      const shortUrl = buildShortUrl(link.code)
      const qrCode = await generateQRCode(shortUrl)
      
      // Create download link
      const downloadLink = document.createElement('a')
      downloadLink.href = qrCode
      downloadLink.download = `qr-${link.code}.png`
      downloadLink.click()
    } catch (error) {
      console.error('Failed to generate QR code:', error)
    } finally {
      setGeneratingQR(null)
    }
  }

  const downloadAllQRCodes = async () => {
    try {
      setDownloadingAll(true)
      
      for (const link of links) {
        try {
          const shortUrl = buildShortUrl(link.code)
          const qrCode = await generateQRCode(shortUrl)
          
          // Create download link
          const downloadLink = document.createElement('a')
          downloadLink.href = qrCode
          downloadLink.download = `qr-${link.code}.png`
          downloadLink.click()
          
          // Small delay between downloads to avoid overwhelming the browser
          await new Promise(resolve => setTimeout(resolve, 200))
        } catch (error) {
          console.error(`Failed to generate QR code for ${link.code}:`, error)
        }
      }
    } catch (error) {
      console.error('Failed to download all QR codes:', error)
    } finally {
      setDownloadingAll(false)
    }
  }

  const linksRows = links.map(link => [
    link.code,
    link.product_handle,
    link.variant_id,
    <Badge tone={
      link.permalink_type === 'product' ? 'success' : 
      link.permalink_type === 'cart' ? 'info' : 
      'warning'
    }>
      {link.permalink_type === 'product' ? 'Product' : 
       link.permalink_type === 'cart' ? 'Cart' : 
       'Custom'}
    </Badge>,
    link.quantity.toString(),
    link.discount_code || '-',
    <Badge tone={link.active ? 'success' : 'critical'}>
      {link.active ? 'Active' : 'Inactive'}
    </Badge>,
    buildShortUrl(link.code),
    new Date(link.created_at).toLocaleDateString(),
    <ButtonGroup>
      <Button 
        icon={ViewIcon} 
        size="slim"
        onClick={() => {
          setSelectedLink(link)
          setShowModal(true)
        }}
      />
      <Button 
        size="slim"
        onClick={() => generateQRCodeForLink(link)}
        loading={generatingQR === link.id}
      >
        QR
      </Button>
      <Button 
        icon={EditIcon} 
        size="slim"
        onClick={() => toggleLinkStatus(link.id, link.active)}
      />
      <Button 
        icon={DeleteIcon} 
        size="slim" 
        onClick={() => {
          setSelectedLink(link)
          setShowModal(true)
        }}
      />
    </ButtonGroup>
  ])

  return (
    <Page 
      title="Links"
      subtitle="Manage your QR codes and permalinks"
      primaryAction={{
        content: 'Download All QR Codes',
        onAction: downloadAllQRCodes,
        loading: downloadingAll,
        disabled: links.length === 0,
        icon: 'download'
      }}
      secondaryActions={[
        {
          content: 'Create New Link',
          onAction: () => {},
          icon: 'add'
        }
      ]}
    >
      <Layout>
        {/* Header Section */}
        <Layout.Section>
          <Box padding="600" background="bg-surface-brand" borderRadius="300">
            <BlockStack gap="300">
              <InlineStack gap="300" align="start">
                <Box padding="300" background="bg-surface-base" borderRadius="200">
                  <Icon source="link" tone="base" />
                </Box>
                <BlockStack gap="200">
                  <Text variant="headingLg" as="h2" tone="base">
                    Links Management
                  </Text>
                  <Text variant="bodyLg" as="p" tone="base">
                    Create, manage, and track your QR codes and permalinks
                  </Text>
                </BlockStack>
              </InlineStack>
            </BlockStack>
          </Box>
        </Layout.Section>

        {/* Stats Cards */}
        <Layout.Section>
          <InlineGrid columns={{ xs: 1, sm: 2, md: 4 }} gap="400">
            <Card>
              <BlockStack gap="300">
                <InlineStack gap="200" align="start">
                  <Box padding="200" background="bg-surface-success" borderRadius="100">
                    <Icon source="link" tone="base" />
                  </Box>
                  <BlockStack gap="100">
                    <Text variant="bodyMd" as="p" tone="subdued">Total Links</Text>
                    <Text variant="headingLg" as="p" fontWeight="bold">
                      {links.length}
                    </Text>
                  </BlockStack>
                </InlineStack>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="300">
                <InlineStack gap="200" align="start">
                  <Box padding="200" background="bg-surface-info" borderRadius="100">
                    <Icon source="view" tone="base" />
                  </Box>
                  <BlockStack gap="100">
                    <Text variant="bodyMd" as="p" tone="subdued">Active Links</Text>
                    <Text variant="headingLg" as="p" fontWeight="bold">
                      {links.filter(l => l.active).length}
                    </Text>
                  </BlockStack>
                </InlineStack>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="300">
                <InlineStack gap="200" align="start">
                  <Box padding="200" background="bg-surface-warning" borderRadius="100">
                    <Icon source="analytics" tone="base" />
                  </Box>
                  <BlockStack gap="100">
                    <Text variant="bodyMd" as="p" tone="subdued">Total Scans</Text>
                    <Text variant="headingLg" as="p" fontWeight="bold">
                      {links.reduce((sum, link) => sum + (link.scans_count || 0), 0)}
                    </Text>
                  </BlockStack>
                </InlineStack>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="300">
                <InlineStack gap="200" align="start">
                  <Box padding="200" background="bg-surface-critical" borderRadius="100">
                    <Icon source="orders" tone="base" />
                  </Box>
                  <BlockStack gap="100">
                    <Text variant="bodyMd" as="p" tone="subdued">Total Orders</Text>
                    <Text variant="headingLg" as="p" fontWeight="bold">
                      {links.reduce((sum, link) => sum + (link.orders_count || 0), 0)}
                    </Text>
                  </BlockStack>
                </InlineStack>
              </BlockStack>
            </Card>
          </InlineGrid>
        </Layout.Section>

        {/* Links Table */}
        <Layout.Section>
          <Card>
            <BlockStack gap="500">
              <InlineStack gap="300" align="space-between">
                <InlineStack gap="200" align="start">
                  <Box padding="200" background="bg-surface-brand" borderRadius="100">
                    <Icon source="list" tone="base" />
                  </Box>
                  <BlockStack gap="100">
                    <Text variant="headingMd" as="h3">All Links</Text>
                    <Text variant="bodySm" as="p" tone="subdued">
                      Manage and track your QR codes and permalinks
                    </Text>
                  </BlockStack>
                </InlineStack>
                <Button variant="primary" icon="add">
                  Create New Link
                </Button>
              </InlineStack>
              
              <Divider />
              
              <Box padding="300" background="bg-surface-secondary" borderRadius="200">
                <DataTable
                  columnContentTypes={['text', 'text', 'text', 'text', 'text', 'text', 'text', 'text', 'text', 'text']}
                  headings={['Code', 'Product Handle', 'Variant ID', 'Type', 'Quantity', 'Discount', 'Status', 'URL', 'Created', 'Actions']}
                  rows={linksRows}
                  footerContent={
                    <InlineStack gap="200" align="space-between">
                      <Text variant="bodySm" as="p" tone="subdued">
                        Showing {links.length} links
                      </Text>
                      <Text variant="bodySm" as="p" tone="subdued">
                        Real-time tracking enabled
                      </Text>
                    </InlineStack>
                  }
                />
              </Box>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>

      <Modal
        open={showModal}
        onClose={() => {
          setShowModal(false)
          setSelectedLink(null)
        }}
        title="Link Details"
        primaryAction={{
          content: 'Delete Link',
          destructive: true,
          onAction: () => selectedLink && deleteLink(selectedLink.id)
        }}
        secondaryActions={[
          {
            content: 'Cancel',
            onAction: () => {
              setShowModal(false)
              setSelectedLink(null)
            }
          }
        ]}
      >
        {selectedLink && (
          <Modal.Section>
            <BlockStack gap="400">
              <TextContainer>
                <Text variant="headingMd" as="h3">Link Information</Text>
                <p><strong>Code:</strong> {selectedLink.code}</p>
                <p><strong>Product ID:</strong> {selectedLink.product_id}</p>
                <p><strong>Variant ID:</strong> {selectedLink.variant_id}</p>
                <p><strong>Quantity:</strong> {selectedLink.quantity}</p>
                <p><strong>Discount Code:</strong> {selectedLink.discount_code || 'None'}</p>
                <p><strong>Status:</strong> {selectedLink.active ? 'Active' : 'Inactive'}</p>
                <p><strong>URL:</strong> {buildShortUrl(selectedLink.code)}</p>
                <p><strong>Created:</strong> {new Date(selectedLink.created_at).toLocaleString()}</p>
              </TextContainer>
            </BlockStack>
          </Modal.Section>
        )}
      </Modal>
    </Page>
  )
}
