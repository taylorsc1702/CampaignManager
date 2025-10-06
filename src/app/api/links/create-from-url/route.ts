import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { generateShortCode, buildShortUrl } from '@/lib/qrcode'

interface CreateFromUrlRequest {
  merchant_id: string
  url: string
  code?: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_term?: string
  utm_content?: string
  discount_code?: string
  discount_type?: 'percentage' | 'amount'
  discount_value?: number
  campaign_id?: string
  active?: boolean
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateFromUrlRequest = await request.json()
    const { 
      merchant_id, 
      url, 
      code, 
      utm_source, 
      utm_medium, 
      utm_campaign, 
      utm_term, 
      utm_content,
      discount_code,
      discount_type,
      discount_value,
      campaign_id,
      active = true
    } = body

    if (!merchant_id || !url) {
      return NextResponse.json({ error: 'Merchant ID and URL are required' }, { status: 400 })
    }

    // Validate URL
    try {
      new URL(url)
    } catch (error) {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 })
    }

    // Verify merchant exists
    const { data: merchant, error: merchantError } = await supabase
      .from('merchants')
      .select('id, shop_domain, access_token, plan')
      .eq('id', merchant_id)
      .single()

    if (merchantError || !merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 })
    }

    // Generate unique code if not provided
    const linkCode = code || generateShortCode()

    // Check if code already exists
    const { data: existingLink } = await supabase
      .from('links')
      .select('code')
      .eq('code', linkCode)
      .single()

    if (existingLink) {
      return NextResponse.json({ error: 'Link code already exists' }, { status: 409 })
    }

    // Create discount code if specified
    let finalDiscountCode = discount_code
    if (finalDiscountCode && discount_value) {
      try {
        const { createShopifyDiscount } = await import('@/lib/shopify')
        await createShopifyDiscount(merchant.shop_domain, merchant.access_token, {
          code: finalDiscountCode,
          percentage: discount_type === 'percentage' ? discount_value : undefined,
          amount: discount_type === 'amount' ? discount_value : undefined
        })
      } catch (discountError) {
        console.error('Failed to create discount:', discountError)
        // Continue without discount
        finalDiscountCode = null
      }
    }

    // Build target URL with UTM parameters
    const targetUrl = new URL(url)
    if (utm_source) targetUrl.searchParams.set('utm_source', utm_source)
    if (utm_medium) targetUrl.searchParams.set('utm_medium', utm_medium)
    if (utm_campaign) targetUrl.searchParams.set('utm_campaign', utm_campaign)
    if (utm_term) targetUrl.searchParams.set('utm_term', utm_term)
    if (utm_content) targetUrl.searchParams.set('utm_content', utm_content)

    // Determine link type based on URL
    let permalinkType = 'custom'
    let productId = 'custom_url'
    let productHandle = 'custom_url'
    let variantId = 'custom_url'

    // Check if it's a Shopify product URL
    if (targetUrl.hostname.includes('myshopify.com') && targetUrl.pathname.includes('/products/')) {
      const pathParts = targetUrl.pathname.split('/')
      const productIndex = pathParts.indexOf('products')
      
      if (productIndex !== -1 && pathParts[productIndex + 1]) {
        productHandle = pathParts[productIndex + 1]
        const variantParam = targetUrl.searchParams.get('variant')
        
        if (variantParam) {
          permalinkType = 'product'
          productId = 'shopify_product'
          variantId = variantParam
        } else {
          permalinkType = 'product'
          productId = 'shopify_product'
          variantId = 'default'
        }
      }
    }

    // Save link to database (skip in demo mode)
    if (merchant.id !== 'demo-merchant') {
      const { error: linkError } = await supabase
        .from('links')
        .insert({
          merchant_id: merchant.id,
          campaign_id: campaign_id || null,
          code: linkCode,
          product_id: productId,
          product_handle: productHandle,
          variant_id: variantId,
          quantity: 1,
          discount_code: finalDiscountCode,
          utm_source: utm_source || null,
          utm_medium: utm_medium || null,
          utm_campaign: utm_campaign || null,
          utm_term: utm_term || null,
          utm_content: utm_content || null,
          target_url: targetUrl.toString(),
          permalink_type: permalinkType,
          active: active
        })

      if (linkError) {
        throw new Error('Failed to save link')
      }
    }

    const shortUrl = buildShortUrl(linkCode)

    return NextResponse.json({
      success: true,
      link: {
        code: linkCode,
        url: shortUrl,
        target_url: targetUrl.toString(),
        permalink_type: permalinkType,
        product_handle: productHandle,
        variant_id: variantId,
        discount_code: finalDiscountCode,
        utm_source,
        utm_medium,
        utm_campaign,
        utm_term,
        utm_content
      }
    })

  } catch (error) {
    console.error('Create from URL error:', error)
    return NextResponse.json({ 
      error: 'Failed to create link from URL',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
