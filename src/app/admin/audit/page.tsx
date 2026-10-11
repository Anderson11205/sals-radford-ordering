'use client'

// Audit log (owner) — every sensitive action recorded
import { useCallback, useEffect, useState } from 'react'
import { Loader2, ChevronLeft, ChevronRight, ScrollText } from 'lucide-react'

interface LogRow {
  id: string
  actorEmail: string
  action: string
  entity: string
  entityId: string | null
  details: string | null
  createdAt: string
}

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<LogRow[]>([])
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/audit?page=${page}`, { cache: 'no-store' })
    const d = await res.json()
    if (d.ok) {
      setLogs(d.logs)
      setPages(d.pages)
    }
    setLoading(false)
  }, [page])

  useEffect(() => {
    let cancelled = false
    async function run() {
      const res = await fetch(`/api/admin/audit?page=${page}`, { cache: 'no-store' }).catch(() => null)
      if (!res || cancelled) return
      const d = await res.json()
      if (cancelled) return
      if (d.ok) {
        setLogs(d.logs)
        setPages(d.pages)
      }
      setLoading(false)
    }
    run()
  }, [page])

  return (
    <div>
      <h2 className="flex items-center gap-2 font-bold">
        <ScrollText className="h-5 w-5 text-[#C20E0E]" aria-hidden /> Audit log
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">Menu changes, order status changes, payment decisions, settings updates, invitations and security events.</p>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-[#C20E0E]" aria-label="Loading audit log" />
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-white">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-3 py-2.5 font-semibold">When</th>
                <th className="px-3 py-2.5 font-semibold">Actor</th>
                <th className="px-3 py-2.5 font-semibold">Action</th>
                <th className="px-3 py-2.5 font-semibold">Entity</th>
                <th className="px-3 py-2.5 font-semibold">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {logs.map((l) => (
                <tr key={l.id}>
                  <td className="whitespace-nowrap px-3 py-2.5 text-xs text-muted-foreground">{new Date(l.createdAt).toLocaleString()}</td>
                  <td className="px-3 py-2.5 text-xs">{l.actorEmail}</td>
                  <td className="px-3 py-2.5">
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold">{l.action}</span>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground">{l.entity}</td>
                  <td className="px-3 py-2.5 text-xs">{l.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Page {page} of {pages}
        </span>
        <div className="flex gap-1">
          <button className="rounded border border-border p-1.5 disabled:opacity-30" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} aria-label="Previous page">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button className="rounded border border-border p-1.5 disabled:opacity-30" disabled={page >= pages} onClick={() => setPage((p) => p + 1)} aria-label="Next page">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
