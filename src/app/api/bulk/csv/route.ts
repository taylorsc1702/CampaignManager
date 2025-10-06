import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

interface CSVUploadRequest {
  merchant_id: string
  csv_data: string
  template_id?: string
  campaign_id?: string
  has_headers: boolean
}

export async function POST(request: NextRequest) {
  try {
    const body: CSVUploadRequest = await request.json()
    const { merchant_id, csv_data, template_id, campaign_id, has_headers } = body

    // Verify merchant exists and get plan
    const { data: merchant, error: merchantError } = await supabase
      .from('merchants')
      .select('id, shop_domain, access_token, plan')
      .eq('id', merchant_id)
      .single()

    if (merchantError || !merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 })
    }

    // Check if merchant has CSV import feature
    const { data: hasAccess } = await supabase
      .rpc('has_feature_access', { 
        merchant_uuid: merchant_id, 
        feature_name: 'csv_import' 
      })

    if (!hasAccess) {
      return NextResponse.json({ 
        error: 'CSV import not available on your current plan' 
      }, { status: 403 })
    }

    // Parse CSV data
    const { permalinks, errors } = parseCSVData(csv_data, has_headers)

    if (errors.length > 0) {
      return NextResponse.json({ 
        error: 'CSV parsing errors', 
        details: errors 
      }, { status: 400 })
    }

    if (permalinks.length === 0) {
      return NextResponse.json({ 
        error: 'No valid permalinks found in CSV' 
      }, { status: 400 })
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
        operation_type: 'csv_import',
        total_items: permalinks.length,
        metadata: { 
          template_id, 
          campaign_id,
          csv_has_headers: has_headers,
          original_csv_length: csv_data.split('\n').length
        }
      })
      .select()
      .single()

    if (bulkOpError) {
      return NextResponse.json({ error: 'Failed to create bulk operation' }, { status: 500 })
    }

    // Process permalinks in background
    processCSVPermalinksAsync(merchant, permalinks, template, campaign_id, bulkOp.id)

    return NextResponse.json({ 
      success: true, 
      operation_id: bulkOp.id,
      message: `Processing ${permalinks.length} permalinks from CSV...`,
      preview: permalinks.slice(0, 5) // Show first 5 as preview
    })

  } catch (error) {
    console.error('CSV upload error:', error)
    return NextResponse.json({ error: 'Failed to process CSV upload' }, { status: 500 })
  }
}

