'use client'

import { useState, useEffect } from 'react'
import { 
  Card, 
  Text, 
  Button, 
  DataTable,
  Badge,
  InlineStack,
  BlockStack,
  Banner,
  Spinner,
  EmptyState,
  Modal,
  ProgressBar,
  Pagination
} from '@shopify/polaris'
import { supabase } from '../lib/supabase'
import { buildShortUrl } from '../lib/qrcode'

interface Merchant {
  id: string
  shop_domain: string
  plan: string
}

interface BulkOperationsManagerProps {
  merchantId: string
  onClose: () => void
}

interface BulkOperation {
  id: string
  operation_type: string
  status: string
  total_items: number
  processed_items: number
  failed_items: number
  metadata: any
  results: any
  error_message?: string
  created_at: string
  completed_at?: string
}

export default function BulkOperationsManager({ merchantId, onClose }: BulkOperationsManagerProps) {
  const [operations, setOperations] = useState<BulkOperation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedOperation, setSelectedOperation] = useState<BulkOperation | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const itemsPerPage = 10

  useEffect(() => {
    fetchOperations()
  }, [currentPage])

  const fetchOperations = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/bulk/operations?merchant_id=${merchantId}&page=${currentPage}&limit=${itemsPerPage}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch operations')
      }

      setOperations(result.operations || [])
      setTotalPages(Math.ceil(result.total / itemsPerPage))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch operations')
      console.error('Error fetching operations:', err)
    } finally {
      setLoading(false)
    }
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

  const getOperationTypeLabel = (type: string) => {
    const typeMap = {
      bulk_links: 'Bulk Product Links',
      bulk_permalinks: 'Bulk Permalinks',
      csv_import: 'CSV Import'
    }
    return typeMap[type as keyof typeof typeMap] || type
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getProgressPercentage = (operation: BulkOperation) => {
    if (operation.total_items === 0) return 0
    return (operation.processed_items / operation.total_items) * 100
  }

  const handleViewDetails = (operation: BulkOperation) => {
    setSelectedOperation(operation)
    setShowDetailsModal(true)
  }

  const handleExportResults = (operation: BulkOperation) => {
    if (!operation.results?.permalinks) return

    const csvContent = generateCSVFromResults(operation.results.permalinks)
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bulk-operation-${operation.id}-results.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const generateCSVFromResults = (permalinks: any[]) => {
    const headers = ['Code', 'Short URL', 'Original URL', 'Status', 'Error']
    const rows = permalinks.map(p => [
      p.code || '',
      p.url || '',
      p.original_url || '',
      p.success ? 'Success' : 'Failed',
      p.error || ''
    ])
    
    return [headers, ...rows].map(row => 
      row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')
    ).join('\n')
  }

  const operationsRows = operations.map(operation => [
    getOperationTypeLabel(operation.operation_type),
    getStatusBadge(operation.status),
    operation.total_items.toString(),
    operation.status === 'processing' ? (
      <ProgressBar 
        progress={getProgressPercentage(operation)} 
        size="small" 
      />
    ) : `${operation.processed_items}/${operation.total_items}`,
    formatDate(operation.created_at),
    (
      <InlineStack gap="200">
        <Button 
          variant="plain" 
          size="slim"
          onClick={() => handleViewDetails(operation)}
        >
          View
        </Button>
        {operation.status === 'completed' && operation.results?.permalinks && (
          <Button 
            variant="plain" 
            size="slim"
            onClick={() => handleExportResults(operation)}
          >
            Export
          </Button>
        )}
      </InlineStack>
    )
  ])

  const renderDetailsModal = () => {
    if (!selectedOperation) return null

    return (
      <Modal
        open={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title={`Operation Details - ${getOperationTypeLabel(selectedOperation.operation_type)}`}
        size="large"
        primaryAction={{
          content: 'Close',
          onAction: () => setShowDetailsModal(false)
        }}
      >
        <Modal.Section>
          <BlockStack gap="400">
            <Card>
              <BlockStack gap="300">
                <Text variant="headingMd" as="h3">Operation Info</Text>
                <InlineStack gap="400">
                  <div style={{ flex: 1 }}>
                    <Text variant="bodyMd" as="p">
                      <strong>Type:</strong> {getOperationTypeLabel(selectedOperation.operation_type)}
                    </Text>
                    <Text variant="bodyMd" as="p">
                      <strong>Status:</strong> {getStatusBadge(selectedOperation.status)}
                    </Text>
                    <Text variant="bodyMd" as="p">
                      <strong>Created:</strong> {formatDate(selectedOperation.created_at)}
                    </Text>
                  </div>
                  <div style={{ flex: 1 }}>
                    <Text variant="bodyMd" as="p">
                      <strong>Total Items:</strong> {selectedOperation.total_items}
                    </Text>
                    <Text variant="bodyMd" as="p">
                      <strong>Processed:</strong> {selectedOperation.processed_items}
                    </Text>
                    <Text variant="bodyMd" as="p">
                      <strong>Failed:</strong> {selectedOperation.failed_items}
                    </Text>
                  </div>
                </InlineStack>

                {selectedOperation.status === 'processing' && (
                  <ProgressBar 
                    progress={getProgressPercentage(selectedOperation)} 
                    size="small" 
                  />
                )}

                {selectedOperation.error_message && (
                  <Banner tone="critical">
                    <Text variant="bodyMd" as="p">{selectedOperation.error_message}</Text>
                  </Banner>
                )}
              </BlockStack>
            </Card>

            {selectedOperation.results?.permalinks && (
              <Card>
                <BlockStack gap="400">
                  <InlineStack align="space-between">
                    <Text variant="headingMd" as="h3">Results</Text>
                    <Button 
                      variant="plain" 
                      onClick={() => handleExportResults(selectedOperation)}
                    >
                      Export CSV
                    </Button>
                  </InlineStack>
                  
                  <DataTable
                    columnContentTypes={['text', 'text', 'text', 'text', 'text']}
                    headings={['Code', 'Short URL', 'Original URL', 'Status', 'Error']}
                    rows={selectedOperation.results.permalinks.slice(0, 20).map((p: any) => [
                      p.code || '',
                      p.url || '',
                      p.original_url || '',
                      p.success ? 'Success' : 'Failed',
                      p.error || ''
                    ])}
                  />
                  
                  {selectedOperation.results.permalinks.length > 20 && (
                    <Text variant="bodyMd" as="p">
                      Showing first 20 results. Total: {selectedOperation.results.permalinks.length}
                    </Text>
                  )}
                </BlockStack>
              </Card>
            )}

            {selectedOperation.metadata && Object.keys(selectedOperation.metadata).length > 0 && (
              <Card>
                <BlockStack gap="300">
                  <Text variant="headingMd" as="h3">Metadata</Text>
                  <pre style={{ 
                    background: '#f6f6f7', 
                    padding: '12px', 
                    borderRadius: '4px',
                    fontSize: '12px',
                    overflow: 'auto'
                  }}>
                    {JSON.stringify(selectedOperation.metadata, null, 2)}
                  </pre>
                </BlockStack>
              </Card>
            )}
          </BlockStack>
        </Modal.Section>
      </Modal>
    )
  }

  if (loading) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spinner size="large" />
          <Text variant="bodyMd" as="p" tone="subdued">Loading operations...</Text>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <Banner tone="critical">
          <Text variant="bodyMd" as="p">{error}</Text>
        </Banner>
      </Card>
    )
  }

  if (operations.length === 0) {
    return (
      <Card>
        <EmptyState
          heading="No bulk operations yet"
          action={{
            content: 'Create your first bulk operation',
            onAction: () => {
              // This would typically open the bulk creator modal
              console.log('Open bulk creator')
            }
          }}
          image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
        >
          <Text variant="bodyMd" as="p">
            Bulk operations will appear here once you create them. 
            You can create bulk permalinks or import from CSV.
          </Text>
        </EmptyState>
      </Card>
    )
  }

  return (
    <BlockStack gap="400">
      <Card>
        <BlockStack gap="400">
          <InlineStack align="space-between">
            <Text variant="headingLg" as="h2">Bulk Operations</Text>
            <Text variant="bodyMd" as="p" tone="subdued">
              {operations.length} operations
            </Text>
          </InlineStack>

          <DataTable
            columnContentTypes={['text', 'text', 'numeric', 'text', 'text', 'text']}
            headings={['Type', 'Status', 'Items', 'Progress', 'Created', 'Actions']}
            rows={operationsRows}
          />

          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
              <Pagination
                hasPrevious={currentPage > 1}
                onPrevious={() => setCurrentPage(currentPage - 1)}
                hasNext={currentPage < totalPages}
                onNext={() => setCurrentPage(currentPage + 1)}
              />
            </div>
          )}
        </BlockStack>
      </Card>

      {renderDetailsModal()}
    </BlockStack>
  )
}
