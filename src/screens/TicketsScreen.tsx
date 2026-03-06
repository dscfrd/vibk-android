import React, { useState, useCallback, useEffect } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl,
  ActivityIndicator, TextInput, Modal
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useSync } from '../contexts/SyncContext'
import sshService from '../services/ssh-service'
import type { VibkProject } from '../shared/project-types'
import type { Ticket, TicketStatus, TicketPriority } from '../shared/vibk-types'

const STATUS_ORDER: TicketStatus[] = ['in_progress', 'todo', 'done']
const STATUS_LABELS: Record<TicketStatus, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  done: 'Done'
}
const STATUS_COLORS: Record<TicketStatus, string> = {
  todo: '#e0af68',
  in_progress: '#7aa2f7',
  done: '#9ece6a'
}
const PRIORITY_COLORS: Record<TicketPriority, string> = {
  high: '#f7768e',
  medium: '#e0af68',
  low: '#565f89'
}

function PriorityBadge({ priority }: { priority: TicketPriority }): React.JSX.Element {
  return (
    <View style={[styles.priorityBadge, { backgroundColor: PRIORITY_COLORS[priority] + '30' }]}>
      <Text style={[styles.priorityText, { color: PRIORITY_COLORS[priority] }]}>
        {priority.toUpperCase()}
      </Text>
    </View>
  )
}

