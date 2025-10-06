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
  Spinner
} from '@shopify/polaris'
import { supabase } from '@/lib/supabase'
import { buildShortUrl } from '@/lib/qrcode'

interface Merchant {
  id: string
  shop_domain: string
  plan: string
}

interface BulkPermalinkCreatorProps {
  merchant: Merchant
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

export default function BulkPermalinkCreator({ merchant, onClose }: BulkPermalinkCreatorProps) {
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

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('link_templates')
        .select('*')
        .eq('merchant_id', merchant.id)
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
        .eq('merchant_id', merchant.id)
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
    const preview = lines.slice(0, 5).map(line => {
      const values = parseCSVLine(line)
      return {
        url: values[0] || '',
        code: values[1] || '',
        utm_source: values[2] || '',
        utm_medium: values[3] || '',
        utm_campaign: values[4] || ''
      }
    })
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
            merchant_id: merchant.id,
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
            merchant_id: merchant.id,
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
        const response = await fetch(`/api/bulk/permalinks?merchant_id=${merchant.id}&operation_id=${operation.id}`)
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
    <BlockStack gap="400">
      <Text variant="headingMd" as="h3">Template & Campaign</Text>
      
      <InlineStack gap="400">
        <div style={{ flex: 1 }}>
          <Select
            label="Template (optional)"
            options={[
              { label: 'No template', value: '' },
              ...templates.map(t => ({ label: t.name, value: t.id }))
            ]}
            value={selectedTemplate}
            onChange={setSelectedTemplate}
          />
        </div>
        <div style={{ flex: 1 }}>
          <Select
            label="Campaign (optional)"
            options={[
              { label: 'No campaign', value: '' },
              ...campaigns.map(c => ({ label: c.name, value: c.id }))
            ]}
            value={selectedCampaign}
            onChange={setSelectedCampaign}
          />
        </div>
      </InlineStack>

      <Text variant="headingMd" as="h3">Permalinks</Text>
      
      {permalinks.map((permalink, index) => (
        <Card key={index}>
          <BlockStack gap="300">
            <InlineStack align="space-between">
              <Text variant="headingSm" as="h4">Permalink {index + 1}</Text>
              {permalinks.length > 1 && (
                <Button 
                  variant="plain" 
                  tone="critical"
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

      <Button onClick={addPermalink} variant="plain">
        Add Another Permalink
      </Button>
    </BlockStack>
  )

  const renderCSVMode = () => (
    <BlockStack gap="400">
      <Text variant="headingMd" as="h3">CSV Upload</Text>
      
      <div>
        <Text variant="bodyMd" as="p" fontWeight="semibold">Upload CSV File</Text>
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
            marginTop: '8px',
            padding: '8px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            width: '100%',
            maxWidth: '300px'
          }}
        />
        <Text variant="bodySm" as="p" tone="subdued" style={{ marginTop: '4px' }}>
          Select a CSV file with columns: url, code, utm_source, utm_medium, utm_campaign
        </Text>
      </div>
      
      {csvFile && (
        <Banner tone="info">
          <Text variant="bodyMd" as="p">
            File uploaded: {csvFile.name} ({csvFile.size} bytes)
          </Text>
        </Banner>
      )}

      <Checkbox
        label="First row contains headers"
        checked={hasHeaders}
        onChange={setHasHeaders}
      />

      {csvPreview.length > 0 && (
        <Card>
          <BlockStack gap="400">
            <Text variant="headingMd" as="h3">CSV Preview</Text>
            <DataTable
              columnContentTypes={['text', 'text', 'text', 'text', 'text']}
              headings={['URL', 'Code', 'UTM Source', 'UTM Medium', 'UTM Campaign']}
              rows={csvPreview.map(row => [
                row.url,
                row.code,
                row.utm_source,
                row.utm_medium,
                row.utm_campaign
              ])}
            />
          </BlockStack>
        </Card>
      )}

      <Text variant="headingMd" as="h3">Template & Campaign</Text>
      
      <InlineStack gap="400">
        <div style={{ flex: 1 }}>
          <Select
            label="Template (optional)"
            options={[
              { label: 'No template', value: '' },
              ...templates.map(t => ({ label: t.name, value: t.id }))
            ]}
            value={selectedTemplate}
            onChange={setSelectedTemplate}
          />
        </div>
        <div style={{ flex: 1 }}>
          <Select
            label="Campaign (optional)"
            options={[
              { label: 'No campaign', value: '' },
              ...campaigns.map(c => ({ label: c.name, value: c.id }))
            ]}
            value={selectedCampaign}
            onChange={setSelectedCampaign}
          />
        </div>
      </InlineStack>
    </BlockStack>
  )

  const renderOperationStatus = () => {
    if (!operation) return null

    return (
      <Card>
        <BlockStack gap="400">
          <InlineStack align="space-between">
            <Text variant="headingMd" as="h3">Operation Status</Text>
            {getStatusBadge(operation.status)}
          </InlineStack>

          {operation.status === 'processing' && (
            <ProgressBar
              progress={(operation.processed_items / operation.total_items) * 100}
              size="small"
            />
          )}

          <Text variant="bodyMd" as="p">
            Processed: {operation.processed_items} / {operation.total_items}
            {operation.failed_items > 0 && ` (${operation.failed_items} failed)`}
          </Text>

          {operation.error_message && (
            <Banner tone="critical">
              <Text variant="bodyMd" as="p">{operation.error_message}</Text>
            </Banner>
          )}

          {operation.status === 'completed' && operation.results && (
            <BlockStack gap="300">
              <Text variant="headingSm" as="h4">Results</Text>
              <DataTable
                columnContentTypes={['text', 'text', 'text']}
                headings={['Code', 'Short URL', 'Status']}
                rows={operation.results.permalinks?.slice(0, 10).map((p: any) => [
                  p.code,
                  p.url,
                  p.success ? 'Success' : 'Failed'
                ]) || []}
              />
              {operation.results.permalinks?.length > 10 && (
                <Text variant="bodyMd" as="p">
                  Showing first 10 results. Total: {operation.results.permalinks.length}
                </Text>
              )}
            </BlockStack>
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
          <BlockStack gap="400">
            <InlineStack gap="300">
              <Button
                variant={mode === 'manual' ? 'primary' : 'plain'}
                onClick={() => setMode('manual')}
              >
                Manual Entry
              </Button>
              <Button
                variant={mode === 'csv' ? 'primary' : 'plain'}
                onClick={() => setMode('csv')}
              >
                CSV Upload
              </Button>
            </InlineStack>

            {mode === 'manual' ? renderManualMode() : renderCSVMode()}
          </BlockStack>
        )}
      </Modal.Section>
    </Modal>
  )
}
