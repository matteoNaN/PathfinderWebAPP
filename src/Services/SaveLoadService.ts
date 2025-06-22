import { CombatState, CombatEntity } from '../Types/Combat';
import { CombatAction } from '../Types/CombatActions';
import eventEmitter from '../Events/misurazioneEventEmitter';

interface SavedEncounter {
  id: string;
  name: string;
  description: string;
  timestamp: number;
  combatState: CombatState;
  actionHistory: CombatAction[];
  version: string;
}

interface EncounterMetadata {
  id: string;
  name: string;
  description: string;
  timestamp: number;
  entityCount: number;
  version: string;
}

class SaveLoadService {
  private readonly STORAGE_KEY = 'dnd-combat-encounters';
  private readonly VERSION = '1.0.0';

  // Save current encounter
  public saveEncounter(
    name: string, 
    description: string, 
    combatState: CombatState, 
    actionHistory: CombatAction[]
  ): string {
    const encounterId = this.generateId();
    
    // Create a clean copy of combat state (remove mesh references)
    const cleanCombatState = this.cleanCombatStateForSave(combatState);
    
    const savedEncounter: SavedEncounter = {
      id: encounterId,
      name,
      description,
      timestamp: Date.now(),
      combatState: cleanCombatState,
      actionHistory: [...actionHistory],
      version: this.VERSION
    };

    try {
      const existingData = this.getStoredEncounters();
      existingData[encounterId] = savedEncounter;
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(existingData));
      
      eventEmitter.emit('encounterSaved', { id: encounterId, name });
      return encounterId;
    } catch (error) {
      console.error('Failed to save encounter:', error);
      throw new Error('Failed to save encounter. Storage may be full.');
    }
  }

  // Load encounter
  public loadEncounter(encounterId: string): SavedEncounter | null {
    try {
      const storedData = this.getStoredEncounters();
      const encounter = storedData[encounterId];
      
      if (!encounter) {
        throw new Error('Encounter not found');
      }

      // Validate version compatibility
      if (!this.isVersionCompatible(encounter.version)) {
        throw new Error('Encounter was saved with an incompatible version');
      }

      eventEmitter.emit('encounterLoaded', { id: encounterId, name: encounter.name });
      return encounter;
    } catch (error) {
      console.error('Failed to load encounter:', error);
      return null;
    }
  }

  // Get all saved encounters metadata
  public getSavedEncounters(): EncounterMetadata[] {
    try {
      const storedData = this.getStoredEncounters();
      
      return Object.values(storedData).map(encounter => ({
        id: encounter.id,
        name: encounter.name,
        description: encounter.description,
        timestamp: encounter.timestamp,
        entityCount: encounter.combatState.entities.size,
        version: encounter.version
      })).sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('Failed to get saved encounters:', error);
      return [];
    }
  }

  // Delete saved encounter
  public deleteEncounter(encounterId: string): boolean {
    try {
      const storedData = this.getStoredEncounters();
      
      if (!storedData[encounterId]) {
        return false;
      }

      const encounterName = storedData[encounterId].name;
      delete storedData[encounterId];
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(storedData));
      
      eventEmitter.emit('encounterDeleted', { id: encounterId, name: encounterName });
      return true;
    } catch (error) {
      console.error('Failed to delete encounter:', error);
      return false;
    }
  }

  // Export encounter to JSON file
  public exportEncounter(encounterId: string): void {
    const encounter = this.loadEncounter(encounterId);
    if (!encounter) {
      throw new Error('Encounter not found');
    }

    const dataStr = JSON.stringify(encounter, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${encounter.name.replace(/[^a-z0-9]/gi, '_')}_encounter.json`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    
    eventEmitter.emit('encounterExported', { id: encounterId, name: encounter.name });
  }

  // Import encounter from JSON file
  public importEncounter(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const jsonData = event.target?.result as string;
          const encounter: SavedEncounter = JSON.parse(jsonData);
          
          // Validate encounter structure
          if (!this.validateEncounterStructure(encounter)) {
            throw new Error('Invalid encounter file format');
          }

          // Generate new ID to avoid conflicts
          encounter.id = this.generateId();
          encounter.timestamp = Date.now();
          
          // Save imported encounter
          const storedData = this.getStoredEncounters();
          storedData[encounter.id] = encounter;
          
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(storedData));
          
          eventEmitter.emit('encounterImported', { id: encounter.id, name: encounter.name });
          resolve(encounter.id);
        } catch (error) {
          reject(new Error(`Failed to import encounter: ${error instanceof Error ? error.message : 'Unknown error'}`));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsText(file);
    });
  }

  // Quick save current state
  public quickSave(combatState: CombatState, actionHistory: CombatAction[]): string {
    const timestamp = new Date();
    const name = `Quick Save ${timestamp.toLocaleDateString()} ${timestamp.toLocaleTimeString()}`;
    
    return this.saveEncounter(name, 'Automatically saved encounter', combatState, actionHistory);
  }

  // Create encounter template
  public saveAsTemplate(
    name: string,
    description: string,
    combatState: CombatState
  ): string {
    // Templates only save entities, not combat progress
    const templateState: CombatState = {
      ...combatState,
      isActive: false,
      round: 1,
      currentTurnIndex: 0,
      turnOrder: []
    };

    // Reset entity states
    templateState.entities.forEach(entity => {
      entity.stats.currentHP = entity.stats.maxHP;
      entity.hasMoved = false;
      entity.hasActed = false;
      entity.isSelected = false;
      entity.conditions = [];
    });

    return this.saveEncounter(`[Template] ${name}`, description, templateState, []);
  }

  // Get storage usage information
  public getStorageInfo(): { used: number; available: number; percentage: number } {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY) || '{}';
      const used = new Blob([data]).size;
      
      // Estimate available storage (5MB typical limit)
      const estimated_limit = 5 * 1024 * 1024;
      const available = estimated_limit - used;
      const percentage = (used / estimated_limit) * 100;
      
      return { used, available, percentage };
    } catch (error) {
      return { used: 0, available: 0, percentage: 0 };
    }
  }

  // Clear all saved data
  public clearAllData(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      eventEmitter.emit('allDataCleared');
    } catch (error) {
      console.error('Failed to clear data:', error);
    }
  }

  // Private methods
  private getStoredEncounters(): { [key: string]: SavedEncounter } {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Failed to parse stored encounters:', error);
      return {};
    }
  }

  private cleanCombatStateForSave(combatState: CombatState): CombatState {
    // Create a deep copy without mesh references
    const cleanState: CombatState = {
      ...combatState,
      entities: new Map(),
      spellAreas: new Map()
    };

    // Clean entities (remove mesh references)
    combatState.entities.forEach((entity, id) => {
      const cleanEntity: CombatEntity = {
        ...entity,
        mesh: undefined // Remove 3D mesh reference
      };
      cleanState.entities.set(id, cleanEntity);
    });

    // Clean spell areas (remove mesh references)
    combatState.spellAreas.forEach((area, id) => {
      const cleanArea = {
        ...area,
        mesh: undefined // Remove 3D mesh reference
      };
      cleanState.spellAreas.set(id, cleanArea);
    });

    return cleanState;
  }

  private validateEncounterStructure(encounter: any): encounter is SavedEncounter {
    return (
      encounter &&
      typeof encounter.id === 'string' &&
      typeof encounter.name === 'string' &&
      typeof encounter.timestamp === 'number' &&
      encounter.combatState &&
      Array.isArray(encounter.actionHistory) &&
      typeof encounter.version === 'string'
    );
  }

  private isVersionCompatible(version: string): boolean {
    // For now, only accept exact version match
    // In future, could implement more sophisticated version checking
    return version === this.VERSION;
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Utility methods for file handling
  public createFileInput(): HTMLInputElement {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.multiple = false;
    return input;
  }

  public formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  public formatTimestamp(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toLocaleString();
  }
}

export default new SaveLoadService();