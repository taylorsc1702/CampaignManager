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
  FormLayout,
  TextField,
  Icon,
  Box,
  Divider,
  InlineGrid
} from '@shopify/polaris'
import { EditIcon, DeleteIcon, PlusIcon } from '@shopify/polaris-icons'
import { supabase } from '@/lib/supabase'

interface Campaign {
  id: string
  name: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_term?: string
  utm_content?: string
  created_at: string
  links_count?: number
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    utm_source: '',
    utm_medium: '',
    utm_campaign: '',
    utm_term: '',
    utm_content: ''
  })

  useEffect(() => {
    fetchCampaigns()
  }, [])

  const fetchCampaigns = async () => {
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
        .from('campaigns')
        .select(`
          *,
          links:links(count)
        `)
        .eq('merchant_id', merchant.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setCampaigns(data || [])
    } catch (error) {
      console.error('Failed to fetch campaigns:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveCampaign = async () => {
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

      if (isEditing && selectedCampaign) {
        const { error } = await supabase
          .from('campaigns')
          .update(formData)
          .eq('id', selectedCampaign.id)

        if (error) throw error

        setCampaigns(prev => prev.map(campaign => 
          campaign.id === selectedCampaign.id ? { ...campaign, ...formData } : campaign
        ))
      } else {
        const { data, error } = await supabase
          .from('campaigns')
          .insert({
            ...formData,
            merchant_id: merchant.id
          })
          .select()
          .single()

        if (error) throw error

        setCampaigns(prev => [data, ...prev])
      }

      setShowModal(false)
      setSelectedCampaign(null)
      setIsEditing(false)
      setFormData({
        name: '',
        utm_source: '',
        utm_medium: '',
        utm_campaign: '',
        utm_term: '',
        utm_content: ''
      })
    } catch (error) {
      console.error('Failed to save campaign:', error)
    }
  }

  const deleteCampaign = async (campaignId: string) => {
    try {
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', campaignId)

      if (error) throw error

      setCampaigns(prev => prev.filter(campaign => campaign.id !== campaignId))
      setShowModal(false)
      setSelectedCampaign(null)
    } catch (error) {
      console.error('Failed to delete campaign:', error)
    }
  }

  const openEditModal = (campaign: Campaign) => {
    setSelectedCampaign(campaign)
    setIsEditing(true)
    setFormData({
      name: campaign.name,
      utm_source: campaign.utm_source || '',
      utm_medium: campaign.utm_medium || '',
      utm_campaign: campaign.utm_campaign || '',
      utm_term: campaign.utm_term || '',
      utm_content: campaign.utm_content || ''
    })
    setShowModal(true)
  }

  const openCreateModal = () => {
    setSelectedCampaign(null)
    setIsEditing(false)
    setFormData({
      name: '',
      utm_source: '',
      utm_medium: '',
      utm_campaign: '',
      utm_term: '',
      utm_content: ''
    })
    setShowModal(true)
  }

  const campaignsRows = campaigns.map(campaign => [
    campaign.name,
    campaign.utm_source || '-',
    campaign.utm_medium || '-',
    campaign.utm_campaign || '-',
    campaign.utm_term || '-',
    campaign.utm_content || '-',
    new Date(campaign.created_at).toLocaleDateString(),
    <ButtonGroup>
      <Button 
        icon={EditIcon} 
        size="slim"
        onClick={() => openEditModal(campaign)}
      />
      <Button 
        icon={DeleteIcon} 
        size="slim" 
        onClick={() => {
          setSelectedCampaign(campaign)
          setShowModal(true)
        }}
      />
    </ButtonGroup>
  ])

  return (
    <Page 
      title="Campaigns"
      subtitle="Organize your marketing campaigns with UTM tracking"
      primaryAction={{
        content: 'Create Campaign',
        icon: PlusIcon,
        onAction: openCreateModal
      }}
    >
      <Layout>
        {/* Header Section */}
        <Layout.Section>
          <Box padding="600" background="bg-surface-brand" borderRadius="300">
            <BlockStack gap="300">
              <InlineStack gap="300" align="start">
                <Box padding="300" background="bg-surface-base" borderRadius="200">
                  <Icon source="hashtag" tone="base" />
                </Box>
                <BlockStack gap="200">
                  <Text variant="headingLg" as="h2" tone="base">
                    Campaign Management
                  </Text>
                  <Text variant="bodyLg" as="p" tone="base">
                    Create and organize marketing campaigns with UTM parameter tracking
                  </Text>
                </BlockStack>
              </InlineStack>
            </BlockStack>
          </Box>
        </Layout.Section>

        {/* Stats Cards */}
        <Layout.Section>
          <InlineGrid columns={{ xs: 1, sm: 2, md: 3 }} gap="400">
            <Card>
              <BlockStack gap="300">
                <InlineStack gap="200" align="start">
                  <Box padding="200" background="bg-surface-success" borderRadius="100">
                    <Icon source="hashtag" tone="base" />
                  </Box>
                  <BlockStack gap="100">
                    <Text variant="bodyMd" as="p" tone="subdued">Total Campaigns</Text>
                    <Text variant="headingLg" as="p" fontWeight="bold">
                      {campaigns.length}
                    </Text>
                  </BlockStack>
                </InlineStack>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="300">
                <InlineStack gap="200" align="start">
                  <Box padding="200" background="bg-surface-info" borderRadius="100">
                    <Icon source="link" tone="base" />
                  </Box>
                  <BlockStack gap="100">
                    <Text variant="bodyMd" as="p" tone="subdued">Total Links</Text>
                    <Text variant="headingLg" as="p" fontWeight="bold">
                      {campaigns.reduce((sum, campaign) => sum + (campaign.links_count || 0), 0)}
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
                    <Text variant="bodyMd" as="p" tone="subdued">Active Campaigns</Text>
                    <Text variant="headingLg" as="p" fontWeight="bold">
                      {campaigns.filter(c => c.links_count && c.links_count > 0).length}
                    </Text>
                  </BlockStack>
                </InlineStack>
              </BlockStack>
            </Card>
          </InlineGrid>
        </Layout.Section>

        {/* Campaigns Table */}
        <Layout.Section>
          <Card>
            <BlockStack gap="500">
              <InlineStack gap="300" align="space-between">
                <InlineStack gap="200" align="start">
                  <Box padding="200" background="bg-surface-brand" borderRadius="100">
                    <Icon source="list" tone="base" />
                  </Box>
                  <BlockStack gap="100">
                    <Text variant="headingMd" as="h3">All Campaigns</Text>
                    <Text variant="bodySm" as="p" tone="subdued">
                      Manage your marketing campaigns and UTM parameters
                    </Text>
                  </BlockStack>
                </InlineStack>
                <Button variant="primary" icon="add">
                  Create Campaign
                </Button>
              </InlineStack>
              
              <Divider />
              
              <Box padding="300" background="bg-surface-secondary" borderRadius="200">
                <DataTable
                  columnContentTypes={['text', 'text', 'text', 'text', 'text', 'text', 'text', 'text']}
                  headings={['Name', 'UTM Source', 'UTM Medium', 'UTM Campaign', 'UTM Term', 'UTM Content', 'Created', 'Actions']}
                  rows={campaignsRows}
                  footerContent={
                    <InlineStack gap="200" align="space-between">
                      <Text variant="bodySm" as="p" tone="subdued">
                        Showing {campaigns.length} campaigns
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

      <Modal
        open={showModal}
        onClose={() => {
          setShowModal(false)
          setSelectedCampaign(null)
          setIsEditing(false)
        }}
        title={isEditing ? 'Edit Campaign' : 'Create Campaign'}
        primaryAction={{
          content: isEditing ? 'Update Campaign' : 'Create Campaign',
          onAction: saveCampaign
        }}
        secondaryActions={[
          {
            content: 'Cancel',
            onAction: () => {
              setShowModal(false)
              setSelectedCampaign(null)
              setIsEditing(false)
            }
          },
          ...(isEditing && selectedCampaign ? [{
            content: 'Delete',
            destructive: true,
            onAction: () => deleteCampaign(selectedCampaign.id)
          }] : [])
        ]}
      >
        <Modal.Section>
          <FormLayout>
            <TextField
              label="Campaign Name"
              value={formData.name}
              onChange={(name) => setFormData(prev => ({ ...prev, name }))}
              placeholder="e.g., Summer Sale 2024"
              autoComplete="off"
            />
            
            <TextField
              label="UTM Source"
              value={formData.utm_source}
              onChange={(utm_source) => setFormData(prev => ({ ...prev, utm_source }))}
              placeholder="e.g., facebook"
              autoComplete="off"
            />
            
            <TextField
              label="UTM Medium"
              value={formData.utm_medium}
              onChange={(utm_medium) => setFormData(prev => ({ ...prev, utm_medium }))}
              placeholder="e.g., social"
              autoComplete="off"
            />
            
            <TextField
              label="UTM Campaign"
              value={formData.utm_campaign}
              onChange={(utm_campaign) => setFormData(prev => ({ ...prev, utm_campaign }))}
              placeholder="e.g., summer-sale"
              autoComplete="off"
            />
            
            <TextField
              label="UTM Term"
              value={formData.utm_term}
              onChange={(utm_term) => setFormData(prev => ({ ...prev, utm_term }))}
              placeholder="e.g., running-shoes"
              autoComplete="off"
            />
            
            <TextField
              label="UTM Content"
              value={formData.utm_content}
              onChange={(utm_content) => setFormData(prev => ({ ...prev, utm_content }))}
              placeholder="e.g., banner-ad"
              autoComplete="off"
            />
          </FormLayout>
        </Modal.Section>
      </Modal>
    </Page>
  )
}
