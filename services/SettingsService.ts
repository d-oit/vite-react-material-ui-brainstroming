export interface Settings {
  autosave: {
    enabled: boolean;
    debounceMs: number;
  };
  canvas: {
    snapToGrid: boolean;
    gridSize: number;
  };
}

export class SettingsService {
  private static instance: SettingsService | null = null;
  private settings: Settings;

  private constructor() {
    this.settings = {
      autosave: {
        enabled: true,
        debounceMs: 1000,
      },
      canvas: {
        snapToGrid: false,
        gridSize: 20,
      },
    };
  }

  public static getInstance(): SettingsService {
    if (SettingsService.instance === null) {
      SettingsService.instance = new SettingsService();
    }
    return SettingsService.instance;
  }

  public getSetting<K extends keyof Settings>(key: K): Settings[K] {
    return this.settings[key];
  }

  public updateSetting<K extends keyof Settings>(key: K, value: Settings[K]): void {
    this.settings[key] = value;
  }

  public isAutosaveEnabled(): boolean {
    return this.settings.autosave.enabled;
  }

  public getAutosaveDebounceMs(): number {
    return this.settings.autosave.debounceMs;
  }
}