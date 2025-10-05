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
  Spinner
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
  merchant: Merchant
  onClose: () => void
}

interface FormData {
  productId: string
  variantId: string
  quantity: string
  discountCode: string
  discountType: 'percentage' | 'amount'
  discountValue: string
  utmSource: string
  utmMedium: string
  utmCampaign: string
  utmTerm: string
  utmContent: string
}

export default function LinkCreator({ merchant, onClose }: LinkCreatorProps) {
  const [products, setProducts] = useState<ShopifyProduct[]>([])
  const [selectedProduct, setSelectedProduct] = useState<ShopifyProduct | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('')
  const [shortUrl, setShortUrl] = useState<string>('')
  const [linkCode, setLinkCode] = useState<string>('')

  const [formData, setFormData] = useState<FormData>({
    productId: '',
    variantId: '',
    quantity: '1',
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
      // Get merchant access token
      const { data: merchantData } = await supabase
        .from('merchants')
        .select('access_token')
        .eq('id', merchant.id)
        .single()

      if (!merchantData) {
        throw new Error('Merchant not found')
      }

      const productsData = await fetchShopifyProducts(merchant.shop_domain, merchantData.access_token)
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

  const generateLink = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!formData.productId || !formData.variantId) {
        setError('Please select a product and variant')
        return
      }

      // Generate unique code
      const code = generateShortCode()
      setLinkCode(code)

      // Build target URL (Shopify cart URL)
      const targetUrl = `https://${merchant.shop_domain}/cart/${formData.variantId}:${formData.quantity}`

      // Create discount code if provided
      let discountCode = formData.discountCode
      if (discountCode && formData.discountValue) {
        try {
          const { data: merchantData } = await supabase
            .from('merchants')
            .select('access_token')
            .eq('id', merchant.id)
            .single()

          if (merchantData) {
            await createShopifyDiscount(merchant.shop_domain, merchantData.access_token, {
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
          merchant_id: merchant.id,
          code: code,
          product_id: formData.productId,
          variant_id: formData.variantId,
          quantity: parseInt(formData.quantity),
          discount_code: discountCode || null,
          utm_source: formData.utmSource || null,
          utm_medium: formData.utmMedium || null,
          utm_campaign: formData.utmCampaign || null,
          utm_term: formData.utmTerm || null,
          utm_content: formData.utmContent || null,
          target_url: targetUrl,
          active: true
        })

      if (linkError) {
        throw new Error('Failed to save link')
      }

      // Generate short URL and QR code
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
          <Select
            label="Product"
            options={[{ label: 'Select a product', value: '' }, ...productOptions]}
            value={formData.productId}
            onChange={handleProductChange}
            disabled={loading}
          />

          {selectedProduct && (
            <Select
              label="Variant"
              options={[{ label: 'Select a variant', value: '' }, ...variantOptions]}
              value={formData.variantId}
              onChange={(variantId) => setFormData(prev => ({ ...prev, variantId }))}
              disabled={loading}
            />
          )}

          <TextField
            label="Quantity"
            type="number"
            value={formData.quantity}
            onChange={(quantity) => setFormData(prev => ({ ...prev, quantity }))}
            min="1"
            disabled={loading}
            autoComplete="off"
          />

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
