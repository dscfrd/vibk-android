import React, { useState, useCallback, useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useSync } from '../contexts/SyncContext'
import sshService from '../services/ssh-service'
import type { VibkProject } from '../shared/project-types'
import type { SshServer } from '../shared/server-types'
import type { PlanSection, PlanItem } from '../shared/vibk-types'

function parsePlanMarkdown(raw: string): PlanSection[] {
  const sections: PlanSection[] = []
  let current: PlanSection | null = null
  let itemId = 0

  for (const line of raw.split('\n')) {
    const headerMatch = line.match(/^(#{1,4})\s+(.+)/)
    if (headerMatch) {
      current = {
        id: `s-${sections.length}`,
        title: headerMatch[2].trim(),
        level: headerMatch[1].length,
        items: []
      }
      sections.push(current)
      continue
    }

    const itemMatch = line.match(/^(\s*)- \[([ xX])\]\s+(.+)/)
    if (itemMatch && current) {
      current.items.push({
        id: `i-${itemId++}`,
        text: itemMatch[3].trim(),
        checked: itemMatch[2] !== ' ',
        indent: Math.floor(itemMatch[1].length / 2)
      })
    }
  }

  return sections
}

function getSectionProgress(section: PlanSection): { done: number; total: number } {
  const total = section.items.length
  const done = section.items.filter(i => i.checked).length
  return { done, total }
}

function SectionView({ section }: { section: PlanSection }): React.JSX.Element {
  const [expanded, setExpanded] = useState(section.items.some(i => !i.checked))
  const { done, total } = getSectionProgress(section)
  const pct = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <View style={styles.section}>
      <TouchableOpacity style={styles.sectionHeader} onPress={() => setExpanded(!expanded)}>
        <Text style={styles.sectionTitle}>{expanded ? '▾' : '▸'} {section.title}</Text>
        {total > 0 && (
          <View style={styles.progressRow}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${pct}%` }]} />
            </View>
            <Text style={styles.progressText}>{done}/{total}</Text>
          </View>
        )}
      </TouchableOpacity>
      {expanded && section.items.map(item => (
        <ItemView key={item.id} item={item} />
      ))}
    </View>
  )
}

function ItemView({ item }: { item: PlanItem }): React.JSX.Element {
  return (
    <View style={[styles.item, { paddingLeft: 16 + item.indent * 16 }]}>
      <Text style={[styles.checkbox, item.checked && styles.checkboxDone]}>
        {item.checked ? '☑' : '☐'}
      </Text>
      <Text style={[styles.itemText, item.checked && styles.itemTextDone]} numberOfLines={2}>
        {item.text}
      </Text>
    </View>
  )
}

export function PlanScreen(): React.JSX.Element {
  const { projects, sshServers } = useSync()
  const [selectedProject, setSelectedProject] = useState<VibkProject | null>(null)
  const [sections, setSections] = useState<PlanSection[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const activeProjects = projects.filter(p => !p.archived)

  const loadPlan = useCallback(async (project: VibkProject) => {
    const server = sshServers.find(s => s.id === project.serverId)
    if (!server) {
      setError('No SSH server for this project')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const raw = await sshService.exec(server, `cat "${project.path}/.vibk/plan.md" 2>/dev/null || echo ""`)
      if (!raw.trim()) {
        setSections([])
        setError('No plan found')
      } else {
        setSections(parsePlanMarkdown(raw))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load plan')
    } finally {
      setLoading(false)
    }
  }, [sshServers])

  const handleRefresh = useCallback(async () => {
    if (!selectedProject) return
    setRefreshing(true)
    await loadPlan(selectedProject)
    setRefreshing(false)
  }, [selectedProject, loadPlan])

  const handleSelectProject = useCallback((project: VibkProject) => {
    setSelectedProject(project)
    loadPlan(project)
  }, [loadPlan])

  useEffect(() => {
    if (!selectedProject && activeProjects.length > 0) {
      handleSelectProject(activeProjects[0])
    }
  }, [activeProjects.length]) // eslint-disable-line react-hooks/exhaustive-deps

  const totalItems = sections.reduce((acc, s) => acc + s.items.length, 0)
  const doneItems = sections.reduce((acc, s) => acc + s.items.filter(i => i.checked).length, 0)
  const overallPct = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0

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

      {/* Overall progress */}
      {sections.length > 0 && (
        <View style={styles.overallProgress}>
          <View style={styles.overallBar}>
            <View style={[styles.overallFill, { width: `${overallPct}%` }]} />
          </View>
          <Text style={styles.overallText}>{overallPct}% ({doneItems}/{totalItems})</Text>
        </View>
      )}

      {/* Plan content */}
      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator color="#7aa2f7" size="large" />
        </View>
      ) : error && sections.length === 0 ? (
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
          {sections.map(s => (
            <SectionView key={s.id} section={s} />
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
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
  overallProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#24283b'
  },
  overallBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#3b4261',
    borderRadius: 3,
    marginRight: 10,
    overflow: 'hidden'
  },
  overallFill: { height: 6, backgroundColor: '#9ece6a', borderRadius: 3 },
  overallText: { color: '#9ece6a', fontSize: 12, fontWeight: '600', minWidth: 80, textAlign: 'right' },
  content: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  muted: { color: '#565f89', fontSize: 14 },
  errorText: { color: '#f7768e', fontSize: 14 },
  section: { marginTop: 8, marginHorizontal: 12 },
  sectionHeader: {
    backgroundColor: '#292e42',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8
  },
  sectionTitle: { color: '#c0caf5', fontSize: 15, fontWeight: '600' },
  progressRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#3b4261',
    borderRadius: 2,
    marginRight: 8,
    overflow: 'hidden'
  },
  progressFill: { height: 4, backgroundColor: '#7aa2f7', borderRadius: 2 },
  progressText: { color: '#565f89', fontSize: 11, minWidth: 30, textAlign: 'right' },
  item: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 4 },
  checkbox: { color: '#565f89', fontSize: 16, marginRight: 8, marginTop: 1 },
  checkboxDone: { color: '#9ece6a' },
  itemText: { color: '#c0caf5', fontSize: 14, flex: 1 },
  itemTextDone: { color: '#565f89', textDecorationLine: 'line-through' }
})
