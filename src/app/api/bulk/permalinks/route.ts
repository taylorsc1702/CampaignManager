import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { generateShortCode, buildShortUrl } from '@/lib/qrcode'
import { createShopifyDiscount } from '@/lib/shopify'

interface BulkPermalinkRequest {
  merchant_id: string
  permalinks: Array<{
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
  }>
  template_id?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: BulkPermalinkRequest = await request.json()
    const { merchant_id, permalinks, template_id } = body

    // Verify merchant exists and get plan
    const { data: merchant, error: merchantError } = await supabase
      .from('merchants')
      .select('id, shop_domain, access_token, plan')
      .eq('id', merchant_id)
      .single()

    if (merchantError || !merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 })
    }

    // Check if merchant has bulk operations feature
    const { data: hasAccess } = await supabase
      .rpc('has_feature_access', { 
        merchant_uuid: merchant_id, 
        feature_name: 'bulk_operations' 
      })

    if (!hasAccess) {
      return NextResponse.json({ 
        error: 'Bulk operations not available on your current plan' 
      }, { status: 403 })
    }

    // Get template if provided
    let template = null
    if (template_id) {
      const { data: templateData } = await supabase
        .from('link_templates')
        .select('*')
        .eq('id', template_id)
        .eq('merchant_id', merchant_id)
        .single()
      template = templateData
    }

    // Create bulk operation record
    const { data: bulkOp, error: bulkOpError } = await supabase
      .from('bulk_operations')
      .insert({
        merchant_id,
        operation_type: 'bulk_permalinks',
        total_items: permalinks.length,
        metadata: { template_id }
      })
      .select()
      .single()

    if (bulkOpError) {
      return NextResponse.json({ error: 'Failed to create bulk operation' }, { status: 500 })
    }

    // Process permalinks in background
    processPermalinksAsync(merchant, permalinks, template, bulkOp.id)

    return NextResponse.json({ 
      success: true, 
      operation_id: bulkOp.id,
      message: `Processing ${permalinks.length} permalinks...`
    })

  } catch (error) {
    console.error('Bulk permalink error:', error)
    return NextResponse.json({ error: 'Failed to process bulk permalinks' }, { status: 500 })
  }
}

async function processPermalinksAsync(
  merchant: any, 
  permalinks: any[], 
  template: any, 
  operationId: string
) {
  const results: any[] = []
  let processedCount = 0
  let failedCount = 0

  for (const permalink of permalinks) {
    try {
      // Generate unique code if not provided
      const code = permalink.code || generateShortCode()

      // Use template values as defaults
      const finalUtmSource = permalink.utm_source || template?.utm_source
      const finalUtmMedium = permalink.utm_medium || template?.utm_medium
      const finalUtmCampaign = permalink.utm_campaign || template?.utm_campaign
      const finalUtmTerm = permalink.utm_term || template?.utm_term
      const finalUtmContent = permalink.utm_content || template?.utm_content

      // Create discount code if specified
      let discountCode = permalink.discount_code
      if (discountCode && permalink.discount_value) {
        try {
          await createShopifyDiscount(merchant.shop_domain, merchant.access_token, {
            code: discountCode,
            percentage: permalink.discount_type === 'percentage' ? permalink.discount_value : undefined,
            amount: permalink.discount_type === 'amount' ? permalink.discount_value : undefined
          })
        } catch (discountError) {
          console.error('Failed to create discount:', discountError)
          // Continue without discount
          discountCode = null
        }
      }

      // Build target URL with UTM parameters
      const targetUrl = new URL(permalink.url)
      if (finalUtmSource) targetUrl.searchParams.set('utm_source', finalUtmSource)
      if (finalUtmMedium) targetUrl.searchParams.set('utm_medium', finalUtmMedium)
      if (finalUtmCampaign) targetUrl.searchParams.set('utm_campaign', finalUtmCampaign)
      if (finalUtmTerm) targetUrl.searchParams.set('utm_term', finalUtmTerm)
      if (finalUtmContent) targetUrl.searchParams.set('utm_content', finalUtmContent)

      // Save link to database (skip in demo mode)
      if (merchant.id !== 'demo-merchant') {
        const { error: linkError } = await supabase
          .from('links')
          .insert({
            merchant_id: merchant.id,
            campaign_id: permalink.campaign_id || null,
            code,
            product_id: 'bulk_permalink', // Special identifier for permalinks
            variant_id: 'bulk_permalink',
            quantity: 1,
            discount_code: discountCode,
            utm_source: finalUtmSource,
            utm_medium: finalUtmMedium,
            utm_campaign: finalUtmCampaign,
            utm_term: finalUtmTerm,
            utm_content: finalUtmContent,
            target_url: targetUrl.toString(),
            active: permalink.active !== false
          })

        if (linkError) {
          throw new Error('Failed to save link')
        }
      }

      const shortUrl = buildShortUrl(code)
      results.push({
        code,
        url: shortUrl,
        original_url: permalink.url,
        success: true
      })

      processedCount++

    } catch (error) {
      results.push({
        url: permalink.url,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      failedCount++
    }

    // Update progress every 10 items
    if (processedCount % 10 === 0) {
      await supabase.rpc('update_bulk_operation_progress', {
        operation_uuid: operationId,
        processed_count: processedCount,
        failed_count: failedCount
      })
    }
  }

  // Final update
  await supabase
    .from('bulk_operations')
    .update({
      status: 'completed',
      processed_items: processedCount,
      failed_items: failedCount,
      results: { permalinks: results },
      completed_at: new Date().toISOString()
    })
    .eq('id', operationId)
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const merchant_id = searchParams.get('merchant_id')
    const operation_id = searchParams.get('operation_id')

    if (!merchant_id) {
      return NextResponse.json({ error: 'Merchant ID required' }, { status: 400 })
    }

    let query = supabase
      .from('bulk_operations')
      .select('*')
      .eq('merchant_id', merchant_id)
      .eq('operation_type', 'bulk_permalinks')
      .order('created_at', { ascending: false })

    if (operation_id) {
      query = query.eq('id', operation_id)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch operations' }, { status: 500 })
    }

    return NextResponse.json({ operations: data })

  } catch (error) {
    console.error('Fetch operations error:', error)
    return NextResponse.json({ error: 'Failed to fetch operations' }, { status: 500 })
  }
}
