"use client";

import { useState, useEffect } from "react";
import { Calendar, RefreshCw, ExternalLink, Clock, Users, Video } from "lucide-react";

interface CalendlyLink {
  id: string;
  name: string;
  slug: string;
  url: string;
  duration: number;
  description: string;
  active: boolean;
  kind: string;
  color: string;
}

interface CalendlyUser {
  name: string;
  email: string;
  timezone: string;
}

export default function CalendlySettings() {
  const [calendlyLinks, setCalendlyLinks] = useState<CalendlyLink[]>([]);
  const [calendlyUser, setCalendlyUser] = useState<CalendlyUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const fetchCalendlyData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/pipeline/calendly');
      const data = await res.json();
      
      if (data.success) {
        setCalendlyLinks(data.links);
        setCalendlyUser(data.user);
      } else {
        setError(data.error || 'Failed to fetch Calendly data');
      }
    } catch (err) {
      setError('Failed to connect to Calendly API');
      console.error('Calendly fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendlyData();
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    await fetchCalendlyData();
    setSyncing(false);
  };

  const getKindIcon = (kind: string) => {
    switch (kind) {
      case 'solo':
        return <Users className="w-4 h-4" />;
      case 'group':
        return <Users className="w-4 h-4" />;
      case 'round_robin':
        return <RefreshCw className="w-4 h-4" />;
      default:
        return <Video className="w-4 h-4" />;
    }
  };

  const getKindLabel = (kind: string) => {
    switch (kind) {
      case 'solo':
        return 'One-on-One';
      case 'group':
        return 'Group';
      case 'round_robin':
        return 'Round Robin';
      default:
        return kind;
    }
  };

  return (
    <div className="bg-[#1E293B] rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#006BFF] rounded-lg flex items-center justify-center">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Calendly Event Types</h3>
            {calendlyUser && (
              <p className="text-sm text-slate-400">
                Connected as {calendlyUser.name} • {calendlyUser.timezone}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center gap-2 px-4 py-2 bg-[#0F172A] hover:bg-[#1E293B] border border-[#334155] rounded-lg text-sm text-white transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing...' : 'Sync Events'}
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
          <p className="text-red-400/70 text-xs mt-1">
            Make sure CALENDLY_API_KEY is set in your environment variables.
          </p>
        </div>
      )}

      {/* Loading State */}
      {loading && !error && (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3 text-slate-400">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span>Loading Calendly events...</span>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && calendlyLinks.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No event types found</p>
          <p className="text-slate-500 text-sm mt-1">
            Create event types in your Calendly dashboard
          </p>
          <a
            href="https://calendly.com/event_types"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-4 text-cyan-400 hover:text-cyan-300 text-sm"
          >
            Open Calendly <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      )}

      {/* Event Types List */}
      {!loading && !error && calendlyLinks.length > 0 && (
        <div className="space-y-3">
          {calendlyLinks.map((link) => (
            <div
              key={link.id}
              className="flex items-center justify-between p-4 bg-[#0F172A] rounded-lg border border-[#334155] hover:border-[#475569] transition-colors"
            >
              <div className="flex items-center gap-4">
                {/* Color indicator */}
                <div
                  className="w-1 h-12 rounded-full"
                  style={{ backgroundColor: link.color || '#0EA5E9' }}
                />
                
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-white font-medium">{link.name}</p>
                    {!link.active && (
                      <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded">
                        Inactive
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="flex items-center gap-1 text-sm text-slate-400">
                      <Clock className="w-3 h-3" />
                      {link.duration} min
                    </span>
                    <span className="flex items-center gap-1 text-sm text-slate-400">
                      {getKindIcon(link.kind)}
                      {getKindLabel(link.kind)}
                    </span>
                  </div>
                  {link.description && (
                    <p className="text-xs text-slate-500 mt-1 max-w-md truncate">
                      {link.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigator.clipboard.writeText(link.url)}
                  className="px-3 py-1.5 bg-[#1E293B] hover:bg-[#334155] text-slate-300 text-sm rounded transition-colors"
                >
                  Copy Link
                </button>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 text-sm rounded transition-colors"
                >
                  Open <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer with Calendly link */}
      {!loading && !error && calendlyLinks.length > 0 && (
        <div className="mt-6 pt-4 border-t border-[#334155]">
          <a
            href="https://calendly.com/event_types"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-300 transition-colors"
          >
            Manage event types in Calendly <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      )}
    </div>
  );
}