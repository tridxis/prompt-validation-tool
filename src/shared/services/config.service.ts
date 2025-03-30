import { Injectable, Logger } from '@nestjs/common';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ConfigService {
  private readonly config: Record<string, string>;
  private readonly logger = new Logger(ConfigService.name);

  constructor() {
    // Try to load from .env file
    const envPath = path.resolve(process.cwd(), '.env');

    if (fs.existsSync(envPath)) {
      this.logger.log(`Loading configuration from ${envPath}`);
      const envConfig = dotenv.parse(fs.readFileSync(envPath));
      this.config = { ...process.env, ...envConfig } as Record<string, string>;
    } else {
      this.logger.warn('.env file not found, using process.env only');
      this.config = { ...process.env } as Record<string, string>;
    }
  }

  /**
   * Gets a configuration value by key
   * @param key The configuration key
   * @param defaultValue The default value if the key is not found
   * @returns The configuration value
   */
  public get(key: string, defaultValue?: string): string {
    const value = this.config[key];

    if (!value && defaultValue !== undefined) {
      return defaultValue;
    }

    return value || '';
  }

  /**
   * Gets a boolean configuration value
   * @param key The configuration key
   * @param defaultValue The default value if the key is not found
   * @returns The boolean value
   */
  public getBoolean(key: string, defaultValue = false): boolean {
    const value = this.get(key);

    if (!value) {
      return defaultValue;
    }

    return value.toLowerCase() === 'true';
  }

  /**
   * Gets a number configuration value
   * @param key The configuration key
   * @param defaultValue The default value if the key is not found
   * @returns The number value
   */
  public getNumber(key: string, defaultValue?: number): number {
    const value = this.get(key);

    if (!value && defaultValue !== undefined) {
      return defaultValue;
    }

    const parsedValue = parseFloat(value);
    return isNaN(parsedValue) ? defaultValue || 0 : parsedValue;
  }
}
