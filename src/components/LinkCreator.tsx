'use client'

import { useState, useEffect } from 'react'
import { 
  Modal, 
  FormLayout, 
  TextField, 
  Select, 
  Button, 
  Card, 
  Text,
  BlockStack,
  InlineStack,
  Banner,
  Spinner,
  RadioButton,
  ChoiceList,
  Icon,
  Box,
  Divider
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

interface LinkCreatorProps {
  merchantId: string
  shopDomain: string
  onClose: () => void
}

interface FormData {
  inputMethod: 'product' | 'url'
  productId: string
  variantId: string
  quantity: string
  urlInput: string
  productHandleInput: string
  discountCode: string
  discountType: 'percentage' | 'amount'
  discountValue: string
  utmSource: string
  utmMedium: string
  utmCampaign: string
  utmTerm: string
  utmContent: string
}

export default function LinkCreator({ merchantId, shopDomain, onClose }: LinkCreatorProps) {
  const [products, setProducts] = useState<ShopifyProduct[]>([])
  const [selectedProduct, setSelectedProduct] = useState<ShopifyProduct | null>(null)
  const [lookupProduct, setLookupProduct] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [lookupLoading, setLookupLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('')
  const [shortUrl, setShortUrl] = useState<string>('')
  const [linkCode, setLinkCode] = useState<string>('')

  const [formData, setFormData] = useState<FormData>({
    inputMethod: 'product',
    productId: '',
    variantId: '',
    quantity: '1',
    urlInput: '',
    productHandleInput: '',
    discountCode: '',
    discountType: 'percentage',
    discountValue: '',
    utmSource: '',
    utmMedium: '',
    utmCampaign: '',
    utmTerm: '',
    utmContent: ''
  })

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      
      // Demo mode - show mock products if no real data
      const isDemo = merchantId === '550e8400-e29b-41d4-a716-446655440000'
      
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
            title: 'Demo Wireless Headphones',
            handle: 'demo-wireless-headphones',
            variants: [
              { id: 'demo-variant-6', title: 'Black', price: '149.99', sku: 'HP-BLK', inventory_quantity: 20, available: true },
              { id: 'demo-variant-7', title: 'White', price: '149.99', sku: 'HP-WHT', inventory_quantity: 15, available: true }
            ]
          },
          {
            id: 'demo-product-4',
            title: 'Demo Fitness Tracker',
            handle: 'demo-fitness-tracker',
            variants: [
              { id: 'demo-variant-8', title: 'Black', price: '199.99', sku: 'FT-BLK', inventory_quantity: 30, available: true },
              { id: 'demo-variant-9', title: 'Pink', price: '199.99', sku: 'FT-PNK', inventory_quantity: 25, available: true }
            ]
          }
        ]
        setProducts(mockProducts)
        setLoading(false)
        return
      }

      // Real mode - get merchant access token
      const { data: merchantData } = await supabase
        .from('merchants')
        .select('access_token')
        .eq('id', merchantId)
        .single()

      if (!merchantData) {
        throw new Error('Merchant not found')
      }

      const productsData = await fetchShopifyProducts(shopDomain, merchantData.access_token)
      setProducts(productsData)
    } catch (err) {
      setError('Failed to fetch products')
      console.error('Error fetching products:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleProductChange = (productId: string) => {
    const product = products.find(p => p.id === productId)
    setSelectedProduct(product || null)
    setFormData(prev => ({
      ...prev,
      productId,
      variantId: product?.variants[0]?.id || '',
      quantity: '1'
    }))
  }

  const lookupProductByHandle = async () => {
    if (!formData.productHandleInput.trim()) {
      setError('Please enter a product handle or URL')
      return
    }

    try {
      setLookupLoading(true)
      setError(null)

      const response = await fetch('/api/products/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shop_domain: shopDomain,
          input: formData.productHandleInput
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to lookup product')
      }

      setLookupProduct(data.product)
      setFormData(prev => ({
        ...prev,
        productId: data.product.id,
        variantId: data.product.variants[0]?.id || '',
        quantity: '1'
      }))

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to lookup product')
    } finally {
      setLookupLoading(false)
    }
  }

  const createLinkFromUrl = async () => {
    if (!formData.urlInput.trim()) {
      setError('Please enter a URL')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/links/create-from-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchant_id: merchantId,
          url: formData.urlInput,
          utm_source: formData.utmSource || null,
          utm_medium: formData.utmMedium || null,
          utm_campaign: formData.utmCampaign || null,
          utm_term: formData.utmTerm || null,
          utm_content: formData.utmContent || null,
          discount_code: formData.discountCode || null,
          discount_type: formData.discountType,
          discount_value: formData.discountValue ? parseFloat(formData.discountValue) : null
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create link from URL')
      }

      setLinkCode(data.link.code)
      setShortUrl(data.link.url)

      const qrCode = await generateQRCode(data.link.url)
      setQrCodeDataUrl(qrCode)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create link from URL')
    } finally {
      setLoading(false)
    }
  }

  const generateLink = async () => {
    try {
      setLoading(true)
      setError(null)

      if (formData.inputMethod === 'url') {
        await createLinkFromUrl()
        return
      }

      if (!formData.productId || !formData.variantId) {
        setError('Please select a product and variant')
        return
      }

      // Generate unique code
      const code = generateShortCode()
      setLinkCode(code)

      // Get product handle from selected product
      const productHandle = selectedProduct?.handle
      if (!productHandle) {
        setError('Product handle not found')
        return
      }

      // Build target URL (Shopify product permalink with variant)
      const targetUrl = `https://${shopDomain}/products/${productHandle}?variant=${formData.variantId}`

      // Demo mode - skip database operations
      const isDemo = merchantId === '550e8400-e29b-41d4-a716-446655440000'
      
      if (!isDemo) {
        // Create discount code if provided
        let discountCode = formData.discountCode
        if (discountCode && formData.discountValue) {
          try {
            const { data: merchantData } = await supabase
              .from('merchants')
              .select('access_token')
              .eq('id', merchantId)
              .single()

            if (merchantData) {
              await createShopifyDiscount(shopDomain, merchantData.access_token, {
                code: discountCode,
                percentage: formData.discountType === 'percentage' ? parseFloat(formData.discountValue) : undefined,
                amount: formData.discountType === 'amount' ? parseFloat(formData.discountValue) : undefined
              })
            }
          } catch (discountError) {
            console.error('Failed to create discount:', discountError)
            setError('Failed to create discount code')
            return
          }
        }

        // Save link to database
        const { error: linkError } = await supabase
          .from('links')
          .insert({
            merchant_id: merchantId,
            code: code,
            product_id: formData.productId,
            product_handle: productHandle,
            variant_id: formData.variantId,
            quantity: parseInt(formData.quantity),
            discount_code: discountCode || null,
            utm_source: formData.utmSource || null,
            utm_medium: formData.utmMedium || null,
            utm_campaign: formData.utmCampaign || null,
            utm_term: formData.utmTerm || null,
            utm_content: formData.utmContent || null,
            target_url: targetUrl,
            permalink_type: 'product',
            active: true
          })

        if (linkError) {
          throw new Error('Failed to save link')
        }
      }

      // Generate short URL and QR code (works in both demo and real mode)
      const shortUrlValue = buildShortUrl(code)
      setShortUrl(shortUrlValue)

      const qrCode = await generateQRCode(shortUrlValue)
      setQrCodeDataUrl(qrCode)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate link')
      console.error('Error generating link:', err)
    } finally {
      setLoading(false)
    }
  }

  const productOptions = products.map(product => ({
    label: product.title,
    value: product.id
  }))

  const variantOptions = selectedProduct?.variants.map(variant => ({
    label: `${variant.title} - $${variant.price}${variant.sku ? ` (${variant.sku})` : ''}`,
    value: variant.id
  })) || []

  return (
    <Modal
      open={true}
      onClose={onClose}
      title="Create New Link"
      size="large"
      primaryAction={{
        content: 'Generate Link',
        onAction: generateLink,
        loading: loading
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
          {/* Input Method Selection */}
          <BlockStack gap="400">
            <Text variant="headingMd" as="h3">Link Creation Method</Text>
            <ChoiceList
              title="Choose how to create your link"
              choices={[
                {
                  label: (
                    <BlockStack gap="200">
                      <InlineStack gap="200" align="start">
                        <Icon source="products" tone="base" />
                        <Text variant="bodyMd" as="span" fontWeight="semibold">
                          Product Selection
                        </Text>
                      </InlineStack>
                      <Text variant="bodySm" as="p" tone="subdued">
                        Browse and select from your Shopify products
                      </Text>
                    </BlockStack>
                  ),
                  value: 'product'
                },
                {
                  label: (
                    <BlockStack gap="200">
                      <InlineStack gap="200" align="start">
                        <Icon source="link" tone="base" />
                        <Text variant="bodyMd" as="span" fontWeight="semibold">
                          Direct URL Input
                        </Text>
                      </InlineStack>
                      <Text variant="bodySm" as="p" tone="subdued">
                        Enter any URL (product handle, full URL, or external link)
                      </Text>
                    </BlockStack>
                  ),
                  value: 'url'
                }
              ]}
              selected={[formData.inputMethod]}
              onChange={(values) => setFormData(prev => ({ ...prev, inputMethod: values[0] as 'product' | 'url' }))}
            />
          </BlockStack>

          <Divider />

          {/* Product Selection Method */}
          {formData.inputMethod === 'product' && (
            <BlockStack gap="400">
              <Text variant="headingMd" as="h3">Product Selection</Text>
              
              {/* Product Handle/URL Input */}
              <InlineStack gap="200" align="end">
                <Box minWidth="300px">
                  <TextField
                    label="Product Handle or URL"
                    value={formData.productHandleInput}
                    onChange={(value) => setFormData(prev => ({ ...prev, productHandleInput: value }))}
                    placeholder="awesome-t-shirt or https://shop.myshopify.com/products/awesome-t-shirt"
                    helpText="Enter a product handle or full product URL to quickly find products"
                    disabled={lookupLoading}
                  />
                </Box>
                <Button 
                  onClick={lookupProductByHandle}
                  loading={lookupLoading}
                  disabled={!formData.productHandleInput.trim()}
                >
                  Lookup
                </Button>
              </InlineStack>

              {/* Traditional Product Dropdown */}
              <Text variant="bodyMd" as="p" tone="subdued">Or select from dropdown:</Text>
              <Select
                label="Product"
                options={[{ label: 'Select a product', value: '' }, ...productOptions]}
                value={formData.productId}
                onChange={handleProductChange}
                disabled={loading}
              />
            </BlockStack>
          )}

          {/* Direct URL Input Method */}
          {formData.inputMethod === 'url' && (
            <BlockStack gap="400">
              <Text variant="headingMd" as="h3">Direct URL Input</Text>
              <TextField
                label="URL"
                value={formData.urlInput}
                onChange={(value) => setFormData(prev => ({ ...prev, urlInput: value }))}
                placeholder="https://example.com/product or https://shop.myshopify.com/products/awesome-t-shirt"
                helpText="Enter any URL to create a tracked link with UTM parameters"
                disabled={loading}
              />
            </BlockStack>
          )}

          <Divider />

          {/* Variant Selection (for product method) */}
          {formData.inputMethod === 'product' && (selectedProduct || lookupProduct) && (
            <BlockStack gap="400">
              <Text variant="headingMd" as="h3">Product Details</Text>
              
              {/* Product Info Display */}
              {(lookupProduct || selectedProduct) && (
                <Card>
                  <BlockStack gap="200">
                    <InlineStack gap="200" align="start">
                      {(lookupProduct || selectedProduct)?.images?.[0] && (
                        <Box width="60px" height="60px">
                          <img 
                            src={(lookupProduct || selectedProduct).images[0]} 
                            alt="Product"
                            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }}
                          />
                        </Box>
                      )}
                      <BlockStack gap="100">
                        <Text variant="bodyMd" as="p" fontWeight="semibold">
                          {(lookupProduct || selectedProduct)?.title}
                        </Text>
                        <Text variant="bodySm" as="p" tone="subdued">
                          Handle: {(lookupProduct || selectedProduct)?.handle}
                        </Text>
                      </BlockStack>
                    </InlineStack>
                  </BlockStack>
                </Card>
              )}

              <Select
                label="Variant"
                options={[
                  { label: 'Select a variant', value: '' }, 
                  ...((lookupProduct || selectedProduct)?.variants || []).map((variant: any) => ({
                    label: `${variant.title === 'Default Title' ? 'Default' : variant.title} - $${variant.price}`,
                    value: variant.id
                  }))
                ]}
                value={formData.variantId}
                onChange={(variantId) => setFormData(prev => ({ ...prev, variantId }))}
                disabled={loading}
              />

              <TextField
                label="Quantity"
                type="number"
                value={formData.quantity}
                onChange={(quantity) => setFormData(prev => ({ ...prev, quantity }))}
                min="1"
                disabled={loading}
                autoComplete="off"
              />
            </BlockStack>
          )}


          <TextField
            label="Discount Code"
            value={formData.discountCode}
            onChange={(discountCode) => setFormData(prev => ({ ...prev, discountCode }))}
            placeholder="e.g., SAVE10"
            disabled={loading}
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
                disabled={loading}
              />
              <TextField
                label="Discount Value"
                type="number"
                value={formData.discountValue}
                onChange={(discountValue) => setFormData(prev => ({ ...prev, discountValue }))}
                suffix={formData.discountType === 'percentage' ? '%' : '$'}
                disabled={loading}
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
              placeholder="e.g., facebook"
              disabled={loading}
              autoComplete="off"
            />
            <TextField
              label="UTM Medium"
              value={formData.utmMedium}
              onChange={(utmMedium) => setFormData(prev => ({ ...prev, utmMedium }))}
              placeholder="e.g., social"
              disabled={loading}
              autoComplete="off"
            />
          </InlineStack>

          <TextField
            label="UTM Campaign"
            value={formData.utmCampaign}
            onChange={(utmCampaign) => setFormData(prev => ({ ...prev, utmCampaign }))}
            placeholder="e.g., summer-sale"
            disabled={loading}
            autoComplete="off"
          />

          <InlineStack gap="200">
            <TextField
              label="UTM Term"
              value={formData.utmTerm}
              onChange={(utmTerm) => setFormData(prev => ({ ...prev, utmTerm }))}
              placeholder="e.g., running-shoes"
              disabled={loading}
              autoComplete="off"
            />
            <TextField
              label="UTM Content"
              value={formData.utmContent}
              onChange={(utmContent) => setFormData(prev => ({ ...prev, utmContent }))}
              placeholder="e.g., banner-ad"
              disabled={loading}
              autoComplete="off"
            />
          </InlineStack>

          {shortUrl && (
            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd" as="h3">Generated Link</Text>
                <TextField
                  label="Short URL"
                  value={shortUrl}
                  readOnly
                  autoComplete="off"
                  helpText="Use this URL in your marketing campaigns"
                />
                
                {qrCodeDataUrl && (
                  <BlockStack gap="400">
                    <Text variant="bodyMd" as="p">QR Code:</Text>
                    <div style={{ textAlign: 'center' }}>
                      <img src={qrCodeDataUrl} alt="QR Code" style={{ maxWidth: '200px' }} />
                    </div>
                    <Button 
                      onClick={() => {
                        const link = document.createElement('a')
                        link.href = qrCodeDataUrl
                        link.download = `qr-code-${linkCode}.png`
                        link.click()
                      }}
                    >
                      Download QR Code
                    </Button>
                  </BlockStack>
                )}
              </BlockStack>
            </Card>
          )}
        </FormLayout>
      </Modal.Section>
    </Modal>
  )
}
