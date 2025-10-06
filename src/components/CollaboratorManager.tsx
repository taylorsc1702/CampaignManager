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
  Select,
  Badge,
  ButtonGroup,
  Icon
} from '@shopify/polaris'
import { DeleteIcon, PersonIcon } from '@shopify/polaris-icons'
import { supabase } from '@/lib/supabase'

interface Merchant {
  id: string
  shop_domain: string
  plan: string
}

interface User {
  id: string
  email: string
  name: string
  avatar_url?: string
}

interface Collaborator {
  id: string
  merchant_id: string
  user_id: string
  role: 'owner' | 'admin' | 'member'
  status: 'pending' | 'accepted' | 'declined' | 'removed'
  invited_at: string
  accepted_at?: string
  user: User
}

interface PlanLimits {
  max_collaborators: number
  max_campaigns: number
  max_links: number
  max_scans_per_month: number
  features: Record<string, any>
}

interface CollaboratorManagerProps {
  merchant: Merchant
  onClose: () => void
}

export default function CollaboratorManager({ merchant, onClose }: CollaboratorManagerProps) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteLoading, setInviteLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [planLimits, setPlanLimits] = useState<PlanLimits | null>(null)
  
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'member' as 'owner' | 'admin' | 'member'
  })

  useEffect(() => {
    fetchCollaborators()
    fetchPlanLimits()
  }, [])

  const fetchCollaborators = async () => {
    try {
      setLoading(true)
      
      // Demo mode - show mock collaborators
      if (merchant.id === 'demo-merchant') {
        const mockCollaborators = [
          {
            id: 'demo-collab-1',
            merchant_id: merchant.id,
            user_id: 'demo-user-1',
            role: 'owner' as const,
            status: 'accepted' as const,
            invited_at: new Date().toISOString(),
            accepted_at: new Date().toISOString(),
            user: {
              id: 'demo-user-1',
              email: 'owner@demo-shop.com',
              name: 'Demo Owner',
              avatar_url: undefined
            }
          }
        ]
        setCollaborators(mockCollaborators)
        setLoading(false)
        return
      }

      // Real mode - fetch from database
      const { data, error } = await supabase
        .from('collaborators')
        .select(`
          *,
          user:users(*)
        `)
        .eq('merchant_id', merchant.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setCollaborators(data || [])
    } catch (err) {
      setError('Failed to fetch collaborators')
      console.error('Error fetching collaborators:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchPlanLimits = async () => {
    try {
      // Demo mode - show mock limits
      if (merchant.id === 'demo-merchant') {
        const mockLimits = {
          max_collaborators: merchant.plan === 'starter' ? 1 : merchant.plan === 'growth' ? 3 : -1,
          max_campaigns: merchant.plan === 'starter' ? 5 : merchant.plan === 'growth' ? 25 : -1,
          max_links: merchant.plan === 'starter' ? 100 : merchant.plan === 'growth' ? 500 : -1,
          max_scans_per_month: merchant.plan === 'starter' ? 1000 : merchant.plan === 'growth' ? 10000 : -1,
          features: {
            qr_codes: true,
            utm_tracking: true,
            advanced_analytics: merchant.plan !== 'starter',
            bulk_operations: merchant.plan !== 'starter',
            custom_domains: merchant.plan === 'pro',
            api_access: merchant.plan === 'pro',
            webhooks: merchant.plan === 'pro'
          }
        }
        setPlanLimits(mockLimits)
        return
      }

      // Try to fetch plan limits from the plan_limits table directly
      try {
        const { data: planData, error: planError } = await supabase
          .from('plan_limits')
          .select('*')
          .eq('plan', merchant.plan)
          .single()

        if (planError) throw planError
        setPlanLimits(planData)
      } catch (planError) {
        // Fallback to hardcoded limits if table doesn't exist
        const fallbackLimits = {
          max_collaborators: merchant.plan === 'starter' ? 1 : merchant.plan === 'growth' ? 3 : -1,
          max_campaigns: merchant.plan === 'starter' ? 5 : merchant.plan === 'growth' ? 25 : -1,
          max_links: merchant.plan === 'starter' ? 100 : merchant.plan === 'growth' ? 500 : -1,
          max_scans_per_month: merchant.plan === 'starter' ? 1000 : merchant.plan === 'growth' ? 10000 : -1,
          features: {
            qr_codes: true,
            utm_tracking: true,
            advanced_analytics: merchant.plan !== 'starter',
            bulk_operations: merchant.plan !== 'starter',
            custom_domains: merchant.plan === 'pro',
            api_access: merchant.plan === 'pro',
            webhooks: merchant.plan === 'pro'
          }
        }
        setPlanLimits(fallbackLimits)
      }
    } catch (err) {
      console.error('Error fetching plan limits:', err)
    }
  }

  const inviteCollaborator = async () => {
    try {
      setInviteLoading(true)
      setError(null)

      if (!inviteForm.email) {
        setError('Email is required')
        return
      }

      // Demo mode - simulate invite
      if (merchant.id === 'demo-merchant') {
        const newCollaborator = {
          id: `demo-collab-${Date.now()}`,
          merchant_id: merchant.id,
          user_id: `demo-user-${Date.now()}`,
          role: inviteForm.role,
          status: 'pending' as const,
          invited_at: new Date().toISOString(),
          user: {
            id: `demo-user-${Date.now()}`,
            email: inviteForm.email,
            name: inviteForm.email.split('@')[0],
            avatar_url: undefined
          }
        }
        setCollaborators(prev => [...prev, newCollaborator])
        setInviteForm({ email: '', role: 'member' })
        return
      }

      // Real mode - create user and collaborator
      const { data: userData, error: userError } = await supabase
        .from('users')
        .upsert({
          email: inviteForm.email,
          name: inviteForm.email.split('@')[0]
        }, { onConflict: 'email' })
        .select()
        .single()

      if (userError) throw userError

      const { error: collaboratorError } = await supabase
        .from('collaborators')
        .insert({
          merchant_id: merchant.id,
          user_id: userData.id,
          role: inviteForm.role,
          status: 'pending'
        })

      if (collaboratorError) throw collaboratorError

      setInviteForm({ email: '', role: 'member' })
      fetchCollaborators()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to invite collaborator')
      console.error('Error inviting collaborator:', err)
    } finally {
      setInviteLoading(false)
    }
  }

  const removeCollaborator = async (collaboratorId: string) => {
    try {
      // Demo mode - simulate removal
      if (merchant.id === 'demo-merchant') {
        setCollaborators(prev => prev.filter(c => c.id !== collaboratorId))
        return
      }

      // Real mode - update status to removed
      const { error } = await supabase
        .from('collaborators')
        .update({ status: 'removed' })
        .eq('id', collaboratorId)

      if (error) throw error

      fetchCollaborators()
    } catch (err) {
      setError('Failed to remove collaborator')
      console.error('Error removing collaborator:', err)
    }
  }

  const updateCollaboratorRole = async (collaboratorId: string, newRole: string) => {
    try {
      // Demo mode - simulate role update
      if (merchant.id === 'demo-merchant') {
        setCollaborators(prev => prev.map(c => 
          c.id === collaboratorId ? { ...c, role: newRole as any } : c
        ))
        return
      }

      // Real mode - update role
      const { error } = await supabase
        .from('collaborators')
        .update({ role: newRole })
        .eq('id', collaboratorId)

      if (error) throw error

      fetchCollaborators()
    } catch (err) {
      setError('Failed to update collaborator role')
      console.error('Error updating collaborator role:', err)
    }
  }

  const canAddMoreCollaborators = () => {
    if (!planLimits) return false
    if (planLimits.max_collaborators === -1) return true // Unlimited
    
    const currentCount = collaborators.filter(c => c.status === 'accepted').length
    return currentCount < planLimits.max_collaborators
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { tone: 'warning' as const, label: 'Pending' },
      accepted: { tone: 'success' as const, label: 'Active' },
      declined: { tone: 'critical' as const, label: 'Declined' },
      removed: { tone: 'critical' as const, label: 'Removed' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    return <Badge tone={config.tone}>{config.label}</Badge>
  }

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      owner: { tone: 'info' as const, label: 'Owner' },
      admin: { tone: 'attention' as const, label: 'Admin' },
      member: { tone: 'success' as const, label: 'Member' }
    }
    
    const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.member
    return <Badge tone={config.tone}>{config.label}</Badge>
  }

  const collaboratorsRows = collaborators.map(collaborator => [
    <InlineStack gap="200" align="start">
      <Icon source={PersonIcon} />
      <BlockStack gap="100">
        <Text variant="bodyMd" as="p">{collaborator.user.name}</Text>
        <Text variant="bodySm" as="p">{collaborator.user.email}</Text>
      </BlockStack>
    </InlineStack>,
    getRoleBadge(collaborator.role),
    getStatusBadge(collaborator.status),
    new Date(collaborator.invited_at).toLocaleDateString(),
    collaborator.accepted_at ? new Date(collaborator.accepted_at).toLocaleDateString() : '-',
    <ButtonGroup>
      {collaborator.role !== 'owner' && (
        <Select
          label="Role"
          labelHidden
          options={[
            { label: 'Admin', value: 'admin' },
            { label: 'Member', value: 'member' }
          ]}
          value={collaborator.role}
          onChange={(value) => updateCollaboratorRole(collaborator.id, value)}
        />
      )}
      {collaborator.role !== 'owner' && (
        <Button 
          icon={DeleteIcon}
          size="slim"
          onClick={() => removeCollaborator(collaborator.id)}
        />
      )}
    </ButtonGroup>
  ])

  return (
    <Modal
      open={true}
      onClose={onClose}
      title="Team Collaborators"
      size="large"
      primaryAction={{
        content: 'Close',
        onAction: onClose
      }}
    >
      <Modal.Section>
        {error && (
          <Banner tone="critical">
            <Text variant="bodyMd" as="p">{error}</Text>
          </Banner>
        )}

        {planLimits && (
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h3">Plan Limits</Text>
              <InlineStack gap="400">
                <Text variant="bodyMd" as="p">
                  <strong>Current Plan:</strong> {merchant.plan.charAt(0).toUpperCase() + merchant.plan.slice(1)}
                </Text>
                <Text variant="bodyMd" as="p">
                  <strong>Collaborators:</strong> {collaborators.filter(c => c.status === 'accepted').length} / {planLimits.max_collaborators === -1 ? '∞' : planLimits.max_collaborators}
                </Text>
              </InlineStack>
            </BlockStack>
          </Card>
        )}

        <Card>
          <BlockStack gap="400">
            <Text variant="headingMd" as="h3">Invite New Collaborator</Text>
            <FormLayout>
              <InlineStack gap="200">
                <TextField
                  label="Email Address"
                  type="email"
                  value={inviteForm.email}
                  onChange={(email) => setInviteForm(prev => ({ ...prev, email }))}
                  placeholder="collaborator@example.com"
                  autoComplete="off"
                />
                <Select
                  label="Role"
                  options={[
                    { label: 'Member', value: 'member' },
                    { label: 'Admin', value: 'admin' }
                  ]}
                  value={inviteForm.role}
                  onChange={(role: 'owner' | 'admin' | 'member') => 
                    setInviteForm(prev => ({ ...prev, role }))
                  }
                />
                <Button 
                  variant="primary"
                  onClick={inviteCollaborator}
                  loading={inviteLoading}
                  disabled={!canAddMoreCollaborators()}
                >
                  Invite
                </Button>
              </InlineStack>
              {!canAddMoreCollaborators() && (
                <Text variant="bodySm" as="p" tone="critical">
                  You've reached the collaborator limit for your plan. Upgrade to add more team members.
                </Text>
              )}
            </FormLayout>
          </BlockStack>
        </Card>

        <Card>
          <BlockStack gap="400">
            <Text variant="headingMd" as="h3">Team Members</Text>
            {loading ? (
              <Text variant="bodyMd" as="p">Loading collaborators...</Text>
            ) : (
              <DataTable
                columnContentTypes={['text', 'text', 'text', 'text', 'text', 'text']}
                headings={['User', 'Role', 'Status', 'Invited', 'Joined', 'Actions']}
                rows={collaboratorsRows}
              />
            )}
          </BlockStack>
        </Card>

        {planLimits && (
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h3">Plan Features</Text>
              <InlineStack gap="400">
                {Object.entries(planLimits.features).map(([feature, enabled]) => (
                  <Text key={feature} variant="bodyMd" as="p">
                    {enabled ? '✅' : '❌'} {feature.replace(/_/g, ' ')}
                  </Text>
                ))}
              </InlineStack>
            </BlockStack>
          </Card>
        )}
      </Modal.Section>
    </Modal>
  )
}
