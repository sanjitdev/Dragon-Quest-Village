// QuestSystem.ts — Simple quest tracking

import { EventBus, Events } from '../core/EventBus.js';

export interface QuestObjective {
  description: string;
  target: number;
  current: number;
  completed: boolean;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  objectives: QuestObjective[];
  reward: { xp: number; gold: number };
  completed: boolean;
}

const QUEST_DEFINITIONS: Quest[] = [
  {
    id: 'q_forest_clear',
    title: 'Clear the Forest',
    description: 'The Whisperwood is overrun. Defeat 5 goblins.',
    objectives: [{ description: 'Defeat goblins', target: 5, current: 0, completed: false }],
    reward: { xp: 80, gold: 30 },
    completed: false,
  },
  {
    id: 'q_cave_bats',
    title: 'Silence the Caverns',
    description: 'The cave bats are keeping villagers awake. Defeat 4 bats.',
    objectives: [{ description: 'Defeat bats', target: 4, current: 0, completed: false }],
    reward: { xp: 120, gold: 50 },
    completed: false,
  },
  {
    id: 'q_slay_dragon',
    title: 'Slay the Dragon',
    description: 'End the ancient dragon\'s reign of terror.',
    objectives: [{ description: 'Defeat the Dragon Boss', target: 1, current: 0, completed: false }],
    reward: { xp: 1000, gold: 500 },
    completed: false,
  },
];

export class QuestSystem {
  private quests: Map<string, Quest> = new Map();

  constructor() {
    for (const q of QUEST_DEFINITIONS) {
      // Deep clone so multiple instances don't share state
      this.quests.set(q.id, JSON.parse(JSON.stringify(q)) as Quest);
    }
  }

  startQuest(id: string): boolean {
    const q = this.quests.get(id);
    if (!q || q.completed) return false;
    EventBus.emit(Events.QUEST_STARTED, q);
    EventBus.emit(Events.UI_REFRESH);
    return true;
  }

  updateObjective(questId: string, objectiveIndex: number, amount: number = 1): void {
    const q = this.quests.get(questId);
    if (!q || q.completed) return;

    const obj = q.objectives[objectiveIndex];
    if (!obj || obj.completed) return;

    obj.current = Math.min(obj.current + amount, obj.target);
    obj.completed = obj.current >= obj.target;

    EventBus.emit(Events.QUEST_UPDATED, q);
    EventBus.emit(Events.UI_REFRESH);

    if (q.objectives.every(o => o.completed)) {
      this.completeQuest(q);
    }
  }

  private completeQuest(q: Quest): void {
    q.completed = true;
    EventBus.emit(Events.QUEST_COMPLETED, q);
    EventBus.emit(Events.UI_REFRESH);
  }

  getQuest(id: string): Quest | undefined {
    return this.quests.get(id);
  }

  getActiveQuests(): Quest[] {
    return [...this.quests.values()].filter(q => !q.completed);
  }

  getCompletedQuests(): Quest[] {
    return [...this.quests.values()].filter(q => q.completed);
  }
}
