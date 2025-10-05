import { NextRequest, NextResponse } from 'next/server'
import { verifyWebhookSignature } from '@/lib/shopify'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-shopify-hmac-sha256') || ''
    const shop = request.headers.get('x-shopify-shop-domain') || ''

    // Verify webhook signature
    if (!verifyWebhookSignature(body, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const order = JSON.parse(body)

    // Extract shop domain from the webhook header
    const shopDomain = shop.includes('.myshopify.com') ? shop : `${shop}.myshopify.com`

    // Get merchant
    const { data: merchant, error: merchantError } = await supabaseAdmin
      .from('merchants')
      .select('id')
      .eq('shop_domain', shopDomain)
      .single()

    if (merchantError || !merchant) {
      console.error('Merchant not found:', shopDomain)
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 })
    }

    // Extract link_id and UTM parameters from order
    const linkId = order.note_attributes?.find((attr: any) => attr.name === 'link_id')?.value
    const utmSource = order.note_attributes?.find((attr: any) => attr.name === 'utm_source')?.value
    const utmMedium = order.note_attributes?.find((attr: any) => attr.name === 'utm_medium')?.value
    const utmCampaign = order.note_attributes?.find((attr: any) => attr.name === 'utm_campaign')?.value
    const utmTerm = order.note_attributes?.find((attr: any) => attr.name === 'utm_term')?.value
    const utmContent = order.note_attributes?.find((attr: any) => attr.name === 'utm_content')?.value

    // Log the order
    const { error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        merchant_id: merchant.id,
        link_id: linkId,
        shop_order_id: order.id.toString(),
        subtotal: parseFloat(order.subtotal_price),
        total: parseFloat(order.total_price),
        currency: order.currency,
        utm_source: utmSource,
        utm_medium: utmMedium,
        utm_campaign: utmCampaign,
        utm_term: utmTerm,
        utm_content: utmContent
      })

    if (orderError) {
      console.error('Failed to log order:', orderError)
      return NextResponse.json({ error: 'Failed to log order' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
