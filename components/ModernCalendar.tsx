"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { Loader, MapPin, CalendarDays, Clock, Users, MonitorPlay, UserCheck, CheckCircle2, RefreshCw, AlertCircle } from 'lucide-react';

export interface Batch {
  CalendarID: number;
  Title: string;
  TrainingType: string;
  StartDate: string;
  EndDate: string;
  TrainerName: string;
  Location: string;
  MaxParticipants: number;
  CurrentEnrolled: number;
  ColorStatus: string;
  HolidayFlag?: boolean;
  Status?: string;
}

interface ModernCalendarProps {
  mode: 'CLASSROOM' | 'ONLINE';
  selectionMode?: boolean;
  selectedCourse?: string;
  selectedBatchId?: number;
  onSelectBatch?: (batch: Batch) => void;
}

// ── Training type filters ─────────────────────────────────────────────────────
// These cover ALL possible values the DB may store (human-readable or code)
const CLASSROOM_TYPES = new Set([
  'classroom training',
  'classroom',
  'site training',
  'site',
  'cilt',           // Yokogawa code: Classroom Instructor-Led Training
  'offline training',
  'offline',
]);

const ONLINE_TYPES = new Set([
  'online training',
  'online',
  'vilt',           // Virtual Instructor-Led Training
  'virtual',
  'elearning',
  'e-learning',
  'e learning',
]);

function matchesMode(trainingType: string, mode: 'CLASSROOM' | 'ONLINE'): boolean {
  const lower = (trainingType || '').toLowerCase().trim();
  return mode === 'CLASSROOM' ? CLASSROOM_TYPES.has(lower) : ONLINE_TYPES.has(lower);
}

/**
 * Fuzzy course match: returns true if the batch title contains the selected course
 * string, or vice versa (handles partial matches, different capitalisation).
 */
function matchesCourse(batchTitle: string, selectedCourse: string): boolean {
  if (!selectedCourse) return true;
  const a = batchTitle.toLowerCase().trim();
  const b = selectedCourse.toLowerCase().trim();
  return a.includes(b) || b.includes(a) || a === b;
}

