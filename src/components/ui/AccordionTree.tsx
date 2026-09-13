import { useState, useEffect, useMemo, type ReactNode } from 'react'
import type { BookNode } from '@/types'

export interface TreeNodeItem {
  id: string
  label: string
  type: 'chapter' | 'section' | 'page' | string
  pageNumber: number
  depth: number
  children: TreeNodeItem[]
  rawNode?: BookNode
}

export interface AccordionTreeProps {
  nodes: BookNode[]
  activeNodeId?: string | null
  currentPage?: number
  onNodeSelect: (node: BookNode, pageNumber: number) => void
  searchQuery?: string
  filterType?: 'all' | 'chapter' | 'section'
  style?: React.CSSProperties
  className?: string
}

/**
 * Intelligently builds a tree from flat BookNodes with normalized depth (capped at 2 levels of nesting)
 * to guarantee spacious readability without runaway horizontal compression.
 */
export function buildTreeFromNodes(nodes: BookNode[]): TreeNodeItem[] {
  if (!nodes || nodes.length === 0) return []

  // Check if parent_id is explicitly set
  const hasParentIds = nodes.some((n) => n.parent_id)
  if (hasParentIds) {
    const itemMap = new Map<string, TreeNodeItem>()
    const roots: TreeNodeItem[] = []

    nodes.forEach((n) => {
      itemMap.set(n.id, {
        id: n.id,
        label: n.label,
        type: n.type,
        pageNumber: n.start_position || 1,
        depth: 0,
        children: [],
        rawNode: n,
      })
    })

    nodes.forEach((n) => {
      const item = itemMap.get(n.id)!
      if (n.parent_id && itemMap.has(n.parent_id)) {
        const parent = itemMap.get(n.parent_id)!
        item.depth = Math.min(parent.depth + 1, 2)
        parent.children.push(item)
      } else {
        roots.push(item)
      }
    })

    return roots
  }

  // Check if depth is encoded in node.content JSON
  let hasDepth = false
  const nodesWithDepth = nodes.map((n) => {
    let d = 0
    if (n.content) {
      try {
        const parsed = JSON.parse(n.content)
        if (typeof parsed.depth === 'number') {
          d = parsed.depth
          hasDepth = true
        }
      } catch {}
    }
    return {
      node: n,
      depth: d,
    }
  })

  if (hasDepth) {
    // Determine min depth (often 0 or 1)
    const minDepth = Math.min(...nodesWithDepth.map((x) => x.depth))

    const roots: TreeNodeItem[] = []
    const stack: TreeNodeItem[] = []

    nodesWithDepth.forEach(({ node, depth }) => {
      // Normalize depth relative to minDepth, capped at 2 levels of nesting for clean spacious layout
      const normalizedDepth = Math.min(Math.max(0, depth - minDepth), 2)

      const item: TreeNodeItem = {
        id: node.id,
        label: node.label,
        type: node.type,
        pageNumber: node.start_position || 1,
        depth: normalizedDepth,
        children: [],
        rawNode: node,
      }

      while (stack.length > 0 && stack[stack.length - 1].depth >= normalizedDepth) {
        stack.pop()
      }

      if (stack.length === 0) {
        roots.push(item)
      } else {
        stack[stack.length - 1].children.push(item)
      }

      stack.push(item)
    })

    return roots
  }

  // Sequential Chapter -> Section grouping
  const roots: TreeNodeItem[] = []
  let currentChapter: TreeNodeItem | null = null

  nodes.forEach((node) => {
    const item: TreeNodeItem = {
      id: node.id,
      label: node.label,
      type: node.type,
      pageNumber: node.start_position || 1,
      depth: node.type === 'chapter' ? 0 : 1,
      children: [],
      rawNode: node,
    }

    if (node.type === 'chapter') {
      currentChapter = item
      roots.push(item)
    } else {
      if (currentChapter) {
        currentChapter.children.push(item)
      } else {
        roots.push(item)
      }
    }
  })

  return roots
}

