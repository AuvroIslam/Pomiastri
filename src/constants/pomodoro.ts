import { PomodoroPhase, SessionSettings } from '@/types';

export const DEFAULT_SESSION_SETTINGS: SessionSettings = {
  focusDuration: 25 * 60,
  shortBreakDuration: 5 * 60,
  longBreakDuration: 15 * 60,
};

export const LONG_BREAK_INTERVAL = 4;

// F1-themed phase labels
export const PHASE_LABELS: Record<PomodoroPhase, string> = {
  focus: 'RACE LAP',
  shortBreak: 'PIT STOP',
  longBreak: 'SAFETY CAR',
};

export const PHASE_LABEL_SHORT: Record<PomodoroPhase, string> = {
  focus: 'LAP',
  shortBreak: 'PIT',
  longBreak: 'SC',
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
    case 'focus': return settings.focusDuration;
    case 'shortBreak': return settings.shortBreakDuration;
    case 'longBreak': return settings.longBreakDuration;
  }
}
