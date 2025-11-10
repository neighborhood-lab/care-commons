/**
 * Demo Session Manager Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DemoSessionManager } from '../demo-session-manager';
import { resetDemoStateStore } from '../demo-state-store';
import { DemoSnapshot, DemoPersona } from '../types';

describe('DemoSessionManager', () => {
  let manager: DemoSessionManager;
  let mockSnapshot: DemoSnapshot;

  beforeEach(() => {
    // Reset state store before each test
    resetDemoStateStore();
    
    manager = new DemoSessionManager();
    
    // Create mock snapshot
    const mockPersonas: DemoPersona[] = [
      {
        id: 'persona-1',
        type: 'CAREGIVER',
        name: 'Maria Rodriguez',
        email: 'maria@demo.example',
        role: 'CNA',
        organizationId: 'org-1',
        branchId: 'branch-1',
        permissions: ['visits:read', 'visits:update']
      },
      {
        id: 'persona-2',
        type: 'COORDINATOR_FIELD',
        name: 'Sarah Kim',
        email: 'sarah@demo.example',
        role: 'Field Coordinator',
        organizationId: 'org-1',
        branchId: 'branch-1',
        permissions: ['visits:*', 'caregivers:*']
      }
    ];

    mockSnapshot = {
      organizationId: 'org-1',
      branchId: 'branch-1',
      baseTime: new Date('2025-01-05T08:00:00Z'),
      caregiverIds: ['cg-1', 'cg-2'],
      clientIds: ['cl-1', 'cl-2'],
      coordinatorIds: ['coord-1'],
      visitIds: ['visit-1', 'visit-2'],
      personas: mockPersonas
    };
  });

  afterEach(() => {
    resetDemoStateStore();
  });

  describe('createSession', () => {
    it('should create a new demo session', async () => {
      const session = await manager.createSession('user-1', mockSnapshot);

      expect(session.id).toBeDefined();
      expect(session.userId).toBe('user-1');
      expect(session.organizationId).toBe('org-1');
      expect(session.branchId).toBe('branch-1');
      expect(session.currentPersona.type).toBe('CAREGIVER');
      expect(session.availablePersonas).toHaveLength(2);
      expect(session.state.events).toHaveLength(0);
      expect(session.isActive).toBe(true);
    });

    it('should set initial persona based on options', async () => {
      const session = await manager.createSession('user-1', mockSnapshot, {
        initialPersonaType: 'COORDINATOR_FIELD'
      });

      expect(session.currentPersona.type).toBe('COORDINATOR_FIELD');
      expect(session.currentPersona.name).toBe('Sarah Kim');
    });

    it('should set custom TTL', async () => {
      const oneHour = 60 * 60 * 1000;
      const session = await manager.createSession('user-1', mockSnapshot, {
        ttl: oneHour
      });

      const expectedExpiry = new Date(session.createdAt.getTime() + oneHour);
      expect(session.expiresAt.getTime()).toBeCloseTo(expectedExpiry.getTime(), -2);
    });
  });

  describe('getSession', () => {
    it('should retrieve an existing session', async () => {
      const created = await manager.createSession('user-1', mockSnapshot);
      const retrieved = manager.getSession(created.id);

      expect(retrieved.id).toBe(created.id);
      expect(retrieved.userId).toBe('user-1');
    });

    it('should throw error for non-existent session', () => {
      expect(() => {
        manager.getSession('non-existent');
      }).toThrow('Demo session not found');
    });
  });

  describe('switchPersona', () => {
    it('should switch to different persona', async () => {
      const session = await manager.createSession('user-1', mockSnapshot);
      expect(session.currentPersona.type).toBe('CAREGIVER');

      const updated = manager.switchPersona(session.id, 'COORDINATOR_FIELD');
      expect(updated.currentPersona.type).toBe('COORDINATOR_FIELD');
      expect(updated.currentPersona.name).toBe('Sarah Kim');
    });

    it('should throw error for invalid persona type', async () => {
      const session = await manager.createSession('user-1', mockSnapshot);

      expect(() => {
        manager.switchPersona(session.id, 'ADMINISTRATOR');
      }).toThrow('Demo persona not found');
    });
  });

  describe('addEvent', () => {
    it('should add VISIT_CLOCK_IN event', async () => {
      const session = await manager.createSession('user-1', mockSnapshot);
      
      const updated = manager.addEvent(session.id, 'VISIT_CLOCK_IN', {
        visitId: 'visit-1',
        location: { latitude: 32.7767, longitude: -96.7970, accuracy: 10 }
      });

      expect(updated.state.events).toHaveLength(1);
      expect(updated.state.events[0]?.type).toBe('VISIT_CLOCK_IN');
      expect(updated.state.modifications.visits['visit-1']).toBeDefined();
      expect(updated.state.modifications.visits['visit-1']?.status).toBe('IN_PROGRESS');
      expect(updated.state.modifications.visits['visit-1']?.actualStartTime).toBeDefined();
    });

    it('should add VISIT_CLOCK_OUT event', async () => {
      const session = await manager.createSession('user-1', mockSnapshot);
      
      // Clock in first
      manager.addEvent(session.id, 'VISIT_CLOCK_IN', {
        visitId: 'visit-1',
        location: { latitude: 32.7767, longitude: -96.7970, accuracy: 10 }
      });

      // Clock out
      const updated = manager.addEvent(session.id, 'VISIT_CLOCK_OUT', {
        visitId: 'visit-1'
      });

      expect(updated.state.events).toHaveLength(2);
      expect(updated.state.modifications.visits['visit-1']?.status).toBe('COMPLETED');
      expect(updated.state.modifications.visits['visit-1']?.actualEndTime).toBeDefined();
    });

    it('should add TASK_COMPLETE event', async () => {
      const session = await manager.createSession('user-1', mockSnapshot);
      
      const updated = manager.addEvent(session.id, 'TASK_COMPLETE', {
        taskId: 'task-1'
      });

      expect(updated.state.modifications.tasks['task-1']).toBeDefined();
      expect(updated.state.modifications.tasks['task-1']?.status).toBe('COMPLETED');
      expect(updated.state.modifications.tasks['task-1']?.completedBy).toBe('persona-1');
    });

    it('should add NOTE_ADDED event', async () => {
      const session = await manager.createSession('user-1', mockSnapshot);
      
      const updated = manager.addEvent(session.id, 'NOTE_ADDED', {
        visitId: 'visit-1',
        content: 'Client was in good spirits today'
      });

      const notes = Object.values(updated.state.modifications.notes);
      expect(notes).toHaveLength(1);
      expect(notes[0]?.content).toBe('Client was in good spirits today');
      expect(notes[0]?.visitId).toBe('visit-1');
    });
  });

  describe('resetSession', () => {
    it('should clear all modifications', async () => {
      const session = await manager.createSession('user-1', mockSnapshot);
      
      // Add some events
      manager.addEvent(session.id, 'VISIT_CLOCK_IN', {
        visitId: 'visit-1',
        location: { latitude: 32.7767, longitude: -96.7970, accuracy: 10 }
      });
      manager.addEvent(session.id, 'TASK_COMPLETE', { taskId: 'task-1' });
      manager.addEvent(session.id, 'NOTE_ADDED', { visitId: 'visit-1', content: 'Test note' });

      let retrieved = manager.getSession(session.id);
      expect(retrieved.state.events).toHaveLength(3);

      // Reset
      const reset = manager.resetSession(session.id);
      expect(reset.state.events).toHaveLength(0);
      expect(Object.keys(reset.state.modifications.visits)).toHaveLength(0);
      expect(Object.keys(reset.state.modifications.tasks)).toHaveLength(0);
      expect(Object.keys(reset.state.modifications.notes)).toHaveLength(0);
    });
  });

  describe('advanceTime', () => {
    it('should advance simulated time', async () => {
      const session = await manager.createSession('user-1', mockSnapshot);
      const initialTime = session.state.currentTime;

      const updated = manager.advanceTime(session.id, 7); // Advance 7 days

      const expectedTime = new Date(initialTime);
      expectedTime.setDate(expectedTime.getDate() + 7);

      expect(updated.state.currentTime.getTime()).toBe(expectedTime.getTime());
      expect(updated.state.events[0]?.type).toBe('TIME_ADVANCED');
    });
  });

  describe('endSession', () => {
    it('should mark session as inactive', async () => {
      const session = await manager.createSession('user-1', mockSnapshot);
      expect(session.isActive).toBe(true);

      manager.endSession(session.id);

      const retrieved = manager.getSession(session.id);
      expect(retrieved.isActive).toBe(false);
    });
  });

  describe('deleteSession', () => {
    it('should remove session from store', async () => {
      const session = await manager.createSession('user-1', mockSnapshot);
      expect(manager.getSession(session.id)).toBeDefined();

      manager.deleteSession(session.id);

      expect(() => {
        manager.getSession(session.id);
      }).toThrow('Demo session not found');
    });
  });

  describe('stats', () => {
    it('should return session statistics', async () => {
      await manager.createSession('user-1', mockSnapshot);
      await manager.createSession('user-2', mockSnapshot);

      const stats = manager.getStats();
      expect(stats.totalSessions).toBe(2);
      expect(stats.activeSessions).toBe(2);
    });
  });
});