export function AccordionTree({
  nodes,
  activeNodeId,
  currentPage,
  onNodeSelect,
  searchQuery = '',
  filterType = 'all',
  style,
  className = '',
}: AccordionTreeProps) {
  const tree = useMemo(() => buildTreeFromNodes(nodes), [nodes])
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  // Collect all branch IDs for Expand All / Collapse All
  const allBranchIds = useMemo(() => {
    const ids = new Set<string>()
    function collect(items: TreeNodeItem[]) {
      items.forEach((item) => {
        if (item.children.length > 0) {
          ids.add(item.id)
          collect(item.children)
        }
      })
    }
    collect(tree)
    return ids
  }, [tree])

  // Automatically expand the branch holding the active node / current page
  useEffect(() => {
    if (!activeNodeId && !currentPage) return

    const toExpand = new Set<string>()
    function findActive(items: TreeNodeItem[], path: string[]): boolean {
      for (const item of items) {
        const isMatch =
          (activeNodeId && item.id === activeNodeId) ||
          (currentPage && item.pageNumber === currentPage)

        if (isMatch) {
          path.forEach((id) => toExpand.add(id))
          return true
        }

        if (item.children.length > 0) {
          if (findActive(item.children, [...path, item.id])) {
            return true
          }
        }
      }
      return false
    }

    findActive(tree, [])
    if (toExpand.size > 0) {
      setExpandedIds((prev) => new Set([...prev, ...toExpand]))
    }
  }, [tree, activeNodeId, currentPage])

  // When searching, auto-expand branches containing matches
  useEffect(() => {
    if (!searchQuery.trim()) return

    const q = searchQuery.toLowerCase()
    const matchingBranches = new Set<string>()

    function scanMatches(items: TreeNodeItem[], path: string[]): boolean {
      let hasMatchInBranch = false
      for (const item of items) {
        const directMatch = item.label.toLowerCase().includes(q)
        let childMatch = false
        if (item.children.length > 0) {
          childMatch = scanMatches(item.children, [...path, item.id])
        }
        if (directMatch || childMatch) {
          hasMatchInBranch = true
          path.forEach((p) => matchingBranches.add(p))
          if (item.children.length > 0) {
            matchingBranches.add(item.id)
          }
        }
      }
      return hasMatchInBranch
    }

    scanMatches(tree, [])
    if (matchingBranches.size > 0) {
      setExpandedIds((prev) => new Set([...prev, ...matchingBranches]))
    }
  }, [tree, searchQuery])

  const toggleExpand = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleExpandAll = () => {
    setExpandedIds(new Set(allBranchIds))
  }

  const handleCollapseAll = () => {
    setExpandedIds(new Set())
  }

  // Filter items based on search query & filter type
  const filterTree = (items: TreeNodeItem[]): TreeNodeItem[] => {
    return items
      .map((item) => {
        const children = filterTree(item.children)
        const matchesType = filterType === 'all' || item.type === filterType
        const matchesSearch =
          !searchQuery.trim() || item.label.toLowerCase().includes(searchQuery.toLowerCase())

        if (children.length > 0) {
          return { ...item, children }
        }

        if (matchesType && matchesSearch) {
          return { ...item, children: [] }
        }

        return null
      })
      .filter(Boolean) as TreeNodeItem[]
  }

  const displayedTree = useMemo(() => {
    if (!searchQuery.trim() && filterType === 'all') return tree
    return filterTree(tree)
  }, [tree, searchQuery, filterType])

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        direction: 'rtl',
        ...style,
      }}
    >
      {/* Quick Tree Controls: Expand/Collapse All */}
      {allBranchIds.size > 0 && (
        <div
          className="flex items-center justify-between"
          style={{
            padding: 'var(--space-2) var(--space-4)',
            marginBottom: 'var(--space-3)',
            fontSize: '0.82rem',
            color: 'var(--text-muted)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          }}
        >
          <span style={{ fontFamily: 'var(--font-title)' }}>هيكل الفصول والأقسام</span>
          <div className="flex items-center" style={{ gap: 'var(--space-3)' }}>
            <button
              type="button"
              onClick={handleExpandAll}
              className="cursor-pointer"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                fontSize: '0.8rem',
                fontFamily: 'var(--font-body)',
                padding: '3px 8px',
                borderRadius: 'var(--radius-sm)',
                transition: 'color var(--duration-fast), background var(--duration-fast)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--text-primary)'
                e.currentTarget.style.background = 'var(--surface-black-strong)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-secondary)'
                e.currentTarget.style.background = 'transparent'
              }}
            >
              توسيع الكل
            </button>
            <span style={{ color: 'rgba(255,255,255,0.2)' }}>•</span>
            <button
              type="button"
              onClick={handleCollapseAll}
              className="cursor-pointer"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                fontSize: '0.8rem',
                fontFamily: 'var(--font-body)',
                padding: '3px 8px',
                borderRadius: 'var(--radius-sm)',
                transition: 'color var(--duration-fast), background var(--duration-fast)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--text-primary)'
                e.currentTarget.style.background = 'var(--surface-black-strong)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-secondary)'
                e.currentTarget.style.background = 'transparent'
              }}
            >
              طي الكل
            </button>
          </div>
        </div>
      )}

      {/* Tree Nodes List */}
      {displayedTree.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: 'var(--space-8)' }}>
          لا توجد نتائج مطابقة للبحث
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {displayedTree.map((item) => (
            <TreeNodeRow
              key={item.id}
              item={item}
              expandedIds={expandedIds}
              onToggleExpand={toggleExpand}
              activeNodeId={activeNodeId}
              currentPage={currentPage}
              onNodeSelect={onNodeSelect}
              level={0}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function TreeNodeRow({
  item,
  expandedIds,
  onToggleExpand,
  activeNodeId,
  currentPage,
  onNodeSelect,
  level = 0,
}: {
  item: TreeNodeItem
  expandedIds: Set<string>
  onToggleExpand: (id: string, e?: React.MouseEvent) => void
  activeNodeId?: string | null
  currentPage?: number
  onNodeSelect: (node: BookNode, pageNumber: number) => void
  level: number
}) {
  const hasChildren = item.children && item.children.length > 0
  const isExpanded = expandedIds.has(item.id)
  const isChapter = item.type === 'chapter'
  const isActive = activeNodeId === item.id || (currentPage && item.pageNumber === currentPage)

  const handleRowClick = () => {
    if (item.rawNode) {
      onNodeSelect(item.rawNode, item.pageNumber)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
      <div
        className="cursor-pointer group flex items-center justify-between"
        onClick={handleRowClick}
        style={{
          background: isActive
            ? 'var(--surface-red-strong)'
            : isChapter
            ? 'rgba(255, 255, 255, 0.04)'
            : 'transparent',
          borderInlineStart: isActive ? '3px solid var(--red-500)' : '3px solid transparent',
          color: isActive
            ? 'var(--text-primary)'
            : isChapter
            ? 'var(--text-primary)'
            : 'var(--text-secondary)',
          padding: isChapter ? '12px 14px' : '10px 12px',
          borderRadius: 'var(--radius-md)',
          transition: 'background var(--duration-fast), transform 160ms ease',
          gap: 'var(--space-3)',
          userSelect: 'none',
        }}
        onMouseEnter={(e) => {
          if (!isActive) {
            e.currentTarget.style.background = isChapter
              ? 'rgba(255, 255, 255, 0.07)'
              : 'var(--surface-black-strong)'
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            e.currentTarget.style.background = isChapter ? 'rgba(255, 255, 255, 0.04)' : 'transparent'
          }
        }}
      >
        {/* Right side: Chevron (if branch) or subtle bullet, Chapter badge (if chapter), and Full Label */}
        <div className="flex items-center" style={{ gap: '10px', minWidth: 0, flex: 1 }}>
          {hasChildren ? (
            <button
              type="button"
              onClick={(e) => onToggleExpand(item.id, e)}
              className="cursor-pointer flex items-center justify-center flex-shrink-0"
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '6px',
                border: 'none',
                background: 'rgba(255, 255, 255, 0.05)',
                color: isExpanded ? 'var(--text-primary)' : 'var(--text-muted)',
                padding: 0,
                transition: 'background var(--duration-fast), color var(--duration-fast)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.14)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)')}
              title={isExpanded ? 'طي الأقسام' : 'توسيع الأقسام'}
              aria-label={isExpanded ? 'طي الأقسام' : 'توسيع الأقسام'}
            >
              {/* RTL Chevron: points left when closed, rotates 90deg downward when open */}
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  transform: isExpanded ? 'rotate(-90deg)' : 'rotate(0deg)',
                  transition: 'transform 180ms var(--ease-standard)',
                }}
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          ) : (
            <span
              style={{
                width: '5px',
                height: '5px',
                borderRadius: '50%',
                background: isActive ? 'var(--red-400)' : 'rgba(255, 255, 255, 0.2)',
                marginInline: '9px',
                flexShrink: 0,
              }}
            />
          )}

          {/* Chapter Badge (Only shown for chapters to save valuable space) */}
          {isChapter && (
            <span
              style={{
                fontSize: '0.7rem',
                padding: '2px 8px',
                background: 'rgba(165, 30, 41, 0.25)',
                color: 'var(--red-400)',
                borderRadius: '4px',
                flexShrink: 0,
                fontWeight: 600,
                fontFamily: 'var(--font-body)',
              }}
            >
              فصل
            </span>
          )}

          {/* Node Title with full width and clear text */}
          <span
            title={item.label}
            style={{
              fontFamily: isChapter ? 'var(--font-title)' : 'var(--font-body)',
              fontSize: isChapter ? '1.02rem' : '0.92rem',
              fontWeight: isChapter ? 600 : 400,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              lineHeight: 1.5,
              color: isActive ? '#fff' : isChapter ? 'var(--text-primary)' : 'var(--text-secondary)',
            }}
          >
            {item.label}
          </span>
        </div>

        {/* Left side: Page Number Pill */}
        <span
          style={{
            fontFamily: 'var(--font-title)',
            fontSize: '0.78rem',
            color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
            padding: '3px 9px',
            borderRadius: 'var(--radius-pill)',
            background: isActive ? 'rgba(0, 0, 0, 0.35)' : 'rgba(255, 255, 255, 0.04)',
            flexShrink: 0,
            whiteSpace: 'nowrap',
          }}
        >
          ص {item.pageNumber}
        </span>
      </div>

      {/* Nested Children with subtle fixed indent and guiding border */}
      {hasChildren && isExpanded && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            borderInlineStart: '1.5px solid rgba(255, 255, 255, 0.06)',
            marginInlineStart: '16px',
            paddingInlineStart: '8px',
            marginTop: '4px',
            marginBottom: '6px',
            animation: 'pageEnter 160ms var(--ease-standard) both',
          }}
        >
          {item.children.map((child) => (
            <TreeNodeRow
              key={child.id}
              item={child}
              expandedIds={expandedIds}
              onToggleExpand={onToggleExpand}
              activeNodeId={activeNodeId}
              currentPage={currentPage}
              onNodeSelect={onNodeSelect}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}
