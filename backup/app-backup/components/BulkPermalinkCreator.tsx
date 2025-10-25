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
  ProgressBar,
  Badge,
  Spinner,
  Icon,
  Divider,
  Box,
  InlineGrid
} from '@shopify/polaris'
import { supabase } from '@/lib/supabase'
import { buildShortUrl } from '@/lib/qrcode'

interface Merchant {
  id: string
  shop_domain: string
  plan: string
}

interface BulkPermalinkCreatorProps {
  merchantId: string
  shopDomain: string
  onClose: () => void
}

interface LinkTemplate {
  id: string
  name: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_term?: string
  utm_content?: string
  discount_code_prefix?: string
  discount_type?: string
  discount_value?: number
}

interface BulkOperation {
  id: string
  status: string
  total_items: number
  processed_items: number
  failed_items: number
  created_at: string
  completed_at?: string
  results?: any
  error_message?: string
}

interface PermalinkFormData {
  url: string
  code?: string
  utm_source: string
  utm_medium: string
  utm_campaign: string
  utm_term: string
  utm_content: string
  discount_code: string
  discount_type: 'percentage' | 'amount'
  discount_value: string
  campaign_id?: string
}

export default function BulkPermalinkCreator({ merchantId, shopDomain, onClose }: BulkPermalinkCreatorProps) {
  const [mode, setMode] = useState<'manual' | 'csv'>('manual')
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [templates, setTemplates] = useState<LinkTemplate[]>([])
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [selectedCampaign, setSelectedCampaign] = useState<string>('')
  const [operation, setOperation] = useState<BulkOperation | null>(null)
  
  // Manual mode state
  const [permalinks, setPermalinks] = useState<PermalinkFormData[]>([
    {
      url: '',
      code: '',
      utm_source: '',
      utm_medium: '',
      utm_campaign: '',
      utm_term: '',
      utm_content: '',
      discount_code: '',
      discount_type: 'percentage',
      discount_value: '',
      campaign_id: ''
    }
  ])

  // CSV mode state
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [csvData, setCsvData] = useState<string>('')
  const [csvPreview, setCsvPreview] = useState<any[]>([])
  const [hasHeaders, setHasHeaders] = useState(true)

  useEffect(() => {
    fetchTemplates()
    fetchCampaigns()
  }, [])

  // Update existing permalinks when template is selected
  useEffect(() => {
    if (selectedTemplate && templates.length > 0) {
      const template = templates.find(t => t.id === selectedTemplate)
      if (template) {
        setPermalinks(prev => prev.map(permalink => ({
          ...permalink,
          utm_source: template.utm_source || permalink.utm_source,
          utm_medium: template.utm_medium || permalink.utm_medium,
          utm_campaign: template.utm_campaign || permalink.utm_campaign,
          utm_term: template.utm_term || permalink.utm_term,
          utm_content: template.utm_content || permalink.utm_content
        })))
      }
    }
  }, [selectedTemplate, templates])

  const fetchTemplates = async () => {
    try {
      // Check if this is a demo merchant
      const isDemo = merchantId === '550e8400-e29b-41d4-a716-446655440000'
      
      if (isDemo) {
        // Set demo templates
        const demoTemplates = [
          {
            id: 'demo-template-1',
            name: 'Social Media Campaign',
            utm_source: 'facebook',
            utm_medium: 'social',
            utm_campaign: 'social-campaign-2024',
            utm_term: '',
            utm_content: 'post'
          },
          {
            id: 'demo-template-2',
            name: 'Email Newsletter',
            utm_source: 'newsletter',
            utm_medium: 'email',
            utm_campaign: 'weekly-newsletter',
            utm_term: '',
            utm_content: 'banner'
          },
          {
            id: 'demo-template-3',
            name: 'Google Ads',
            utm_source: 'google',
            utm_medium: 'cpc',
            utm_campaign: 'search-campaign',
            utm_term: 'keywords',
            utm_content: 'ad'
          }
        ]
        setTemplates(demoTemplates)
        return
      }

      const { data, error } = await supabase
        .from('link_templates')
        .select('*')
        .eq('merchant_id', merchantId)
        .order('name')

      if (error) throw error
      setTemplates(data || [])
    } catch (err) {
      console.error('Failed to fetch templates:', err)
    }
  }

  const fetchCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('id, name')
        .eq('merchant_id', merchantId)
        .order('name')

      if (error) throw error
      setCampaigns(data || [])
    } catch (err) {
      console.error('Failed to fetch campaigns:', err)
    }
  }

  const addPermalink = () => {
    setPermalinks([...permalinks, {
      url: '',
      code: '',
      utm_source: selectedTemplate ? (templates.find(t => t.id === selectedTemplate)?.utm_source || '') : '',
      utm_medium: selectedTemplate ? (templates.find(t => t.id === selectedTemplate)?.utm_medium || '') : '',
      utm_campaign: selectedTemplate ? (templates.find(t => t.id === selectedTemplate)?.utm_campaign || '') : '',
      utm_term: selectedTemplate ? (templates.find(t => t.id === selectedTemplate)?.utm_term || '') : '',
      utm_content: selectedTemplate ? (templates.find(t => t.id === selectedTemplate)?.utm_content || '') : '',
      discount_code: '',
      discount_type: 'percentage',
      discount_value: '',
      campaign_id: selectedCampaign
    }])
  }

  const removePermalink = (index: number) => {
    setPermalinks(permalinks.filter((_, i) => i !== index))
  }

  const updatePermalink = (index: number, field: keyof PermalinkFormData, value: string) => {
    const updated = [...permalinks]
    updated[index] = { ...updated[index], [field]: value }
    setPermalinks(updated)
  }

  const handleFileUpload = (files: File[]) => {
    try {
      const file = files[0]
      if (!file) return

      // Validate file type
      if (!file.name.toLowerCase().endsWith('.csv')) {
        setError('Please select a CSV file')
        return
      }

      setCsvFile(file)
      
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string
          setCsvData(content)
          previewCSV(content)
        } catch (error) {
          console.error('File read error:', error)
          setError('Failed to read file content')
        }
      }
      reader.onerror = () => {
        setError('Failed to read file')
      }
      reader.readAsText(file)
    } catch (error) {
      console.error('File upload error:', error)
      setError('Failed to process file')
    }
  }

  const previewCSV = (content: string) => {
    const lines = content.trim().split('\n')
    if (lines.length === 0) return

    const preview = []
    
    // Parse headers if they exist
    let headers: string[] = []
    let startIndex = 0
    
    if (hasHeaders && lines.length > 0) {
      headers = parseCSVLine(lines[0])
      startIndex = 1
    }

    // Process data rows
    for (let i = startIndex; i < Math.min(lines.length, 5); i++) {
      const line = lines[i].trim()
      if (!line) continue

      const values = parseCSVLine(line)
      const row: any = {
        url: '',
        code: 'Auto-generated',
        utm_source: '-',
        utm_medium: '-',
        utm_campaign: '-'
      }

      if (hasHeaders && headers.length > 0) {
        // Map by header names (same logic as API)
        headers.forEach((header, index) => {
          const value = values[index]?.trim()
          if (value) {
            const cleanHeader = header.toLowerCase().replace(/[^a-z_]/g, '')
            switch (cleanHeader) {
              case 'url':
                row.url = value
                break
              case 'producthandle':
                // Generate preview URL for product handle
                row.url = `https://${shopDomain}/products/${value}`
                break
              case 'code':
                row.code = value
                break
              case 'utmsource':
                row.utm_source = value
                break
              case 'utmmedium':
                row.utm_medium = value
                break
              case 'utmcampaign':
                row.utm_campaign = value
                break
            }
          }
        })
      } else {
        // Map by position
        if (values.length > 0) {
          // Check if first column looks like a product handle or URL
          const firstValue = values[0] || ''
          if (firstValue.includes('/products/')) {
            row.url = firstValue
          } else {
            row.url = `https://${shopDomain}/products/${firstValue}`
          }
        }
        if (values.length > 1) row.code = values[1] || 'Auto-generated'
        if (values.length > 2) row.utm_source = values[2] || '-'
        if (values.length > 3) row.utm_medium = values[3] || '-'
        if (values.length > 4) row.utm_campaign = values[4] || '-'
      }

      preview.push(row)
    }
    
    setCsvPreview(preview)
  }

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = []
    let current = ''
    let inQuotes = false
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = !inQuotes
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current)
        current = ''
      } else {
        current += char
      }
    }
    
    result.push(current)
    return result
  }

  const validatePermalinks = () => {
    const validPermalinks = permalinks.filter(p => p.url.trim())
    
    if (validPermalinks.length === 0) {
      setError('Please add at least one permalink')
      return false
    }

    for (const permalink of validPermalinks) {
      try {
        new URL(permalink.url)
      } catch {
        setError(`Invalid URL: ${permalink.url}`)
        return false
      }
    }

    return true
  }

  const processBulkPermalinks = async () => {
    try {
      setProcessing(true)
      setError(null)

      let permalinkData: any[]

      if (mode === 'csv') {
        if (!csvData) {
          setError('Please upload a CSV file')
          return
        }

        const response = await fetch('/api/bulk/csv', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            merchant_id: merchantId,
            csv_data: csvData,
            template_id: selectedTemplate || undefined,
            campaign_id: selectedCampaign || undefined,
            has_headers: hasHeaders
          })
        })

        const result = await response.json()
        if (!response.ok) {
          throw new Error(result.error || 'Failed to process CSV')
        }

        setOperation({
          id: result.operation_id,
          status: 'processing',
          total_items: result.preview.length,
          processed_items: 0,
          failed_items: 0,
          created_at: new Date().toISOString()
        })

      } else {
        if (!validatePermalinks()) return

        const validPermalinks = permalinks.filter(p => p.url.trim())
        permalinkData = validPermalinks.map(p => ({
          url: p.url,
          code: p.code || undefined,
          utm_source: p.utm_source || undefined,
          utm_medium: p.utm_medium || undefined,
          utm_campaign: p.utm_campaign || undefined,
          utm_term: p.utm_term || undefined,
          utm_content: p.utm_content || undefined,
          discount_code: p.discount_code || undefined,
          discount_type: p.discount_type,
          discount_value: p.discount_value ? parseFloat(p.discount_value) : undefined,
          campaign_id: p.campaign_id || undefined
        }))

        const response = await fetch('/api/bulk/permalinks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            merchant_id: merchantId,
            permalinks: permalinkData,
            template_id: selectedTemplate || undefined
          })
        })

        const result = await response.json()
        if (!response.ok) {
          throw new Error(result.error || 'Failed to process permalinks')
        }

        setOperation({
          id: result.operation_id,
          status: 'processing',
          total_items: permalinkData.length,
          processed_items: 0,
          failed_items: 0,
          created_at: new Date().toISOString()
        })
      }

      // Start polling for updates
      pollOperationStatus()

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process permalinks')
      console.error('Error processing permalinks:', err)
    } finally {
      setProcessing(false)
    }
  }

  const pollOperationStatus = async () => {
    if (!operation) return

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/bulk/permalinks?merchant_id=${merchantId}&operation_id=${operation.id}`)
        const result = await response.json()
        
        if (result.operations && result.operations.length > 0) {
          const updatedOp = result.operations[0]
          setOperation(updatedOp)
          
          if (updatedOp.status === 'completed' || updatedOp.status === 'failed') {
            clearInterval(interval)
          }
        }
      } catch (err) {
        console.error('Failed to poll operation status:', err)
        clearInterval(interval)
      }
    }, 2000)

    // Clear interval after 5 minutes
    setTimeout(() => clearInterval(interval), 300000)
  }

  const getStatusBadge = (status: string) => {
    const statusMap = {
      processing: { status: 'info', children: 'Processing' },
      completed: { status: 'success', children: 'Completed' },
      failed: { status: 'critical', children: 'Failed' },
      cancelled: { status: 'warning', children: 'Cancelled' }
    }
    return <Badge {...statusMap[status as keyof typeof statusMap]} />
  }

  const renderManualMode = () => (
    <BlockStack gap="500">
      {/* Header Section */}
      <Box padding="400" background="bg-surface-secondary" borderRadius="200">
        <InlineStack gap="300" align="start">
          <Box padding="200" background="bg-surface-brand" borderRadius="100">
            <Icon source="edit" tone="base" />
          </Box>
          <BlockStack gap="200">
            <Text variant="headingMd" as="h3">Manual Entry</Text>
            <Text variant="bodyMd" as="p" tone="subdued">
              Create permalinks one by one with custom UTM parameters
            </Text>
          </BlockStack>
        </InlineStack>
      </Box>

      {/* Template & Campaign Section */}
      <Card>
        <BlockStack gap="400">
          <InlineStack gap="200" align="start">
            <Box padding="200" background="bg-surface-brand" borderRadius="100">
              <Icon source="settings" tone="base" />
            </Box>
            <BlockStack gap="100">
              <Text variant="headingMd" as="h3">Template & Campaign</Text>
              <Text variant="bodySm" as="p" tone="subdued">
                Apply templates and campaigns to your permalinks (optional)
              </Text>
            </BlockStack>
          </InlineStack>
          
          <InlineGrid columns={{ xs: 1, sm: 2 }} gap="400">
            <Select
              label="Template (optional)"
              helpText="Apply UTM parameters from a saved template"
              options={[
                { label: 'No template', value: '' },
                ...templates.map(t => ({ label: t.name, value: t.id }))
              ]}
              value={selectedTemplate}
              onChange={setSelectedTemplate}
            />
            <Select
              label="Campaign (optional)"
              helpText="Associate permalinks with a campaign"
              options={[
                { label: 'No campaign', value: '' },
                ...campaigns.map(c => ({ label: c.name, value: c.id }))
              ]}
              value={selectedCampaign}
              onChange={setSelectedCampaign}
            />
          </InlineGrid>
        </BlockStack>
      </Card>

      {/* Permalinks Section */}
      <Card>
        <BlockStack gap="400">
          <InlineStack gap="200" align="start">
            <Box padding="200" background="bg-surface-brand" borderRadius="100">
              <Icon source="link" tone="base" />
            </Box>
            <BlockStack gap="100">
              <Text variant="headingMd" as="h3">Permalinks</Text>
              <Text variant="bodySm" as="p" tone="subdued">
                Add URLs and configure UTM parameters for each permalink
              </Text>
            </BlockStack>
          </InlineStack>
      
          {permalinks.map((permalink, index) => (
            <Card key={index}>
              <BlockStack gap="400">
                <InlineStack align="space-between">
                  <InlineStack gap="200" align="center">
                    <Box padding="200" background="bg-surface-secondary" borderRadius="100">
                      <Text variant="bodyMd" as="span" fontWeight="semibold">
                        {index + 1}
                      </Text>
                    </Box>
                    <Text variant="headingSm" as="h4">Permalink {index + 1}</Text>
                  </InlineStack>
                  {permalinks.length > 1 && (
                    <Button 
                      variant="plain" 
                      tone="critical"
                      icon="delete"
                      onClick={() => removePermalink(index)}
                    >
                      Remove
                    </Button>
                  )}
                </InlineStack>
            
            <FormLayout>
              <TextField
                label="URL"
                value={permalink.url}
                onChange={(value) => updatePermalink(index, 'url', value)}
                placeholder="https://example.com/page"
                autoComplete="off"
              />
              
              <InlineStack gap="300">
                <div style={{ flex: 1 }}>
                  <TextField
                    label="Custom Code (optional)"
                    value={permalink.code}
                    onChange={(value) => updatePermalink(index, 'code', value)}
                    placeholder="auto-generated"
                    autoComplete="off"
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <TextField
                    label="Discount Code (optional)"
                    value={permalink.discount_code}
                    onChange={(value) => updatePermalink(index, 'discount_code', value)}
                    placeholder="SAVE20"
                    autoComplete="off"
                  />
                </div>
              </InlineStack>

              <Text variant="headingSm" as="h5">UTM Parameters</Text>
              <InlineStack gap="300">
                <div style={{ flex: 1 }}>
                  <TextField
                    label="Source"
                    value={permalink.utm_source}
                    onChange={(value) => updatePermalink(index, 'utm_source', value)}
                    placeholder="google"
                    autoComplete="off"
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <TextField
                    label="Medium"
                    value={permalink.utm_medium}
                    onChange={(value) => updatePermalink(index, 'utm_medium', value)}
                    placeholder="cpc"
                    autoComplete="off"
                  />
                </div>
              </InlineStack>

              <InlineStack gap="300">
                <div style={{ flex: 1 }}>
                  <TextField
                    label="Campaign"
                    value={permalink.utm_campaign}
                    onChange={(value) => updatePermalink(index, 'utm_campaign', value)}
                    placeholder="summer-sale"
                    autoComplete="off"
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <TextField
                    label="Term"
                    value={permalink.utm_term}
                    onChange={(value) => updatePermalink(index, 'utm_term', value)}
                    placeholder="running-shoes"
                    autoComplete="off"
                  />
                </div>
              </InlineStack>

              <TextField
                label="Content"
                value={permalink.utm_content}
                onChange={(value) => updatePermalink(index, 'utm_content', value)}
                placeholder="header-banner"
                autoComplete="off"
              />
            </FormLayout>
          </BlockStack>
        </Card>
      ))}

          <Button 
            onClick={addPermalink} 
            variant="plain"
            icon="add"
            fullWidth
          >
            <InlineStack gap="200" align="center">
              <Icon source="add" tone="base" />
              <Text variant="bodyMd" as="span">Add Another Permalink</Text>
            </InlineStack>
          </Button>
        </BlockStack>
      </Card>
    </BlockStack>
  )

  const renderCSVMode = () => (
    <BlockStack gap="500">
      {/* Header Section */}
      <Box padding="400" background="bg-surface-secondary" borderRadius="200">
        <InlineStack gap="300" align="start">
          <Box padding="200" background="bg-surface-brand" borderRadius="100">
            <Icon source="upload" tone="base" />
          </Box>
          <BlockStack gap="200">
            <Text variant="headingMd" as="h3">CSV Upload</Text>
            <Text variant="bodyMd" as="p" tone="subdued">
              Upload a CSV file to create multiple permalinks at once
            </Text>
          </BlockStack>
        </InlineStack>
      </Box>

      {/* File Upload Section */}
      <Card>
        <BlockStack gap="400">
          <Text variant="headingSm" as="h4">Upload Your CSV File</Text>
          
          <Box 
            padding="600" 
            background="bg-surface-secondary" 
            borderRadius="300"
            borderWidth="025"
            borderColor="border"
            borderStyle="dashed"
          >
            <BlockStack gap="300" align="center">
              <Box padding="300" background="bg-surface-brand" borderRadius="200">
                <Icon source="upload" tone="base" />
              </Box>
              
              <BlockStack gap="200" align="center">
                <Text variant="bodyMd" as="p" fontWeight="semibold">
                  {csvFile ? 'File Ready' : 'Choose CSV File'}
                </Text>
                <Text variant="bodySm" as="p" tone="subdued" alignment="center">
                  {csvFile 
                    ? `${csvFile.name} (${csvFile.size} bytes)`
                    : 'Click to browse or drag and drop your CSV file'
                  }
                </Text>
              </BlockStack>

              <input
                type="file"
                accept=".csv"
                onChange={(e) => {
                  try {
                    const file = e.target.files?.[0]
                    if (file) {
                      handleFileUpload([file])
                    }
                  } catch (error) {
                    console.error('File upload error:', error)
                    setError('Failed to read file. Please try again.')
                  }
                }}
                style={{ 
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  opacity: 0,
                  cursor: 'pointer'
                }}
              />
            </BlockStack>
          </Box>

          <Box padding="300" background="bg-surface-info" borderRadius="200">
            <BlockStack gap="200">
              <Text variant="bodySm" as="p" fontWeight="semibold">
                📋 Expected CSV Format
              </Text>
              <Text variant="bodySm" as="p" tone="subdued">
                Your CSV should have these columns: <strong>url, code, utm_source, utm_medium, utm_campaign</strong>
              </Text>
              <Text variant="bodySm" as="p" tone="subdued">
                Optional columns: utm_term, utm_content, discount_code, discount_type, discount_value
              </Text>
            </BlockStack>
          </Box>

          <Checkbox
            label="First row contains headers"
            checked={hasHeaders}
            onChange={setHasHeaders}
          />
        </BlockStack>
      </Card>

      {csvPreview.length > 0 && (
        <Card>
          <BlockStack gap="400">
            <InlineStack gap="300" align="space-between">
              <InlineStack gap="200" align="start">
                <Box padding="200" background="bg-surface-success" borderRadius="100">
                  <Icon source="view" tone="base" />
                </Box>
                <BlockStack gap="100">
                  <Text variant="headingMd" as="h3">CSV Preview</Text>
                  <Text variant="bodySm" as="p" tone="subdued">
                    {csvPreview.length} row{csvPreview.length !== 1 ? 's' : ''} ready to process
                  </Text>
                </BlockStack>
              </InlineStack>
              <Badge status="success">Ready</Badge>
            </InlineStack>
            
            <Box padding="300" background="bg-surface-secondary" borderRadius="200">
              <DataTable
                columnContentTypes={['text', 'text', 'text', 'text', 'text']}
                headings={['URL', 'Code', 'UTM Source', 'UTM Medium', 'UTM Campaign']}
                rows={csvPreview.map((row, index) => [
                  <Text variant="bodyMd" as="span" fontWeight="medium">{row.url}</Text>,
                  <Text variant="bodyMd" as="span">{row.code || 'Auto-generated'}</Text>,
                  <Text variant="bodyMd" as="span">{row.utm_source || '-'}</Text>,
                  <Text variant="bodyMd" as="span">{row.utm_medium || '-'}</Text>,
                  <Text variant="bodyMd" as="span">{row.utm_campaign || '-'}</Text>
                ])}
              />
            </Box>
          </BlockStack>
        </Card>
      )}

      <Card>
        <BlockStack gap="400">
          <InlineStack gap="200" align="start">
            <Box padding="200" background="bg-surface-brand" borderRadius="100">
              <Icon source="settings" tone="base" />
            </Box>
            <BlockStack gap="100">
              <Text variant="headingMd" as="h3">Template & Campaign</Text>
              <Text variant="bodySm" as="p" tone="subdued">
                Apply templates and campaigns to your permalinks (optional)
              </Text>
            </BlockStack>
          </InlineStack>
          
          <InlineGrid columns={{ xs: 1, sm: 2 }} gap="400">
            <Select
              label="Template (optional)"
              helpText="Apply UTM parameters from a saved template"
              options={[
                { label: 'No template', value: '' },
                ...templates.map(t => ({ label: t.name, value: t.id }))
              ]}
              value={selectedTemplate}
              onChange={setSelectedTemplate}
            />
            <Select
              label="Campaign (optional)"
              helpText="Associate permalinks with a campaign"
              options={[
                { label: 'No campaign', value: '' },
                ...campaigns.map(c => ({ label: c.name, value: c.id }))
              ]}
              value={selectedCampaign}
              onChange={setSelectedCampaign}
            />
          </InlineGrid>
        </BlockStack>
      </Card>
    </BlockStack>
  )

  const renderOperationStatus = () => {
    if (!operation) return null

    const getStatusIcon = (status: string) => {
      switch (status) {
        case 'processing': return 'spinner'
        case 'completed': return 'checkmark'
        case 'failed': return 'cancel'
        default: return 'info'
      }
    }

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'processing': return 'bg-surface-info'
        case 'completed': return 'bg-surface-success'
        case 'failed': return 'bg-surface-critical'
        default: return 'bg-surface-secondary'
      }
    }

    return (
      <Card>
        <BlockStack gap="500">
          {/* Status Header */}
          <InlineStack gap="300" align="space-between">
            <InlineStack gap="200" align="start">
              <Box padding="200" background={getStatusColor(operation.status)} borderRadius="100">
                <Icon source={getStatusIcon(operation.status)} tone="base" />
              </Box>
              <BlockStack gap="100">
                <Text variant="headingMd" as="h3">Operation Status</Text>
                <Text variant="bodySm" as="p" tone="subdued">
                  {operation.status === 'processing' && 'Creating your permalinks...'}
                  {operation.status === 'completed' && 'All permalinks created successfully!'}
                  {operation.status === 'failed' && 'Operation failed'}
                </Text>
              </BlockStack>
            </InlineStack>
            {getStatusBadge(operation.status)}
          </InlineStack>

          {/* Progress Section */}
          {operation.status === 'processing' && (
            <Box padding="400" background="bg-surface-secondary" borderRadius="200">
              <BlockStack gap="300">
                <InlineStack align="space-between">
                  <Text variant="bodyMd" as="p" fontWeight="semibold">Progress</Text>
                  <Text variant="bodyMd" as="p" tone="subdued">
                    {operation.processed_items} / {operation.total_items}
                  </Text>
                </InlineStack>
                <ProgressBar
                  progress={(operation.processed_items / operation.total_items) * 100}
                  size="small"
                />
                {operation.failed_items > 0 && (
                  <Text variant="bodySm" as="p" tone="critical">
                    {operation.failed_items} failed
                  </Text>
                )}
              </BlockStack>
            </Box>
          )}

          {/* Error Message */}
          {operation.error_message && (
            <Banner tone="critical">
              <Text variant="bodyMd" as="p">{operation.error_message}</Text>
            </Banner>
          )}

          {/* Results Section */}
          {operation.status === 'completed' && operation.results && (
            <Box padding="400" background="bg-surface-success" borderRadius="200">
              <BlockStack gap="400">
                <InlineStack gap="200" align="start">
                  <Box padding="200" background="bg-surface-brand" borderRadius="100">
                    <Icon source="checkmark" tone="base" />
                  </Box>
                  <BlockStack gap="100">
                    <Text variant="headingSm" as="h4">Results</Text>
                    <Text variant="bodySm" as="p" tone="subdued">
                      {operation.results.permalinks?.length || 0} permalinks created
                    </Text>
                  </BlockStack>
                </InlineStack>
                
                <DataTable
                  columnContentTypes={['text', 'text', 'text']}
                  headings={['Code', 'Short URL', 'Status']}
                  rows={operation.results.permalinks?.slice(0, 10).map((p: any) => [
                    <Text variant="bodyMd" as="span" fontWeight="medium">{p.code}</Text>,
                    <Text variant="bodyMd" as="span">{p.url}</Text>,
                    <Badge status={p.success ? 'success' : 'critical'}>
                      {p.success ? 'Success' : 'Failed'}
                    </Badge>
                  ]) || []}
                />
                
                {operation.results.permalinks?.length > 10 && (
                  <Text variant="bodySm" as="p" tone="subdued">
                    Showing first 10 results. Total: {operation.results.permalinks.length}
                  </Text>
                )}
              </BlockStack>
            </Box>
          )}
        </BlockStack>
      </Card>
    )
  }

  return (
    <Modal
      open={true}
      onClose={onClose}
      title="Bulk Permalink Creator"
      size="large"
      primaryAction={{
        content: operation?.status === 'processing' ? 'Processing...' : 'Create Permalinks',
        onAction: processBulkPermalinks,
        loading: processing,
        disabled: operation?.status === 'processing'
      }}
      secondaryActions={[
        {
          content: 'Cancel',
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

        {operation ? (
          renderOperationStatus()
        ) : (
          <BlockStack gap="500">
            {/* Tab Navigation */}
            <Box padding="300" background="bg-surface-secondary" borderRadius="200">
              <InlineStack gap="200">
                <Button
                  variant={mode === 'manual' ? 'primary' : 'plain'}
                  onClick={() => setMode('manual')}
                  icon={mode === 'manual' ? 'checkmark' : undefined}
                >
                  <InlineStack gap="200" align="center">
                    <Icon source="edit" tone={mode === 'manual' ? 'base' : 'subdued'} />
                    <Text variant="bodyMd" as="span" fontWeight={mode === 'manual' ? 'semibold' : 'regular'}>
                      Manual Entry
                    </Text>
                  </InlineStack>
                </Button>
                <Button
                  variant={mode === 'csv' ? 'primary' : 'plain'}
                  onClick={() => setMode('csv')}
                  icon={mode === 'csv' ? 'checkmark' : undefined}
                >
                  <InlineStack gap="200" align="center">
                    <Icon source="upload" tone={mode === 'csv' ? 'base' : 'subdued'} />
                    <Text variant="bodyMd" as="span" fontWeight={mode === 'csv' ? 'semibold' : 'regular'}>
                      CSV Upload
                    </Text>
                  </InlineStack>
                </Button>
              </InlineStack>
            </Box>

            {mode === 'manual' ? renderManualMode() : renderCSVMode()}
          </BlockStack>
        )}
      </Modal.Section>
    </Modal>
  )
}
