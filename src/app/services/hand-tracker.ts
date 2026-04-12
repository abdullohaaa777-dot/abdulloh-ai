import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface HandTrackerSettings {
  numHands: number;
  minHandDetectionConfidence: number;
  minHandPresenceConfidence: number;
  minTrackingConfidence: number;
}

export interface NormalizedHandLandmarkerResult {
  landmarks: { x: number; y: number; z: number }[][];
  handedness: { categoryName: string; score: number }[][];
}

@Injectable({ providedIn: 'root' })
export class HandTrackerService {
  private readonly platformId = inject(PLATFORM_ID);
  private handLandmarker: { detectForVideo: (video: HTMLVideoElement, timestamp: number) => NormalizedHandLandmarkerResult; setOptions: (o: object) => Promise<void>; close: () => void } | null = null;
  private settings: HandTrackerSettings = {
    numHands: 2,
    minHandDetectionConfidence: 0.5,
    minHandPresenceConfidence: 0.5,
    minTrackingConfidence: 0.5
  };

  ready = signal(false);
  error = signal<string | null>(null);
  latest = signal<NormalizedHandLandmarkerResult | null>(null);

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  async initialize(): Promise<boolean> {
    if (!this.isBrowser) return false;
    if (this.handLandmarker) {
      this.ready.set(true);
      return true;
    }

    this.error.set(null);

    try {
      const dynamicImport = new Function('u', 'return import(u)') as (u: string) => Promise<unknown>;
      const visionTasks = await dynamicImport('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3');
      const FilesetResolver = (visionTasks as { FilesetResolver: { forVisionTasks: (url: string) => Promise<unknown> } }).FilesetResolver;
      const HandLandmarker = (visionTasks as { HandLandmarker: { createFromOptions: (vision: unknown, opts: object) => Promise<unknown> } }).HandLandmarker;

      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm'
      );

      let landmarker: unknown;
      try {
        landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
            delegate: 'GPU'
          },
          runningMode: 'VIDEO',
          ...this.settings
        });
      } catch {
        landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
            delegate: 'CPU'
          },
          runningMode: 'VIDEO',
          ...this.settings
        });
      }

      this.handLandmarker = landmarker as { detectForVideo: (video: HTMLVideoElement, timestamp: number) => NormalizedHandLandmarkerResult; setOptions: (o: object) => Promise<void>; close: () => void };
      this.ready.set(true);
      return true;
    } catch (error) {
      console.error('Hand tracker initialization failed:', error);
      this.error.set('Qo‘l trekerini ishga tushirib bo‘lmadi.');
      this.ready.set(false);
      return false;
    }
  }

  detect(video: HTMLVideoElement, timestamp: number): NormalizedHandLandmarkerResult | null {
    if (!this.handLandmarker || !this.ready()) return null;

    try {
      const result = this.handLandmarker.detectForVideo(video, timestamp);
      this.latest.set(result);
      return result;
    } catch (error) {
      this.error.set('Qo‘l aniqlash jarayonida xatolik yuz berdi.');
      console.error('Hand tracker detect failed:', error);
      return null;
    }
  }

  async updateSettings(patch: Partial<HandTrackerSettings>) {
    this.settings = { ...this.settings, ...patch };
    if (this.handLandmarker) {
      await this.handLandmarker.setOptions({ ...this.settings });
    }
  }

  dispose() {
    this.latest.set(null);
    this.ready.set(false);
    this.error.set(null);
    this.handLandmarker?.close();
    this.handLandmarker = null;
  }
}