export function TicketsScreen(): React.JSX.Element {
  const { projects, sshServers } = useSync()
  const [selectedProject, setSelectedProject] = useState<VibkProject | null>(null)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editPriority, setEditPriority] = useState<TicketPriority>('medium')
  const [editStatus, setEditStatus] = useState<TicketStatus>('todo')
  const [saving, setSaving] = useState(false)

  const activeProjects = projects.filter(p => !p.archived)

  const loadTickets = useCallback(async (project: VibkProject) => {
    const server = sshServers.find(s => s.id === project.serverId)
    if (!server) {
      setError('No SSH server for this project')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const raw = await sshService.exec(server, `cat "${project.path}/.vibk/tickets.json" 2>/dev/null || echo "[]"`)
      const parsed = JSON.parse(raw.trim())
      setTickets(Array.isArray(parsed) ? parsed : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tickets')
    } finally {
      setLoading(false)
    }
  }, [sshServers])

  const handleRefresh = useCallback(async () => {
    if (!selectedProject) return
    setRefreshing(true)
    await loadTickets(selectedProject)
    setRefreshing(false)
  }, [selectedProject, loadTickets])

  const handleSelectProject = useCallback((project: VibkProject) => {
    setSelectedProject(project)
    loadTickets(project)
  }, [loadTickets])

  useEffect(() => {
    if (!selectedProject && activeProjects.length > 0) {
      handleSelectProject(activeProjects[0])
    }
  }, [activeProjects.length]) // eslint-disable-line react-hooks/exhaustive-deps

  const openEdit = useCallback((ticket: Ticket) => {
    setEditingTicket(ticket)
    setEditTitle(ticket.title)
    setEditDescription(ticket.description || '')
    setEditPriority(ticket.priority)
    setEditStatus(ticket.status)
  }, [])

  const saveTicket = useCallback(async () => {
    if (!editingTicket || !selectedProject) return
    const server = sshServers.find(s => s.id === selectedProject.serverId)
    if (!server) return

    setSaving(true)
    try {
      const updated = tickets.map(t =>
        t.id === editingTicket.id
          ? { ...t, title: editTitle, description: editDescription || undefined, priority: editPriority, status: editStatus }
          : t
      )
      const json = JSON.stringify(updated, null, 2)
      const escaped = json.replace(/'/g, "'\\''")
      await sshService.exec(server, `echo '${escaped}' > "${selectedProject.path}/.vibk/tickets.json"`)
      setTickets(updated)
      setEditingTicket(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }, [editingTicket, selectedProject, sshServers, tickets, editTitle, editDescription, editPriority, editStatus])

  const grouped = STATUS_ORDER.map(status => ({
    status,
    tickets: tickets.filter(t => t.status === status)
  })).filter(g => g.tickets.length > 0)

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Project selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.projectBar}>
        {activeProjects.map(p => (
          <TouchableOpacity
            key={p.id}
            style={[styles.projectChip, selectedProject?.id === p.id && styles.projectChipActive]}
            onPress={() => handleSelectProject(p)}
          >
            <Text style={[styles.projectChipText, selectedProject?.id === p.id && styles.projectChipTextActive]}>
              {p.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator color="#7aa2f7" size="large" />
        </View>
      ) : error && tickets.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : activeProjects.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.muted}>No projects synced</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#7aa2f7" />}
        >
          {grouped.map(group => (
            <View key={group.status} style={styles.group}>
              <View style={styles.groupHeader}>
                <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[group.status] }]} />
                <Text style={styles.groupTitle}>{STATUS_LABELS[group.status]}</Text>
                <Text style={styles.groupCount}>{group.tickets.length}</Text>
              </View>
              {group.tickets.map(ticket => (
                <TouchableOpacity key={ticket.id} style={styles.ticketCard} onPress={() => openEdit(ticket)}>
                  <View style={styles.ticketRow}>
                    <Text style={styles.ticketTitle} numberOfLines={3}>{ticket.title}</Text>
                    <PriorityBadge priority={ticket.priority} />
                  </View>
                  {ticket.description ? (
                    <Text style={styles.ticketDesc} numberOfLines={2}>{ticket.description}</Text>
                  ) : null}
                </TouchableOpacity>
              ))}
            </View>
          ))}
          {tickets.length === 0 && (
            <View style={styles.center}>
              <Text style={styles.muted}>No tickets</Text>
            </View>
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* Edit Modal */}
      <Modal visible={!!editingTicket} transparent animationType="slide" onRequestClose={() => setEditingTicket(null)}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setEditingTicket(null)}>
          <View style={styles.editSheet} onStartShouldSetResponder={() => true}>
            <Text style={styles.editLabel}>Title</Text>
            <TextInput
              style={styles.editInput}
              value={editTitle}
              onChangeText={setEditTitle}
              placeholderTextColor="#565f89"
              multiline
            />

            <Text style={styles.editLabel}>Description</Text>
            <TextInput
              style={[styles.editInput, { minHeight: 80 }]}
              value={editDescription}
              onChangeText={setEditDescription}
              placeholderTextColor="#565f89"
              placeholder="Optional..."
              multiline
            />

            <Text style={styles.editLabel}>Priority</Text>
            <View style={styles.chipRow}>
              {(['high', 'medium', 'low'] as TicketPriority[]).map(p => (
                <TouchableOpacity
                  key={p}
                  style={[styles.chip, editPriority === p && { backgroundColor: PRIORITY_COLORS[p] }]}
                  onPress={() => setEditPriority(p)}
                >
                  <Text style={[styles.chipText, editPriority === p && { color: '#1a1b26' }]}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.editLabel}>Status</Text>
            <View style={styles.chipRow}>
              {STATUS_ORDER.map(s => (
                <TouchableOpacity
                  key={s}
                  style={[styles.chip, editStatus === s && { backgroundColor: STATUS_COLORS[s] }]}
                  onPress={() => setEditStatus(s)}
                >
                  <Text style={[styles.chipText, editStatus === s && { color: '#1a1b26' }]}>{STATUS_LABELS[s]}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.editActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditingTicket(null)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={saveTicket} disabled={saving}>
                {saving ? (
                  <ActivityIndicator color="#1a1b26" size="small" />
                ) : (
                  <Text style={styles.saveBtnText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1b26' },
  projectBar: {
    flexGrow: 0,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#24283b',
    borderBottomWidth: 1,
    borderBottomColor: '#3b4261'
  },
  projectChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: '#292e42',
    borderRadius: 16,
    marginRight: 8
  },
  projectChipActive: { backgroundColor: '#7aa2f7' },
  projectChipText: { color: '#c0caf5', fontSize: 13 },
  projectChipTextActive: { color: '#1a1b26', fontWeight: '600' },
  content: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  muted: { color: '#565f89', fontSize: 14 },
  errorText: { color: '#f7768e', fontSize: 14 },
  group: { marginTop: 12, marginHorizontal: 12 },
  groupHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  groupTitle: { color: '#c0caf5', fontSize: 14, fontWeight: '600', flex: 1 },
  groupCount: { color: '#565f89', fontSize: 12 },
  ticketCard: {
    backgroundColor: '#292e42',
    borderRadius: 8,
    padding: 12,
    marginBottom: 6
  },
  ticketRow: { flexDirection: 'row', alignItems: 'flex-start' },
  ticketTitle: { color: '#c0caf5', fontSize: 14, flex: 1, marginRight: 8 },
  ticketDesc: { color: '#565f89', fontSize: 12, marginTop: 4 },
  priorityBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  priorityText: { fontSize: 10, fontWeight: '700' },
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  editSheet: {
    backgroundColor: '#24283b',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    paddingBottom: 32,
    maxHeight: '80%'
  },
  editLabel: { color: '#565f89', fontSize: 12, marginBottom: 4, marginTop: 12 },
  editInput: {
    backgroundColor: '#1a1b26',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3b4261',
    color: '#c0caf5',
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  chipRow: { flexDirection: 'row', gap: 6, marginTop: 4 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#292e42',
    borderRadius: 6
  },
  chipText: { color: '#c0caf5', fontSize: 13 },
  editActions: { flexDirection: 'row', marginTop: 20, gap: 10 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#292e42',
    borderRadius: 8,
    alignItems: 'center'
  },
  cancelBtnText: { color: '#c0caf5', fontSize: 15, fontWeight: '500' },
  saveBtn: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#7aa2f7',
    borderRadius: 8,
    alignItems: 'center'
  },
  saveBtnText: { color: '#1a1b26', fontSize: 15, fontWeight: '600' }
})
