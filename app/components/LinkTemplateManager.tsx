'use client'

import { useState, useEffect } from 'react'
import { 
  Modal, 
  FormLayout, 
  TextField, 
  Button, 
  Card, 
  Text,
  BlockStack,
  InlineStack,
  Banner,
  DataTable,
  Checkbox,
  Select,
  InlineError,
  EmptyState
} from '@shopify/polaris'
import { supabase } from '../lib/supabase'

interface Merchant {
  id: string
  shop_domain: string
  plan: string
}

interface LinkTemplateManagerProps {
  merchantId: string
  onClose: () => void
}

interface LinkTemplate {
  id: string
  name: string
  description?: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_term?: string
  utm_content?: string
  discount_code_prefix?: string
  discount_type?: 'percentage' | 'amount'
  discount_value?: number
  is_default: boolean
}

export default function LinkTemplateManager({ merchantId, onClose }: LinkTemplateManagerProps) {
  const [templates, setTemplates] = useState<LinkTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingTemplate, setEditingTemplate] = useState<LinkTemplate | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    utm_source: '',
    utm_medium: '',
    utm_campaign: '',
    utm_term: '',
    utm_content: '',
    discount_code_prefix: '',
    discount_type: 'percentage' as 'percentage' | 'amount',
    discount_value: '',
    is_default: false
  })

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('link_templates')
        .select('*')
        .eq('merchant_id', merchantId)
        .order('name')

      if (error) throw error
      setTemplates(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch templates')
      console.error('Failed to fetch templates:', err)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      utm_source: '',
      utm_medium: '',
      utm_campaign: '',
      utm_term: '',
      utm_content: '',
      discount_code_prefix: '',
      discount_type: 'percentage',
      discount_value: '',
      is_default: false
    })
    setEditingTemplate(null)
    setShowCreateForm(false)
  }

  const handleEdit = (template: LinkTemplate) => {
    setFormData({
      name: template.name,
      description: template.description || '',
      utm_source: template.utm_source || '',
      utm_medium: template.utm_medium || '',
      utm_campaign: template.utm_campaign || '',
      utm_term: template.utm_term || '',
      utm_content: template.utm_content || '',
      discount_code_prefix: template.discount_code_prefix || '',
      discount_type: template.discount_type || 'percentage',
      discount_value: template.discount_value?.toString() || '',
      is_default: template.is_default
    })
    setEditingTemplate(template)
    setShowCreateForm(true)
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)

      // Validate required fields
      if (!formData.name.trim()) {
        setError('Template name is required')
        return
      }

      const templateData = {
        merchant_id: merchantId,
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        utm_source: formData.utm_source.trim() || null,
        utm_medium: formData.utm_medium.trim() || null,
        utm_campaign: formData.utm_campaign.trim() || null,
        utm_term: formData.utm_term.trim() || null,
        utm_content: formData.utm_content.trim() || null,
        discount_code_prefix: formData.discount_code_prefix.trim() || null,
        discount_type: formData.discount_type,
        discount_value: formData.discount_value ? parseFloat(formData.discount_value) : null,
        is_default: formData.is_default
      }

      if (editingTemplate) {
        // Update existing template
        const { error: updateError } = await supabase
          .from('link_templates')
          .update(templateData)
          .eq('id', editingTemplate.id)
          .eq('merchant_id', merchantId)

        if (updateError) throw updateError
      } else {
        // Create new template
        const { error: insertError } = await supabase
          .from('link_templates')
          .insert(templateData)

        if (insertError) throw insertError
      }

      // If this is set as default, unset all other defaults
      if (formData.is_default) {
        await supabase
          .from('link_templates')
          .update({ is_default: false })
          .eq('merchant_id', merchantId)
          .neq('id', editingTemplate?.id || 'new')

        // Set this one as default
        if (!editingTemplate) {
          const { data: newTemplate } = await supabase
            .from('link_templates')
            .select('id')
            .eq('merchant_id', merchantId)
            .eq('name', formData.name.trim())
            .single()

          if (newTemplate) {
            await supabase
              .from('link_templates')
              .update({ is_default: true })
              .eq('id', newTemplate.id)
          }
        } else {
          await supabase
            .from('link_templates')
            .update({ is_default: true })
            .eq('id', editingTemplate.id)
        }
      }

      await fetchTemplates()
      resetForm()

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save template')
      console.error('Failed to save template:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (template: LinkTemplate) => {
    if (!confirm(`Are you sure you want to delete the template "${template.name}"?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('link_templates')
        .delete()
        .eq('id', template.id)
        .eq('merchant_id', merchantId)

      if (error) throw error
      await fetchTemplates()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete template')
      console.error('Failed to delete template:', err)
    }
  }

  const templatesRows = templates.map(template => [
    template.name,
    template.description || '',
    template.is_default ? 'Yes' : 'No',
    template.utm_source || '',
    template.utm_medium || '',
    template.utm_campaign || '',
    (
      <InlineStack gap="200">
        <Button 
          variant="plain" 
          size="slim"
          onClick={() => handleEdit(template)}
        >
          Edit
        </Button>
        <Button 
          variant="plain" 
          size="slim"
          tone="critical"
          onClick={() => handleDelete(template)}
        >
          Delete
        </Button>
      </InlineStack>
    )
  ])

  const renderForm = () => (
    <Card>
      <BlockStack gap="400">
        <Text variant="headingMd" as="h3">
          {editingTemplate ? 'Edit Template' : 'Create Template'}
        </Text>

        <FormLayout>
          <TextField
            label="Template Name"
            value={formData.name}
            onChange={(value) => setFormData({ ...formData, name: value })}
            placeholder="e.g., Social Media Campaign"
            autoComplete="off"
          />

          <TextField
            label="Description (optional)"
            value={formData.description}
            onChange={(value) => setFormData({ ...formData, description: value })}
            placeholder="Brief description of when to use this template"
            autoComplete="off"
            multiline={2}
          />

          <Text variant="headingSm" as="h4">UTM Parameters</Text>

          <InlineStack gap="300">
            <div style={{ flex: 1 }}>
              <TextField
                label="Source"
                value={formData.utm_source}
                onChange={(value) => setFormData({ ...formData, utm_source: value })}
                placeholder="google"
                autoComplete="off"
              />
            </div>
            <div style={{ flex: 1 }}>
              <TextField
                label="Medium"
                value={formData.utm_medium}
                onChange={(value) => setFormData({ ...formData, utm_medium: value })}
                placeholder="cpc"
                autoComplete="off"
              />
            </div>
          </InlineStack>

          <InlineStack gap="300">
            <div style={{ flex: 1 }}>
              <TextField
                label="Campaign"
                value={formData.utm_campaign}
                onChange={(value) => setFormData({ ...formData, utm_campaign: value })}
                placeholder="summer-sale"
                autoComplete="off"
              />
            </div>
            <div style={{ flex: 1 }}>
              <TextField
                label="Term"
                value={formData.utm_term}
                onChange={(value) => setFormData({ ...formData, utm_term: value })}
                placeholder="running-shoes"
                autoComplete="off"
              />
            </div>
          </InlineStack>

          <TextField
            label="Content"
            value={formData.utm_content}
            onChange={(value) => setFormData({ ...formData, utm_content: value })}
            placeholder="header-banner"
            autoComplete="off"
          />

          <Text variant="headingSm" as="h4">Discount Settings (optional)</Text>

          <InlineStack gap="300">
            <div style={{ flex: 1 }}>
              <TextField
                label="Discount Code Prefix"
                value={formData.discount_code_prefix}
                onChange={(value) => setFormData({ ...formData, discount_code_prefix: value })}
                placeholder="SAVE"
                autoComplete="off"
              />
            </div>
            <div style={{ flex: 1 }}>
              <Select
                label="Discount Type"
                options={[
                  { label: 'Percentage', value: 'percentage' },
                  { label: 'Fixed Amount', value: 'amount' }
                ]}
                value={formData.discount_type}
                onChange={(value) => setFormData({ ...formData, discount_type: value as 'percentage' | 'amount' })}
              />
            </div>
            <div style={{ flex: 1 }}>
              <TextField
                label="Discount Value"
                value={formData.discount_value}
                onChange={(value) => setFormData({ ...formData, discount_value: value })}
                placeholder="20"
                type="number"
                autoComplete="off"
              />
            </div>
          </InlineStack>

          <Checkbox
            label="Set as default template"
            checked={formData.is_default}
            onChange={(checked) => setFormData({ ...formData, is_default: checked })}
          />

          <InlineStack gap="300">
            <Button 
              variant="primary" 
              onClick={handleSave}
              loading={saving}
            >
              {editingTemplate ? 'Update Template' : 'Create Template'}
            </Button>
            <Button 
              variant="plain" 
              onClick={resetForm}
            >
              Cancel
            </Button>
          </InlineStack>
        </FormLayout>
      </BlockStack>
    </Card>
  )

  return (
    <Modal
      open={true}
      onClose={onClose}
      title="Link Templates"
      size="large"
      secondaryActions={[
        {
          content: 'Close',
          onAction: onClose
        }
      ]}
    >
      <Modal.Section>
        {error && (
          <Banner tone="critical">
            <Text variant="bodyMd" as="p">{error}</Text>
          </Banner>
        )}

        {showCreateForm ? (
          renderForm()
        ) : (
          <BlockStack gap="400">
            <InlineStack align="space-between">
              <Text variant="headingLg" as="h2">Link Templates</Text>
              <Button 
                variant="primary" 
                onClick={() => setShowCreateForm(true)}
              >
                Create Template
              </Button>
            </InlineStack>

            {templates.length === 0 ? (
              <Card>
                <EmptyState
                  heading="No templates yet"
                  action={{
                    content: 'Create your first template',
                    onAction: () => setShowCreateForm(true)
                  }}
                  image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                >
                  <Text variant="bodyMd" as="p">
                    Templates let you save common UTM parameters and discount settings 
                    for reuse across multiple links.
                  </Text>
                </EmptyState>
              </Card>
            ) : (
              <Card>
                <DataTable
                  columnContentTypes={['text', 'text', 'text', 'text', 'text', 'text', 'text']}
                  headings={['Name', 'Description', 'Default', 'Source', 'Medium', 'Campaign', 'Actions']}
                  rows={templatesRows}
                />
              </Card>
            )}
          </BlockStack>
        )}
      </Modal.Section>
    </Modal>
  )
}
