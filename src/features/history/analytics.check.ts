// Run without browser or installed dependencies: node --experimental-strip-types src/features/history/analytics.check.ts
import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { SessionExercise, TrainingSession } from '../../types/index.ts';
import { completedSessions, dateKey, exerciseDays, exerciseEntries, exerciseLoad, exerciseVolume, inPeriod, localDate, sessionSetCount, sessionVolume, weeklySessions } from './analytics.ts';
import { toDisplayWeight, toKg } from '../../utils/format.ts';

const exercise: SessionExercise = {
  id: 'press', name: 'Press', status: 'not_completed', elapsedTime: 120,
  sets: [
    { setNumber: 1, targetReps: '10', performedReps: 10, weight: 20, completed: true },
    { setNumber: 2, targetReps: '10', performedReps: 8, weight: 25, completed: true },
    { setNumber: 3, targetReps: '10', performedReps: 10, weight: 100, completed: false },
  ],
};
const session = (id: string, date: string, changes: Partial<TrainingSession> = {}): TrainingSession => ({
  id, workoutId: 'a', workoutName: 'Treino A', cycleId: 'cycle', startedAt: +localDate(date),
  elapsedTime: 300, currentExerciseId: exercise.id, exercises: [exercise], notes: '', status: 'completed', ...changes,
});

test('only completed sets contribute to load, volume and count', () => {
  assert.equal(exerciseLoad(exercise), 25);
  assert.equal(exerciseVolume(exercise), 400);
  assert.equal(sessionVolume(session('a', '2026-09-13')), 400);
  assert.equal(sessionSetCount(session('a', '2026-09-13')), 2);
  assert.equal(exerciseLoad({ ...exercise, sets: [] }), null);
  assert.equal(exerciseVolume({ ...exercise, sets: [] }), 0);
  assert.equal(exerciseLoad({ ...exercise, sets: [{ ...exercise.sets[0], weight: 0 }] }), 0);
});

test('history is filtered and sorted without mutating the store array', () => {
  const history = [session('old', '2026-08-20'), session('active', '2026-09-14', { status: 'in_progress' }), session('new', '2026-09-13')];
  assert.deepEqual(completedSessions(history).map(s => s.id), ['new', 'old']);
  assert.deepEqual(history.map(s => s.id), ['old', 'active', 'new']);
});

test('30 days include today and 29 earlier calendar dates, excluding future dates', () => {
  const now = localDate('2026-09-13');
  const history = ['2026-08-14', '2026-08-15', '2026-09-13', '2026-09-14'].map((d, i) => session(`${i}`, d));
  assert.deepEqual(inPeriod(history, '30d', now).map(s => s.id), ['2', '1']);
});

test('month ranges clamp to the last valid day rather than overflowing', () => {
  const history = [session('outside', '2026-02-27'), session('inside', '2026-02-28')];
  assert.deepEqual(inPeriod(history, '3m', localDate('2026-05-31')).map(s => s.id), ['inside']);
  assert.deepEqual(inPeriod(history, '6m', localDate('2026-08-31')).map(s => s.id), ['inside']);
});

test('daily exercise data combines sessions while preserving the maximum completed load', () => {
  const history = [session('one', '2026-09-13'), session('two', '2026-09-13'), session('old', '2026-09-12')];
  const days = exerciseDays(history, 'press');
  assert.deepEqual(days.map(d => d.date), ['2026-09-12', '2026-09-13']);
  assert.equal(days[1].load, 25);
  assert.equal(days[1].volume, 800);
  assert.equal(days[1].seconds, 240);
  assert.equal(days[1].sessions, 2);
  assert.equal(exerciseEntries(history, 'missing').length, 0);
  assert.deepEqual(exerciseDays([], 'press'), []);
});

test('untouched exercises are not counted as performed', () => {
  const untouched = { ...exercise, elapsedTime: 0, sets: exercise.sets.map(s => ({ ...s, completed: false })) };
  assert.deepEqual(exerciseEntries([session('empty', '2026-09-13', { exercises: [untouched] })], 'press'), []);
});

test('weekly consistency includes empty intervening weeks and starts on Monday', () => {
  const weekly = weeklySessions([session('a', '2026-09-01'), session('b', '2026-09-06'), session('c', '2026-09-14')]);
  assert.deepEqual(weekly.map(w => [w.date, w.count]), [['2026-08-31', 2], ['2026-09-07', 0], ['2026-09-14', 1]]);
  assert.deepEqual(weeklySessions([]), []);
});

test('local date keys and unit conversion preserve the stored kilogram values', () => {
  assert.equal(dateKey(localDate('2026-09-13')), '2026-09-13');
  assert.equal(toDisplayWeight(100, 'kg'), 100);
  assert.equal(toDisplayWeight(100, 'lb'), 220.5);
  assert.ok(Math.abs(toKg(toDisplayWeight(100, 'lb'), 'lb') - 100) < .05);
  assert.equal(exercise.sets[0].weight, 20);
});