function parseCSVData(csvData: string, hasHeaders: boolean) {
  const lines = csvData.trim().split('\n')
  const permalinks: any[] = []
  const errors: string[] = []

  // Flexible CSV format - supports any combination of these columns:
  // url,code,utm_source,utm_medium,utm_campaign,utm_term,utm_content,discount_code,discount_type,discount_value
  const supportedColumns = [
    'url', 'code', 'utm_source', 'utm_medium', 'utm_campaign', 
    'utm_term', 'utm_content', 'discount_code', 'discount_type', 'discount_value'
  ]

  let startIndex = hasHeaders ? 1 : 0
  let headers: string[] = []

  if (hasHeaders && lines.length > 0) {
    headers = parseCSVLine(lines[0])
    console.log('Parsed headers:', headers)
  }

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    try {
      const values = parseCSVLine(line)
      
      // Create permalink object with defaults
      const permalink: any = {
        utm_term: '',
        utm_content: '',
        discount_code: '',
        discount_type: 'percentage',
        discount_value: 0
      }

      if (hasHeaders && headers.length > 0) {
        // Map by header names
        console.log(`Processing row ${i + 1}:`, { headers, values })
        headers.forEach((header, index) => {
          const value = values[index]?.trim()
          const cleanHeader = header.toLowerCase().replace(/[^a-z_]/g, '')
          console.log(`  Header: "${header}" -> Clean: "${cleanHeader}" -> Value: "${value}"`)
          
          if (value) {
            switch (cleanHeader) {
              case 'url':
                permalink.url = value
                break
              case 'code':
                permalink.code = value
                break
              case 'utmsource':
                permalink.utm_source = value
                break
              case 'utmmedium':
                permalink.utm_medium = value
                break
              case 'utmcampaign':
                permalink.utm_campaign = value
                break
              case 'utmterm':
                permalink.utm_term = value
                break
              case 'utmcontent':
                permalink.utm_content = value
                break
              case 'discountcode':
                permalink.discount_code = value
                break
              case 'discounttype':
                permalink.discount_type = value
                break
              case 'discountvalue':
                permalink.discount_value = parseFloat(value)
                break
            }
          }
        })
        console.log(`  Result:`, permalink)
      } else {
        // Map by position - flexible for any number of columns
        if (values.length > 0) permalink.url = values[0]?.trim()
        if (values.length > 1) permalink.code = values[1]?.trim()
        if (values.length > 2) permalink.utm_source = values[2]?.trim()
        if (values.length > 3) permalink.utm_medium = values[3]?.trim()
        if (values.length > 4) permalink.utm_campaign = values[4]?.trim()
        if (values.length > 5) permalink.utm_term = values[5]?.trim()
        if (values.length > 6) permalink.utm_content = values[6]?.trim()
        if (values.length > 7) permalink.discount_code = values[7]?.trim()
        if (values.length > 8) permalink.discount_type = values[8]?.trim()
        if (values.length > 9) permalink.discount_value = parseFloat(values[9]?.trim() || '0')
      }

      // Validate required fields
      if (!permalink.url) {
        errors.push(`Row ${i + 1}: URL is required`)
        continue
      }

      // Validate URL format
      try {
        new URL(permalink.url)
      } catch {
        errors.push(`Row ${i + 1}: Invalid URL format: ${permalink.url}`)
        continue
      }

      // Validate discount type
      if (permalink.discount_type && !['percentage', 'amount'].includes(permalink.discount_type)) {
        errors.push(`Row ${i + 1}: Invalid discount type (must be 'percentage' or 'amount'): ${permalink.discount_type}`)
        continue
      }

      // Ensure required UTM fields have values
      if (!permalink.utm_source) permalink.utm_source = ''
      if (!permalink.utm_medium) permalink.utm_medium = ''
      if (!permalink.utm_campaign) permalink.utm_campaign = ''

      permalinks.push(permalink)

    } catch (error) {
      errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Parse error'}`)
      console.error(`CSV parsing error on row ${i + 1}:`, error)
    }
  }

  return { permalinks, errors }
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"'
        i++ // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }
  
  // Add last field
  result.push(current)
  
  return result
}

async function processCSVPermalinksAsync(
  merchant: any, 
  permalinks: any[], 
  template: any, 
  campaignId: string | undefined,
  operationId: string
) {
  const results: any[] = []
  let processedCount = 0
  let failedCount = 0

  for (const permalink of permalinks) {
    try {
      // Use template values as defaults
      const finalUtmSource = permalink.utm_source || template?.utm_source
      const finalUtmMedium = permalink.utm_medium || template?.utm_medium
      const finalUtmCampaign = permalink.utm_campaign || template?.utm_campaign
      const finalUtmTerm = permalink.utm_term || template?.utm_term
      const finalUtmContent = permalink.utm_content || template?.utm_content

      // Generate code if not provided
      const code = permalink.code || `${merchant.id.slice(0, 8)}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`

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
            campaign_id: campaignId || null,
            code,
            product_id: 'csv_permalink', // Special identifier for CSV permalinks
            variant_id: 'csv_permalink',
            quantity: 1,
            discount_code: discountCode,
            utm_source: finalUtmSource,
            utm_medium: finalUtmMedium,
            utm_campaign: finalUtmCampaign,
            utm_term: finalUtmTerm,
            utm_content: finalUtmContent,
            target_url: targetUrl.toString(),
            active: true
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

// Import the buildShortUrl function
import { buildShortUrl } from '@/lib/qrcode'
import { createShopifyDiscount } from '@/lib/shopify'
