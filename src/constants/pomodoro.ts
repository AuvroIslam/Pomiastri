import { PomodoroPhase, SessionSettings } from '@/types';

export const DEFAULT_SESSION_SETTINGS: SessionSettings = {
  focusDuration: 25 * 60,       // 25 min
  shortBreakDuration: 5 * 60,   // 5 min
  longBreakDuration: 15 * 60,   // 15 min
};

// After this many focus phases, trigger a long break
export const LONG_BREAK_INTERVAL = 4;

export const PHASE_LABELS: Record<PomodoroPhase, string> = {
  focus: 'Focus',
  shortBreak: 'Short Break',
  longBreak: 'Long Break',
};

export const PHASE_EMOJI: Record<PomodoroPhase, string> = {
  focus: '🎯',
  shortBreak: '☕',
  longBreak: '🌿',
};

export function getNextPhase(
  currentPhase: PomodoroPhase,
  phaseCount: number
): PomodoroPhase {
  if (currentPhase === 'focus') {
    const isLongBreak = phaseCount % LONG_BREAK_INTERVAL === 0;
    return isLongBreak ? 'longBreak' : 'shortBreak';
  }
  return 'focus';
}

export function getPhaseDuration(
  phase: PomodoroPhase,
  settings: SessionSettings
): number {
  switch (phase) {
    case 'focus':
      return settings.focusDuration;
    case 'shortBreak':
      return settings.shortBreakDuration;
    case 'longBreak':
      return settings.longBreakDuration;
  }
}
