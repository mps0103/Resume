import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { Resume } from '../types/resume';
import { saveResume } from '../db/resumeStore';

const DEBOUNCE_MS = 500;

export type SaveState = 'idle' | 'pending' | 'saved';

/**
 * Holds the working copy in memory and writes it to SQLite on a debounce.
 * Also flushes when the app backgrounds, because Android can kill the
 * process before a pending timer fires.
 */
export function useResumeDraft(initial: Resume) {
  const [resume, setResume] = useState<Resume>(initial);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef(initial);

  latest.current = resume;

  const flush = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    saveResume(latest.current);
    setSaveState('saved');
  }, []);

  const update = useCallback(
    (mutate: (draft: Resume) => Resume) => {
      setResume(prev => {
        const next = mutate(prev);
        latest.current = next;
        return next;
      });
      setSaveState('pending');
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(flush, DEBOUNCE_MS);
    },
    [flush],
  );

  useEffect(() => {
    const sub = AppState.addEventListener('change', next => {
      if (next !== 'active') flush();
    });
    return () => {
      sub.remove();
      flush();
    };
  }, [flush]);

  return { resume, update, flush, saveState };
}
