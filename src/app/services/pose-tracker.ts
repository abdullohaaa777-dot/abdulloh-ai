import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';

export interface NormalizedPoseLandmarkerResult {
  landmarks: { x: number; y: number; z: number; visibility?: number }[][];
}

@Injectable({ providedIn: 'root' })
export class PoseTrackerService {
  private readonly platformId = inject(PLATFORM_ID);
  private poseLandmarker: { detectForVideo: (video: HTMLVideoElement, timestamp: number) => NormalizedPoseLandmarkerResult; close: () => void } | null = null;
  ready = signal(false);
  error = signal<string | null>(null);
  latest = signal<NormalizedPoseLandmarkerResult | null>(null);

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  async initialize(): Promise<boolean> {
    if (!this.isBrowser) return false;
    if (this.poseLandmarker) {
      this.ready.set(true);
      return true;
    }

    this.error.set(null);
    try {
      const dynamicImport = new Function('u', 'return import(u)') as (u: string) => Promise<unknown>;
      const visionTasks = await dynamicImport('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3');
      const FilesetResolver = (visionTasks as { FilesetResolver: { forVisionTasks: (url: string) => Promise<unknown> } }).FilesetResolver;
      const PoseLandmarker = (visionTasks as { PoseLandmarker: { createFromOptions: (vision: unknown, opts: object) => Promise<unknown> } }).PoseLandmarker;
      const vision = await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm');
      let landmarker: unknown;
      try {
        landmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task',
            delegate: 'GPU'
          },
          runningMode: 'VIDEO',
          numPoses: 1,
          minPoseDetectionConfidence: 0.45,
          minPosePresenceConfidence: 0.45,
          minTrackingConfidence: 0.45
        });
      } catch {
        landmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task',
            delegate: 'CPU'
          },
          runningMode: 'VIDEO',
          numPoses: 1,
          minPoseDetectionConfidence: 0.45,
          minPosePresenceConfidence: 0.45,
          minTrackingConfidence: 0.45
        });
      }
      this.poseLandmarker = landmarker as { detectForVideo: (video: HTMLVideoElement, timestamp: number) => NormalizedPoseLandmarkerResult; close: () => void };
      this.ready.set(true);
      return true;
    } catch (error) {
      console.error('Pose tracker initialization failed:', error);
      this.error.set('Tana skelet trekerini ishga tushirib bo‘lmadi. Fallback demo skelet ishlaydi.');
      this.ready.set(false);
      return false;
    }
  }

  detect(video: HTMLVideoElement, timestamp: number): NormalizedPoseLandmarkerResult | null {
    if (!this.poseLandmarker || !this.ready()) return null;
    try {
      const result = this.poseLandmarker.detectForVideo(video, timestamp);
      this.latest.set(result);
      return result;
    } catch (error) {
      console.error('Pose detect failed:', error);
      this.error.set('Tana skeletini aniqlashda xatolik yuz berdi.');
      return null;
    }
  }

  dispose() {
    this.latest.set(null);
    this.ready.set(false);
    this.error.set(null);
    this.poseLandmarker?.close();
    this.poseLandmarker = null;
  }
}
