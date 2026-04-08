import { ChangeDetectionStrategy, Component, inject, signal, computed, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { DermatologyService, DermatologyCase } from '../../services/dermatology';

@Component({
  selector: 'app-dermatology-ai',
  standalone: true,
  imports: [CommonModule, MatIconModule, FormsModule],
  templateUrl: './dermatology-ai.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DermatologyAIComponent {
  private dermService = inject(DermatologyService);
  
  cases = computed(() => this.dermService.getCases());
  activeCase = signal<DermatologyCase | null>(null);
  
  view = signal<'list' | 'chat' | 'detail' | 'monitoring'>('list');
  
  // Chat state
  userInput = signal('');
  isTyping = signal(false);
  isAnalyzingImage = signal(false);
  
  // Camera state
  @ViewChild('video') set video(content: ElementRef<HTMLVideoElement>) {
    if (content) {
      this.videoElement = content;
      setTimeout(() => this.initCameraStream(), 100);
    }
  }
  private videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvas') canvasElement!: ElementRef<HTMLCanvasElement>;
  showCamera = signal(false);
  cameraError = signal<string | null>(null);
  
  // Filters
  searchQuery = signal('');
  statusFilter = signal<'all' | 'active' | 'completed' | 'urgent'>('all');
  
  // Monitoring form state
  selectedSpread = signal<'improving' | 'stable' | 'worsening'>('stable');
  
  filteredCases = computed(() => {
    let list = this.cases();
    const query = this.searchQuery().toLowerCase();
    const status = this.statusFilter();
    
    if (query) {
      list = list.filter((c: DermatologyCase) => 
        c.diagnosis?.main.toLowerCase().includes(query) || 
        c.id.toLowerCase().includes(query)
      );
    }
    
    if (status !== 'all') {
      list = list.filter((c: DermatologyCase) => c.status === status);
    }
    
    return list;
  });

  createNewCase() {
    const newCase = this.dermService.createCase();
    this.activeCase.set(newCase);
    this.view.set('chat');
    this.addAssistantMessage("Assalomu alaykum! Men Dermatologik AI yordamchisiman. Sizga teri muammolaringizni tahlil qilishda yordam beraman. Iltimos, avval muammoli joyning rasmini yuklang yoki kamera orqali oling.");
  }

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  triggerFileUpload() {
    if (this.fileInput) {
      this.fileInput.nativeElement.click();
    }
  }

  selectCase(dCase: DermatologyCase) {
    this.activeCase.set(dCase);
    this.view.set('detail');
  }

  handleFileUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    
    const file = input.files[0];
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      const currentCase = this.activeCase();
      if (!currentCase) return;
      
      if (file.type.startsWith('image/')) {
        this.processImage(base64);
      } else {
        currentCase.files.push({
          name: file.name,
          type: file.type,
          content: 'File content placeholder'
        });
        this.dermService.updateCase(currentCase);
        this.addAssistantMessage(`${file.name} fayli qabul qilindi. Tahlil qilinmoqda...`);
        this.askNextQuestion();
      }
      input.value = '';
    };
    
    reader.readAsDataURL(file);
  }

  async processImage(base64: string) {
    const currentCase = this.activeCase();
    if (!currentCase) return;

    this.isAnalyzingImage.set(true);
    this.isTyping.set(true);
    
    try {
      await this.dermService.analyzeImage(base64);
      
      currentCase.images.push({
        url: base64,
        quality: 'good',
        timestamp: new Date().toISOString()
      });
      
      this.dermService.updateCase(currentCase);
      this.addAssistantMessage("Rasm qabul qilindi. Tahlil qilinmoqda...");
      this.askNextQuestion();
    } catch (err) {
      console.error("Rasm tahlilida xatolik:", err);
      this.addAssistantMessage("Kechirasiz, rasmni tahlil qilishda xatolik yuz berdi.");
    } finally {
      this.isAnalyzingImage.set(false);
      this.isTyping.set(false);
    }
  }

  startCamera() {
    this.showCamera.set(true);
  }

  private async initCameraStream() {
    this.cameraError.set(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      });
      if (this.videoElement) {
        this.videoElement.nativeElement.srcObject = stream;
        this.videoElement.nativeElement.onloadedmetadata = () => {
          this.videoElement.nativeElement.play().catch(e => console.error("Play error:", e));
        };
      }
    } catch (err) {
      console.error("Kameraga ruxsat berilmadi", err);
      this.cameraError.set("Kameraga ruxsat berilmadi.");
    }
  }

  capturePhoto() {
    const video = this.videoElement.nativeElement;
    const canvas = this.canvasElement.nativeElement;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      const base64 = canvas.toDataURL('image/jpeg', 0.8);
      this.stopCamera();
      this.processImage(base64);
    }
  }

  stopCamera() {
    if (this.videoElement?.nativeElement?.srcObject) {
      const stream = this.videoElement.nativeElement.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      this.videoElement.nativeElement.srcObject = null;
    }
    this.showCamera.set(false);
  }

  sendMessage() {
    const text = this.userInput().trim();
    if (!text || !this.activeCase()) return;
    
    const currentCase = this.activeCase()!;
    currentCase.chatHistory.push({ role: 'user', text, timestamp: new Date().toISOString() });
    this.userInput.set('');
    this.dermService.updateCase(currentCase);
    
    this.askNextQuestion();
  }

  async askNextQuestion() {
    const currentCase = this.activeCase();
    if (!currentCase) return;
    
    this.isTyping.set(true);
    const question = await this.dermService.getNextQuestion(currentCase);
    this.isTyping.set(false);
    
    if (question === 'DIAGNOSIS_READY') {
      this.generateDiagnosis();
    } else {
      this.addAssistantMessage(question);
    }
  }

  async generateDiagnosis() {
    const currentCase = this.activeCase();
    if (!currentCase) return;
    
    this.isTyping.set(true);
    this.addAssistantMessage("Barcha ma'lumotlar yig'ildi. Yakuniy tahlil tayyorlanmoqda...");
    
    try {
      const result = await this.dermService.generateDiagnosis(currentCase);
      currentCase.diagnosis = result;
      currentCase.status = 'completed';
      this.dermService.updateCase(currentCase);
      this.view.set('detail');
    } catch {
      this.addAssistantMessage("Tahlil qilishda xatolik yuz berdi.");
    } finally {
      this.isTyping.set(false);
    }
  }

  addAssistantMessage(text: string) {
    const currentCase = this.activeCase();
    if (currentCase) {
      currentCase.chatHistory.push({ role: 'assistant', text, timestamp: new Date().toISOString() });
      this.dermService.updateCase(currentCase);
    }
  }

  setBodyLocation(loc: string) {
    const currentCase = this.activeCase();
    if (currentCase) {
      currentCase.bodyLocation = loc;
      this.dermService.updateCase(currentCase);
      this.askNextQuestion();
    }
  }

  getUrgencyColor(urgency?: string) {
    switch (urgency) {
      case 'emergency': return 'bg-red-100 text-red-700 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default: return 'bg-green-100 text-green-700 border-green-200';
    }
  }

  markMedicationDone(medIndex: number) {
    const currentCase = this.activeCase();
    if (!currentCase || !currentCase.treatmentPlan) return;
    
    currentCase.treatmentPlan.medications[medIndex].adherenceProofs.push({
      timestamp: new Date().toISOString(),
      imageUrl: 'https://picsum.photos/seed/proof/200/200',
      note: 'Dori qabul qilindi'
    });
    
    this.dermService.updateCase(currentCase);
  }

  addMonitoringLog(itching: number, pain: number, note: string) {
    const currentCase = this.activeCase();
    if (!currentCase) return;
    
    currentCase.monitoringLogs.push({
      timestamp: new Date().toISOString(),
      symptoms: { itching, pain, spread: this.selectedSpread() },
      note
    });
    
    this.dermService.updateCase(currentCase);
    this.view.set('detail');
  }
}
