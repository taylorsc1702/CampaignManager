import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params
  const userAgent = request.headers.get('user-agent') || ''
  const referer = request.headers.get('referer') || ''
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : ''

  try {
    // Get link details
    const { data: link, error: linkError } = await supabase
      .from('links')
      .select('*, merchants(shop_domain)')
      .eq('code', code)
      .eq('active', true)
      .single()

    if (linkError || !link) {
      return NextResponse.redirect('/404')
    }

    // Extract UTM parameters from URL
    const url = new URL(request.url)
    const utmSource = url.searchParams.get('utm_source')
    const utmMedium = url.searchParams.get('utm_medium')
    const utmCampaign = url.searchParams.get('utm_campaign')
    const utmTerm = url.searchParams.get('utm_term')
    const utmContent = url.searchParams.get('utm_content')

    // Log the scan
    const { error: scanError } = await supabase
      .from('scans')
      .insert({
        link_id: link.id,
        merchant_id: link.merchant_id,
        ip_address: ip,
        user_agent: userAgent,
        referer: referer,
        utm_source: utmSource || link.utm_source,
        utm_medium: utmMedium || link.utm_medium,
        utm_campaign: utmCampaign || link.utm_campaign,
        utm_term: utmTerm || link.utm_term,
        utm_content: utmContent || link.utm_content
      })

    if (scanError) {
      console.error('Failed to log scan:', scanError)
    }

    // Build redirect URL with parameters
    const redirectUrl = new URL(link.target_url)
    
    // Add discount code if present
    if (link.discount_code) {
      redirectUrl.searchParams.set('discount', link.discount_code)
    }

    // Add quantity for product permalinks (if not already in URL)
    if (link.permalink_type === 'product' && link.quantity && !redirectUrl.searchParams.has('quantity')) {
      redirectUrl.searchParams.set('quantity', link.quantity.toString())
    }

    // Add UTM parameters
    const finalUtmSource = utmSource || link.utm_source
    const finalUtmMedium = utmMedium || link.utm_medium
    const finalUtmCampaign = utmCampaign || link.utm_campaign
    const finalUtmTerm = utmTerm || link.utm_term
    const finalUtmContent = utmContent || link.utm_content

    if (finalUtmSource) redirectUrl.searchParams.set('utm_source', finalUtmSource)
    if (finalUtmMedium) redirectUrl.searchParams.set('utm_medium', finalUtmMedium)
    if (finalUtmCampaign) redirectUrl.searchParams.set('utm_campaign', finalUtmCampaign)
    if (finalUtmTerm) redirectUrl.searchParams.set('utm_term', finalUtmTerm)
    if (finalUtmContent) redirectUrl.searchParams.set('utm_content', finalUtmContent)

    // Add link tracking parameter
    redirectUrl.searchParams.set('link_id', link.id)

    return NextResponse.redirect(redirectUrl.toString())

  } catch (error) {
    console.error('Redirect error:', error)
    return NextResponse.redirect('/500')
  }
}