export default function ModernCalendar({
  mode,
  selectionMode = false,
  selectedCourse,
  selectedBatchId,
  onSelectBatch,
}: ModernCalendarProps) {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const fetchCalendar = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch('/api/calendar', { cache: 'no-store' });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.message || `HTTP ${res.status}`);
      }
      const data = await res.json();
      if (data.success && Array.isArray(data.calendar)) {
        let filtered: Batch[] = data.calendar;

        // Remove holidays
        filtered = filtered.filter((b) => !b.HolidayFlag);

        // Filter by training mode (using normalised set lookup)
        filtered = filtered.filter((b) => matchesMode(b.TrainingType, mode));

        // In selection mode, further filter by course (fuzzy)
        if (selectionMode && selectedCourse) {
          filtered = filtered.filter((b) => matchesCourse(b.Title, selectedCourse));
        }

        setBatches(filtered);
        setLastFetched(new Date());
      } else if (!data.success) {
        setError(data.message || 'Failed to load calendar');
      }
    } catch (e: any) {
      setError(e.message || 'Network error');
    } finally {
      setLoading(false);
    }
  }, [mode, selectionMode, selectedCourse]);

  // ── Fetch on mount and when filters change — NO auto-polling ─────────────
  // Polling was removed because it caused unnecessary re-renders every 10s,
  // which visually cleared the selection highlight during interaction.
  useEffect(() => {
    setLoading(true);
    fetchCalendar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, selectionMode, selectedCourse]);

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader className="animate-spin text-blue-600" size={40} />
        <p className="text-slate-500 text-sm">Loading training batches…</p>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="bg-red-50 border-2 border-dashed border-red-200 rounded-2xl p-10 text-center">
        <AlertCircle className="mx-auto text-red-400 mb-4" size={48} />
        <h3 className="text-xl font-bold text-red-700">Unable to Load Batches</h3>
        <p className="text-red-500 mt-2 text-sm">{error}</p>
        <button
          onClick={() => { setLoading(true); fetchCalendar(); }}
          className="mt-4 flex items-center gap-2 mx-auto px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition"
        >
          <RefreshCw size={16} /> Retry
        </button>
      </div>
    );
  }

  // ── No Batches ────────────────────────────────────────────────────────────
  if (batches.length === 0) {
    return (
      <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center">
        <CalendarDays className="mx-auto text-slate-300 mb-4" size={48} />
        <h3 className="text-xl font-bold text-slate-600">No Batches Available</h3>
        <p className="text-slate-500 mt-2">
          {selectionMode && selectedCourse
            ? `No scheduled batches found for "${selectedCourse}" in ${mode === 'CLASSROOM' ? 'Classroom' : 'Online'} mode.`
            : `There are currently no scheduled batches for this category.`}
        </p>
        {selectionMode && selectedCourse && (
          <p className="text-slate-400 mt-1 text-sm">
            Try selecting a different course or training mode.
          </p>
        )}
        <button
          onClick={() => { setLoading(true); fetchCalendar(); }}
          className="mt-4 flex items-center gap-2 mx-auto px-4 py-2 bg-slate-600 text-white rounded-lg text-sm font-semibold hover:bg-slate-700 transition"
        >
          <RefreshCw size={16} /> Refresh
        </button>
      </div>
    );
  }

  // ── Batch Cards ───────────────────────────────────────────────────────────
  return (
    <div>
      {/* Header row with refresh button */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-500">
          {batches.length} batch{batches.length !== 1 ? 'es' : ''} found
          {lastFetched && (
            <span className="ml-2 text-slate-400">
              · updated {lastFetched.toLocaleTimeString()}
            </span>
          )}
        </p>
        <button
          onClick={() => { setLoading(true); fetchCalendar(); }}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition px-3 py-1.5 rounded-lg hover:bg-blue-50 border border-slate-200 hover:border-blue-200"
        >
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {batches.map((batch) => {
          const startDate = new Date(batch.StartDate);
          const endDate   = new Date(batch.EndDate);

          // Duration in days (inclusive)
          const diffTime   = Math.abs(endDate.getTime() - startDate.getTime());
          const durationDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

          // Date range string
          const dateStr = `${startDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} – ${endDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`;

          // Seat logic
          const capacity   = batch.MaxParticipants || 0;
          const registered = batch.CurrentEnrolled  || 0;
          const available  = capacity - registered;
          const isFull     = available <= 0;
          const isSelected  = String(selectedBatchId) === String(batch.CalendarID);
          const isCompleted = batch.ColorStatus === 'COMPLETED' || batch.Status === 'COMPLETED';
          const fewSeats    = !isFull && !isCompleted && available <= 3;
          const isSelectable = selectionMode && !isFull && !isCompleted;

          // Status badge config
          let statusConfig = {
            color: 'bg-green-100 text-green-700 border-green-300',
            label: '🟢 Available',
          };
          if (isSelected) {
            statusConfig = { color: 'bg-blue-600 text-white border-blue-700', label: '🔵 Selected' };
          } else if (isCompleted) {
            statusConfig = { color: 'bg-gray-100 text-gray-600 border-gray-300', label: '⚪ Completed' };
          } else if (isFull) {
            statusConfig = { color: 'bg-red-50 text-red-700 border-red-300', label: '🔴 Full' };
          } else if (fewSeats) {
            statusConfig = { color: 'bg-yellow-50 text-yellow-700 border-yellow-300', label: '🟡 Few Seats' };
          }

          return (
            <div
              key={batch.CalendarID}
              id={`batch-card-${batch.CalendarID}`}
              role={isSelectable ? 'button' : undefined}
              tabIndex={isSelectable ? 0 : undefined}
              aria-pressed={isSelected}
              aria-label={isSelectable ? `Select batch: ${batch.Title}` : undefined}
              onClick={() => {
                if (isSelectable && onSelectBatch) {
                  onSelectBatch(batch);
                }
              }}
              onKeyDown={(e) => {
                if (isSelectable && onSelectBatch && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  onSelectBatch(batch);
                }
              }}
              className={[
                'relative rounded-2xl border-2 transition-all duration-200 overflow-hidden bg-white',
                isSelectable
                  ? 'cursor-pointer hover:shadow-xl hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-blue-200'
                  : '',
                isSelected
                  ? 'border-blue-600 shadow-xl ring-4 ring-blue-100 -translate-y-1'
                  : isSelectable
                    ? 'border-slate-200 shadow-sm hover:border-blue-400'
                    : 'border-slate-200 shadow-sm',
                isFull || isCompleted ? 'opacity-75' : '',
              ].filter(Boolean).join(' ')}
            >
              {/* Status Header */}
              <div className={`px-5 py-3 border-b flex justify-between items-center ${statusConfig.color}`}>
                <span className="text-sm font-bold">{statusConfig.label}</span>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-white/40 backdrop-blur-sm border border-white/20">
                  {batch.TrainingType}
                </span>
              </div>

              <div className="p-5">
                <h3 className="text-base font-black text-slate-800 leading-tight mb-4">
                  {batch.Title}
                </h3>

                <div className="space-y-3 mb-5">
                  {/* Dates */}
                  <div className="flex items-start gap-3">
                    <CalendarDays className="text-slate-400 shrink-0 mt-0.5" size={16} />
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Batch Dates</p>
                      <p className="text-sm font-bold text-slate-700">{dateStr}</p>
                    </div>
                  </div>

                  {/* Duration */}
                  <div className="flex items-start gap-3">
                    <Clock className="text-slate-400 shrink-0 mt-0.5" size={16} />
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Duration</p>
                      <p className="text-sm font-bold text-slate-700">{durationDays} Day{durationDays !== 1 ? 's' : ''}</p>
                    </div>
                  </div>

                  {/* Location (Classroom) */}
                  {mode === 'CLASSROOM' && (
                    <div className="flex items-start gap-3">
                      <MapPin className="text-slate-400 shrink-0 mt-0.5" size={16} />
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Location</p>
                        <p className="text-sm font-bold text-slate-700">{batch.Location || 'YTS Facility'}</p>
                      </div>
                    </div>
                  )}

                  {/* Trainer */}
                  <div className="flex items-start gap-3">
                    <MonitorPlay className="text-slate-400 shrink-0 mt-0.5" size={16} />
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Trainer</p>
                      <p className="text-sm font-bold text-slate-700">{batch.TrainerName || 'TBA'}</p>
                    </div>
                  </div>
                </div>

                {/* Availability bar */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="text-slate-400" size={15} />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Seat Availability</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center divide-x divide-slate-200">
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Capacity</p>
                      <p className="text-xl font-black text-slate-700">{capacity}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Registered</p>
                      <p className="text-xl font-black text-slate-700">{registered}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Available</p>
                      <p className={`text-xl font-black ${isFull ? 'text-red-500' : fewSeats ? 'text-yellow-600' : 'text-green-600'}`}>
                        {isFull ? 'FULL' : available}
                      </p>
                    </div>
                  </div>
                  {/* Visual fill bar */}
                  {capacity > 0 && (
                    <div className="mt-3">
                      <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${isFull ? 'bg-red-500' : fewSeats ? 'bg-yellow-500' : 'bg-green-500'}`}
                          style={{ width: `${Math.min(100, (registered / capacity) * 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Selection hint for selectable unselected cards */}
                {selectionMode && isSelectable && !isSelected && (
                  <div className="mt-4 flex items-center justify-center gap-2 text-blue-600 text-sm font-semibold opacity-0 group-hover:opacity-100 transition">
                    <UserCheck size={16} />
                    <span>Click to select</span>
                  </div>
                )}

                {/* Full batch message */}
                {isFull && !isCompleted && (
                  <div className="mt-4 bg-red-50 rounded-xl px-4 py-2 text-center">
                    <p className="text-red-600 text-xs font-bold">This batch is FULL — no seats available</p>
                  </div>
                )}
              </div>

              {/* Selected checkmark */}
              {isSelected && (
                <div className="absolute top-3 right-3 bg-blue-600 text-white p-1.5 rounded-full shadow-md">
                  <CheckCircle2 size={20} />
                </div>
              )}

              {/* Hover overlay (only in selectionMode) */}
              {selectionMode && isSelectable && !isSelected && (
                <div className="absolute inset-0 bg-blue-600/0 hover:bg-blue-600/4 transition-colors pointer-events-none" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
