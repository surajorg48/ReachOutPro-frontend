import { Component, ViewChild, ElementRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ResumeService } from '../../core/services/resume.service';
import { CampaignsService } from '../../core/services/campaigns.service';
import { ToastService } from '../../core/services/toast.service';
import {
  UploadIconComponent, CheckIconComponent, RefreshIconComponent,
  SendIconComponent, ResumeIconComponent, CampaignIconComponent,
  EyeIconComponent, EditIconComponent
} from '../../shared/components/icon/icon';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-resume-analyzer',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    UploadIconComponent, CheckIconComponent, RefreshIconComponent,
    SendIconComponent, ResumeIconComponent, CampaignIconComponent,
    EyeIconComponent, EditIconComponent
  ],
  templateUrl: './resume-analyzer.component.html',
  styleUrls: ['./resume-analyzer.component.scss']
})
export class ResumeAnalyzerComponent {
  private resumeApi = inject(ResumeService);
  private campaignsApi = inject(CampaignsService);
  public toast = inject(ToastService);
  public router = inject(Router);

  @ViewChild('fileRef') fileRef!: ElementRef<HTMLInputElement>;

  file = signal<File | null>(null);
  position = signal('Software Developer');
  parsing = signal(false);
  result = signal<any>(null);
  emailTemplate = signal('');
  activeTab = signal<'info' | 'skills' | 'template' | 'markdown'>('info');
  dragging = signal(false);
  savingCampaign = signal(false);

  handleFileDrop(e: DragEvent) {
    e.preventDefault();
    this.dragging.set(false);
    const dropped = e.dataTransfer?.files[0];
    if (dropped) this.handleFileSelect(dropped);
  }

  handleFileSelect(f?: File) {
    if (!f) return;
    const allowedMime = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
    ];
    const ext = f.name.includes('.') ? f.name.slice(f.name.lastIndexOf('.')).toLowerCase() : '';
    const allowedExt = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.webp'];
    if (!allowedMime.includes(f.type) && !allowedExt.includes(ext)) {
      return this.toast.error('Please upload a PDF, DOC, or DOCX file');
    }
    if (f.size > 10 * 1024 * 1024) {
      return this.toast.error('File too large. Maximum size is 10 MB.');
    }
    this.file.set(f);
    this.result.set(null);
    this.emailTemplate.set('');
  }

  handleParse() {
    if (!this.file()) return this.toast.error('Please upload your resume first');
    this.parsing.set(true);
    this.result.set(null);
    
    this.resumeApi.parse(this.file()!, this.position()).pipe(finalize(() => this.parsing.set(false))).subscribe({
      next: (res: any) => {
        this.result.set(res);
        this.emailTemplate.set(res.emailTemplate);
        this.toast.success('✅ Resume parsed successfully!');
        this.activeTab.set('info');
      },
      error: () => {
        // Error interceptor shows a toast with userMessage
      }
    });
  }

  handleRegenerateTemplate() {
    const info = this.result()?.info;
    if (!info) return;
    this.resumeApi.generateTemplate(info, this.position()).subscribe({
      next: (res: any) => {
        this.emailTemplate.set(res.template);
        this.toast.success('Template regenerated!');
      },
      error: (e: Error) => this.toast.error(e.message)
    });
  }

  handleUseBullet(bullet: string) {
    const plain = bullet.replace(/[*_`]/g, '').replace(/^[💻💼🎓🚀✨]\s*/, '').trim();
    this.emailTemplate.update(prev => prev + '\n* ' + plain);
    this.toast.success('Bullet point added to template!');
  }

  handleSaveAsCampaign() {
    if (!this.emailTemplate()) return this.toast.error('Generate a template first');
    this.savingCampaign.set(true);
    
    this.campaignsApi.create({
      name: `Resume Campaign — ${this.position()} — ${new Date().toLocaleDateString('en-IN')}`,
      subject: `Application for ${this.position()} — ${this.result()?.info?.name || 'Suraj Choudhari'}`,
      template_content: this.emailTemplate(),
      position: this.position(),
    }).pipe(finalize(() => this.savingCampaign.set(false))).subscribe({
      next: (res) => {
        this.toast.success('Campaign created from resume!');
        this.router.navigate([`/campaigns/${res.id}/edit`]);
      },
      error: (e: Error) => this.toast.error(e.message)
    });
  }

  copyTemplate() {
    navigator.clipboard.writeText(this.emailTemplate());
    this.toast.success('Copied!');
  }

  getPreviewHtml() {
    return '<p>' + this.emailTemplate()
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')
      .replace(/^---$/gm, '<hr/>')
      .replace(/^\*\s(.+)$/gm, '<li>$1</li>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\{\{[^}]+\}\}/g, m => `<span style="color:var(--accent-primary);font-style:italic">${m}</span>`)
      + '</p>';
  }
}
