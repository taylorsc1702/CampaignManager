import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const merchant_id = searchParams.get('merchant_id')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const operation_type = searchParams.get('operation_type')

    if (!merchant_id) {
      return NextResponse.json({ error: 'Merchant ID required' }, { status: 400 })
    }

    // Calculate offset for pagination
    const offset = (page - 1) * limit

    // Build query
    let query = supabase
      .from('bulk_operations')
      .select('*', { count: 'exact' })
      .eq('merchant_id', merchant_id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Filter by operation type if specified
    if (operation_type) {
      query = query.eq('operation_type', operation_type)
    }

    const { data, error, count } = await query

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch operations' }, { status: 500 })
    }

    return NextResponse.json({ 
      operations: data || [], 
      total: count || 0,
      page,
      limit,
      total_pages: Math.ceil((count || 0) / limit)
    })

  } catch (error) {
    console.error('Fetch operations error:', error)
    return NextResponse.json({ error: 'Failed to fetch operations' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const merchant_id = searchParams.get('merchant_id')
    const operation_id = searchParams.get('operation_id')

    if (!merchant_id || !operation_id) {
      return NextResponse.json({ error: 'Merchant ID and Operation ID required' }, { status: 400 })
    }

    // Only allow deletion of completed or failed operations
    const { data: operation, error: fetchError } = await supabase
      .from('bulk_operations')
      .select('status')
      .eq('id', operation_id)
      .eq('merchant_id', merchant_id)
      .single()

    if (fetchError || !operation) {
      return NextResponse.json({ error: 'Operation not found' }, { status: 404 })
    }

    if (operation.status === 'processing') {
      return NextResponse.json({ 
        error: 'Cannot delete processing operation' 
      }, { status: 400 })
    }

    const { error: deleteError } = await supabase
      .from('bulk_operations')
      .delete()
      .eq('id', operation_id)
      .eq('merchant_id', merchant_id)

    if (deleteError) {
      return NextResponse.json({ error: 'Failed to delete operation' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Delete operation error:', error)
    return NextResponse.json({ error: 'Failed to delete operation' }, { status: 500 })
  }
}
