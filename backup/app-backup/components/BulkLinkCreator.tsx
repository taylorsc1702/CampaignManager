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
  InlineError
} from '@shopify/polaris'
import { supabase } from '@/lib/supabase'
import { fetchShopifyProducts, createShopifyDiscount } from '@/lib/shopify'
import { generateQRCode, buildShortUrl } from '@/lib/qrcode'
import { generateShortCode } from '@/lib/shopify'
import type { ShopifyProduct, ShopifyVariant } from '@/lib/shopify'

interface Merchant {
  id: string
  shop_domain: string
  plan: string
}

interface BulkLinkCreatorProps {
  merchant: Merchant
  onClose: () => void
}

interface ProductHandle {
  handle: string
  selected: boolean
  product?: ShopifyProduct
  selectedVariants: string[]
}

interface BulkFormData {
  handles: string
  discountCode: string
  discountType: 'percentage' | 'amount'
  discountValue: string
  utmSource: string
  utmMedium: string
  utmCampaign: string
  utmTerm: string
  utmContent: string
}

export default function BulkLinkCreator({ merchant, onClose }: BulkLinkCreatorProps) {
  const [products, setProducts] = useState<ProductHandle[]>([])
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<Array<{
    handle: string
    success: boolean
    links: Array<{ code: string; url: string; qrCode: string }>
    error?: string
  }>>([])

  const [formData, setFormData] = useState<BulkFormData>({
    handles: '',
    discountCode: '',
    discountType: 'percentage',
    discountValue: '',
    utmSource: '',
    utmMedium: '',
    utmCampaign: '',
    utmTerm: '',
    utmContent: ''
  })

  const fetchProducts = async () => {
    try {
      setLoading(true)
      
      // Demo mode - show mock products if no real data
      const isDemo = merchant.id === 'demo-merchant'
      
      if (isDemo) {
        const mockProducts = [
          {
            id: 'demo-product-1',
            title: 'Demo Running Shoes',
            handle: 'demo-running-shoes',
            variants: [
              { id: 'demo-variant-1', title: 'Size 8 - Black', price: '99.99', sku: 'RUN-BLK-8', inventory_quantity: 50, available: true },
              { id: 'demo-variant-2', title: 'Size 9 - Black', price: '99.99', sku: 'RUN-BLK-9', inventory_quantity: 30, available: true },
              { id: 'demo-variant-3', title: 'Size 10 - White', price: '109.99', sku: 'RUN-WHT-10', inventory_quantity: 25, available: true }
            ]
          },
          {
            id: 'demo-product-2',
            title: 'Demo T-Shirt',
            handle: 'demo-t-shirt',
            variants: [
              { id: 'demo-variant-4', title: 'Medium - Blue', price: '29.99', sku: 'TSH-BLU-M', inventory_quantity: 100, available: true },
              { id: 'demo-variant-5', title: 'Large - Blue', price: '29.99', sku: 'TSH-BLU-L', inventory_quantity: 75, available: true }
            ]
          },
          {
            id: 'demo-product-3',
            title: 'Demo Backpack',
            handle: 'demo-backpack',
            variants: [
              { id: 'demo-variant-6', title: 'Standard', price: '79.99', sku: 'BAG-STD', inventory_quantity: 40, available: true }
            ]
          }
        ]
        
        // Parse handles and find matching products
        const handles = formData.handles.split('\n').map(h => h.trim()).filter(h => h)
        const productHandles: ProductHandle[] = handles.map(handle => {
          const product = mockProducts.find(p => p.handle === handle)
          return {
            handle,
            selected: true,
            product,
            selectedVariants: product ? product.variants.map(v => v.id) : []
          }
        })
        
        setProducts(productHandles)
        setLoading(false)
        return
      }

      // Real mode - fetch from Shopify
      const { data: merchantData } = await supabase
        .from('merchants')
        .select('access_token')
        .eq('id', merchant.id)
        .single()

      if (!merchantData) {
        throw new Error('Merchant not found')
      }

      const productsData = await fetchShopifyProducts(merchant.shop_domain, merchantData.access_token)
      
      // Parse handles and find matching products
      const handles = formData.handles.split('\n').map(h => h.trim()).filter(h => h)
      const productHandles: ProductHandle[] = handles.map(handle => {
        const product = productsData.find(p => p.handle === handle)
        return {
          handle,
          selected: true,
          product,
          selectedVariants: product ? product.variants.map(v => v.id) : []
        }
      })
      
      setProducts(productHandles)
    } catch (err) {
      setError('Failed to fetch products')
      console.error('Error fetching products:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleHandlesChange = (handles: string) => {
    setFormData(prev => ({ ...prev, handles }))
    setProducts([])
    setResults([])
  }

  const toggleProductSelection = (handle: string) => {
    setProducts(prev => prev.map(p => 
      p.handle === handle ? { ...p, selected: !p.selected } : p
    ))
  }

  const toggleVariantSelection = (handle: string, variantId: string) => {
    setProducts(prev => prev.map(p => {
      if (p.handle !== handle) return p
      
      const isSelected = p.selectedVariants.includes(variantId)
      return {
        ...p,
        selectedVariants: isSelected 
          ? p.selectedVariants.filter(id => id !== variantId)
          : [...p.selectedVariants, variantId]
      }
    }))
  }

  const processBulkLinks = async () => {
    try {
      setProcessing(true)
      setError(null)
      setResults([])

      const selectedProducts = products.filter(p => p.selected && p.product)
      
      if (selectedProducts.length === 0) {
        setError('Please select at least one product with variants')
        return
      }

      const results = []

      for (const productHandle of selectedProducts) {
        const product = productHandle.product!
        const links = []

        try {
          for (const variantId of productHandle.selectedVariants) {
            const variant = product.variants.find(v => v.id === variantId)
            if (!variant) continue

            // Generate unique code
            const code = generateShortCode()

            // Build target URL
            const targetUrl = `https://${merchant.shop_domain}/cart/${variantId}:1`

            // Create discount code if provided
            if (formData.discountCode && formData.discountValue) {
              try {
                if (merchant.id !== 'demo-merchant') {
                  const { data: merchantData } = await supabase
                    .from('merchants')
                    .select('access_token')
                    .eq('id', merchant.id)
                    .single()

                  if (merchantData) {
                    await createShopifyDiscount(merchant.shop_domain, merchantData.access_token, {
                      code: `${formData.discountCode}-${code}`,
                      percentage: formData.discountType === 'percentage' ? parseFloat(formData.discountValue) : undefined,
                      amount: formData.discountType === 'amount' ? parseFloat(formData.discountValue) : undefined
                    })
                  }
                }
              } catch (discountError) {
                console.error('Failed to create discount:', discountError)
              }
            }

            // Save link to database (skip in demo mode)
            if (merchant.id !== 'demo-merchant') {
              const { error: linkError } = await supabase
                .from('links')
                .insert({
                  merchant_id: merchant.id,
                  code: code,
                  product_id: product.id,
                  variant_id: variantId,
                  quantity: 1,
                  discount_code: formData.discountCode ? `${formData.discountCode}-${code}` : null,
                  utm_source: formData.utmSource || null,
                  utm_medium: formData.utmMedium || null,
                  utm_campaign: formData.utmCampaign || null,
                  utm_term: formData.utmTerm || null,
                  utm_content: formData.utmContent || null,
                  target_url: targetUrl,
                  active: true
                })

              if (linkError) {
                throw new Error(`Failed to save link for ${product.handle}`)
              }
            }

            // Generate QR code
            const shortUrl = buildShortUrl(code)
            const qrCode = await generateQRCode(shortUrl)

            links.push({
              code,
              url: shortUrl,
              qrCode,
              variant: variant.title
            })
          }

          results.push({
            handle: productHandle.handle,
            success: true,
            links
          })
        } catch (err) {
          results.push({
            handle: productHandle.handle,
            success: false,
            links: [],
            error: err instanceof Error ? err.message : 'Unknown error'
          })
        }
      }

      setResults(results)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process bulk links')
      console.error('Error processing bulk links:', err)
    } finally {
      setProcessing(false)
    }
  }

  const downloadAllQRCodes = async () => {
    const successfulResults = results.filter(r => r.success)
    for (const result of successfulResults) {
      for (const link of result.links) {
        // Create download link
        const downloadLink = document.createElement('a')
        downloadLink.href = link.qrCode
        downloadLink.download = `qr-${result.handle}-${link.code}.png`
        downloadLink.click()
        
        // Small delay between downloads
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }
  }

  const productsRows = products.map(productHandle => [
    <Checkbox
      checked={productHandle.selected}
      onChange={() => toggleProductSelection(productHandle.handle)}
    />,
    productHandle.handle,
    productHandle.product ? productHandle.product.title : 'Product not found',
    productHandle.product ? productHandle.product.variants.length : 0,
    productHandle.selectedVariants.length,
    <div>
      {productHandle.product && productHandle.product.variants.map(variant => (
        <div key={variant.id} style={{ marginBottom: '4px' }}>
          <Checkbox
            checked={productHandle.selectedVariants.includes(variant.id)}
            onChange={() => toggleVariantSelection(productHandle.handle, variant.id)}
            label={`${variant.title} - $${variant.price}`}
          />
        </div>
      ))}
    </div>
  ])

  const resultsRows = results.map(result => [
    result.handle,
    result.success ? '✅ Success' : '❌ Failed',
    result.links.length,
    result.error || '-',
    <div>
      {result.links.map(link => (
        <div key={link.code} style={{ marginBottom: '8px' }}>
          <Text variant="bodyMd" as="p">
            <strong>{link.variant}:</strong> {link.code}
          </Text>
          <Button 
            size="micro" 
            onClick={() => {
              const downloadLink = document.createElement('a')
              downloadLink.href = link.qrCode
              downloadLink.download = `qr-${result.handle}-${link.code}.png`
              downloadLink.click()
            }}
          >
            Download QR
          </Button>
        </div>
      ))}
    </div>
  ])

  return (
    <Modal
      open={true}
      onClose={onClose}
      title="Bulk Link Creator"
      size="large"
      primaryAction={{
        content: 'Process Bulk Links',
        onAction: processBulkLinks,
        loading: processing
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

        <FormLayout>
          <Text variant="headingMd" as="h3">Product Handles</Text>
          <TextField
            label="Product Handles (one per line)"
            value={formData.handles}
            onChange={handleHandlesChange}
            multiline={6}
            placeholder="demo-running-shoes&#10;demo-t-shirt&#10;demo-backpack"
            helpText="Enter product handles (URL slugs) one per line. Click 'Load Products' to fetch product data."
            autoComplete="off"
          />
          
          <Button onClick={fetchProducts} loading={loading}>
            Load Products
          </Button>

          {products.length > 0 && (
            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd" as="h3">Select Products & Variants</Text>
                <DataTable
                  columnContentTypes={['text', 'text', 'text', 'text', 'text', 'text']}
                  headings={['Select', 'Handle', 'Product Name', 'Total Variants', 'Selected', 'Variant Selection']}
                  rows={productsRows}
                />
              </BlockStack>
            </Card>
          )}

          <Text variant="headingMd" as="h3">Bulk Settings</Text>
          
          <TextField
            label="Discount Code Prefix"
            value={formData.discountCode}
            onChange={(discountCode) => setFormData(prev => ({ ...prev, discountCode }))}
            placeholder="e.g., BULK"
            helpText="Each link will get a unique discount code with this prefix"
            autoComplete="off"
          />

          {formData.discountCode && (
            <InlineStack gap="200">
              <Select
                label="Discount Type"
                options={[
                  { label: 'Percentage', value: 'percentage' },
                  { label: 'Fixed Amount', value: 'amount' }
                ]}
                value={formData.discountType}
                onChange={(discountType: 'percentage' | 'amount') => 
                  setFormData(prev => ({ ...prev, discountType }))
                }
              />
              <TextField
                label="Discount Value"
                type="number"
                value={formData.discountValue}
                onChange={(discountValue) => setFormData(prev => ({ ...prev, discountValue }))}
                suffix={formData.discountType === 'percentage' ? '%' : '$'}
                autoComplete="off"
              />
            </InlineStack>
          )}

          <Text variant="headingMd" as="h3">UTM Parameters (Optional)</Text>
          
          <InlineStack gap="200">
            <TextField
              label="UTM Source"
              value={formData.utmSource}
              onChange={(utmSource) => setFormData(prev => ({ ...prev, utmSource }))}
              placeholder="e.g., bulk-campaign"
              autoComplete="off"
            />
            <TextField
              label="UTM Medium"
              value={formData.utmMedium}
              onChange={(utmMedium) => setFormData(prev => ({ ...prev, utmMedium }))}
              placeholder="e.g., qr-codes"
              autoComplete="off"
            />
          </InlineStack>

          <TextField
            label="UTM Campaign"
            value={formData.utmCampaign}
            onChange={(utmCampaign) => setFormData(prev => ({ ...prev, utmCampaign }))}
            placeholder="e.g., bulk-qr-generation"
            autoComplete="off"
          />

          <InlineStack gap="200">
            <TextField
              label="UTM Term"
              value={formData.utmTerm}
              onChange={(utmTerm) => setFormData(prev => ({ ...prev, utmTerm }))}
              placeholder="e.g., product-handles"
              autoComplete="off"
            />
            <TextField
              label="UTM Content"
              value={formData.utmContent}
              onChange={(utmContent) => setFormData(prev => ({ ...prev, utmContent }))}
              placeholder="e.g., bulk-generation"
              autoComplete="off"
            />
          </InlineStack>

          {results.length > 0 && (
            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between">
                  <Text variant="headingMd" as="h3">Results</Text>
                  {results.some(r => r.success) && (
                    <Button onClick={downloadAllQRCodes}>
                      Download All QR Codes
                    </Button>
                  )}
                </InlineStack>
                <DataTable
                  columnContentTypes={['text', 'text', 'text', 'text', 'text']}
                  headings={['Handle', 'Status', 'Links Created', 'Error', 'QR Codes']}
                  rows={resultsRows}
                />
              </BlockStack>
            </Card>
          )}
        </FormLayout>
      </Modal.Section>
    </Modal>
  )
}
