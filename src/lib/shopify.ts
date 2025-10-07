import { createHmac } from 'crypto'

export interface ShopifyConfig {
  apiKey: string
  apiSecret: string
  scopes: string
  appUrl: string
  redirectUrl: string
}

export const shopifyConfig: ShopifyConfig = {
  apiKey: process.env.SHOPIFY_API_KEY!,
  apiSecret: process.env.SHOPIFY_API_SECRET!,
  scopes: process.env.SHOPIFY_SCOPES || 'read_products,write_discounts,read_orders',
  appUrl: process.env.SHOPIFY_APP_URL!,
  redirectUrl: process.env.SHOPIFY_REDIRECT_URL!
}

export function generateShopifyAuthUrl(shop: string, state?: string): string {
  const params = new URLSearchParams({
    client_id: shopifyConfig.apiKey,
    scope: shopifyConfig.scopes,
    redirect_uri: shopifyConfig.redirectUrl,
    state: state || generateRandomString(16)
  })

  return `https://${shop}/admin/oauth/authorize?${params.toString()}`
}

export function verifyWebhookSignature(body: string, signature: string): boolean {
  const hmac = createHmac('sha256', shopifyConfig.apiSecret)
    .update(body, 'utf8')
    .digest('base64')

  return hmac === signature
}

export function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export function generateShortCode(): string {
  // Generate a 6-character code for the short URL
  return generateRandomString(6)
}

export interface ShopifyProduct {
  id: string
  title: string
  handle: string
  variants: ShopifyVariant[]
}

export interface ShopifyVariant {
  id: string
  title: string
  price: string
  sku?: string
  inventory_quantity?: number
  available: boolean
}

export async function fetchShopifyProducts(shop: string, accessToken: string): Promise<ShopifyProduct[]> {
  const response = await fetch(`https://${shop}/admin/api/2024-01/products.json`, {
    headers: {
      'X-Shopify-Access-Token': accessToken,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch products: ${response.statusText}`)
  }

  const data = await response.json()
  return data.products
}

export async function createShopifyDiscount(shop: string, accessToken: string, discountData: {
  code: string
  percentage?: number
  amount?: number
  minimum_amount?: number
  usage_limit?: number
  starts_at?: string
  ends_at?: string
}): Promise<any> {
  const response = await fetch(`https://${shop}/admin/api/2024-01/price_rules.json`, {
    method: 'POST',
    headers: {
      'X-Shopify-Access-Token': accessToken,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      price_rule: {
        title: `Campaign Discount: ${discountData.code}`,
        target_type: 'line_item',
        target_selection: 'all',
        allocation_method: 'across',
        value_type: discountData.percentage ? 'percentage' : 'fixed_amount',
        value: discountData.percentage ? `-${discountData.percentage}` : `-${discountData.amount}`,
        customer_selection: 'all',
        starts_at: discountData.starts_at || new Date().toISOString(),
        ends_at: discountData.ends_at,
        usage_limit: discountData.usage_limit
      }
    })
  })

  if (!response.ok) {
    throw new Error(`Failed to create discount: ${response.statusText}`)
  }

  const priceRule = await response.json()

  // Create discount code
  const codeResponse = await fetch(`https://${shop}/admin/api/2024-01/price_rules/${priceRule.price_rule.id}/discount_codes.json`, {
    method: 'POST',
    headers: {
      'X-Shopify-Access-Token': accessToken,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      discount_code: {
        code: discountData.code
      }
    })
  })

  if (!codeResponse.ok) {
    throw new Error(`Failed to create discount code: ${codeResponse.statusText}`)
  }

  return codeResponse.json()
}
