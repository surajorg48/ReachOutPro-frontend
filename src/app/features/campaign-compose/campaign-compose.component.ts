import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CampaignsService } from '../../core/services/campaigns.service';
import { SettingsService } from '../../core/services/settings.service';
import { ToastService } from '../../core/services/toast.service';
import { finalize } from 'rxjs/operators';

const DEFAULT_TEMPLATE = `Hi {{hr_name | "Hiring Team"}},

I hope this message finds you well!

My name is **Suraj Choudhari**, and I am a passionate and driven software developer with hands-on experience in full-stack web development, particularly with **React**, **Node.js**, **JavaScript**, and **REST APIs**.

I came across **{{company_name}}** and was genuinely impressed by your work. I would love to explore **{{position | "suitable opportunities"}}** at your organization.

**A quick snapshot of what I bring:**
* Full-Stack Development (React, Node.js, Express, REST APIs)
* Databases (MySQL, MongoDB, SQLite)
* Tools: Git, VS Code, Postman, Linux
* Passion for clean code, problem-solving, and learning

I have attached my **resume** for your review. Looking forward to hearing from you!

Best regards,
**{{applicant_name | "Suraj Choudhari"}}**
📧 {{applicant_email | "surajorg47@gmail.com"}}

---
*This email was sent as a job application. Please forward to recruitment if needed.*`;

@Component({
  selector: 'app-campaign-compose',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './campaign-compose.component.html',
  styleUrls: ['./campaign-compose.component.scss']
})
export class CampaignComposeComponent implements OnInit {
  private route = inject(ActivatedRoute);
  public router = inject(Router);
  private campaignsApi = inject(CampaignsService);
  private settingsApi = inject(SettingsService);
  public toast = inject(ToastService);

  isEdit = signal(false);
  id = signal<number | null>(null);

  form = signal({
    name: '',
    subject: 'Application for Software Developer Role — Suraj Choudhari',
    template_content: DEFAULT_TEMPLATE,
    position: 'Software Developer',
    resume_path: 'C:\\Users\\Admin\\OneDrive\\Desktop\\code\\scrapper\\Suraj_Choudhari_Resume.pdf',
  });

  activeTab = signal<'edit' | 'preview'>('edit');
  saving = signal(false);
  testSending = signal(false);
  testEmail = signal('surajorg48@gmail.com');
  showTestModal = signal(false);

  placeholders = ['{{company_name}}', '{{hr_name}}', '{{position}}', '{{applicant_name}}', '{{applicant_email}}', '{{applicant_phone}}', '{{applicant_linkedin}}', '{{applicant_github}}', '{{date}}'];

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEdit.set(true);
      this.id.set(Number(idParam));
      this.campaignsApi.getOne(this.id()!).subscribe({
        next: (c) => this.form.set({ name: c.name, subject: c.subject || '', template_content: c.template_content || '', position: c.position || '', resume_path: c.resume_path || '' }),
        error: (e: Error) => this.toast.error(e.message)
      });
    } else {
      this.settingsApi.getTemplate().subscribe({
        next: (r: any) => {
          if (r.content) this.form.update(f => ({ ...f, template_content: r.content }));
        },
        error: () => {}
      });
    }
  }

  handleSave() {
    const data = this.form();
    if (!data.name || !data.subject) return this.toast.error('Name and subject are required');
    this.saving.set(true);
    
    if (this.isEdit() && this.id()) {
      this.campaignsApi.update(this.id()!, data).pipe(finalize(() => this.saving.set(false))).subscribe({
        next: () => this.toast.success('Campaign saved!'),
        error: (e: Error) => this.toast.error(e.message)
      });
    } else {
      this.campaignsApi.create(data).pipe(finalize(() => this.saving.set(false))).subscribe({
        next: (res) => {
          this.toast.success('Campaign created!');
          this.router.navigate([`/campaigns/${res.id}/edit`]);
        },
        error: (e: Error) => this.toast.error(e.message)
      });
    }
  }

  handleSendTest() {
    this.testSending.set(true);
    this.showTestModal.set(false);
    
    const sendTestCall = (campId: number) => {
      this.campaignsApi.sendTest(campId, this.testEmail()).pipe(finalize(() => this.testSending.set(false))).subscribe({
        next: () => this.toast.success(`✅ Test email sent to ${this.testEmail()}! Check your inbox.`),
        error: (e: Error) => this.toast.error(e.message)
      });
    };

    if (!this.isEdit()) {
      this.campaignsApi.create(this.form()).subscribe({
        next: (res) => sendTestCall(res.id),
        error: (e: Error) => { this.toast.error(e.message); this.testSending.set(false); }
      });
    } else {
      sendTestCall(this.id()!);
    }
  }

  insertPlaceholder(p: string) {
    this.form.update(f => ({ ...f, template_content: f.template_content + p }));
  }

  getPreviewHtml() {
    const raw = this.form().template_content;
    const filled = raw
      .replace(/\{\{company_name\}\}/g, 'ExampleTech Pvt Ltd')
      .replace(/\{\{hr_name[^}]*\}\}/g, 'Priya Sharma')
      .replace(/\{\{position[^}]*\}\}/g, this.form().position || 'Software Developer')
      .replace(/\{\{applicant_name[^}]*\}\}/g, 'Suraj Choudhari')
      .replace(/\{\{applicant_email[^}]*\}\}/g, 'surajorg47@gmail.com')
      .replace(/\{\{applicant_phone[^}]*\}\}/g, '+91 XXXXXXXXXX')
      .replace(/\{\{[^}]+\}\}/g, '');

    return this.renderMarkdown(filled);
  }

  renderMarkdown(text: string) {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^#{1}\s(.+)$/gm, '<h1>$1</h1>')
      .replace(/^#{2}\s(.+)$/gm, '<h2>$1</h2>')
      .replace(/^#{3}\s(.+)$/gm, '<h3>$1</h3>')
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')
      .replace(/^---$/gm, '<hr/>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/^\*\s(.+)$/gm, '<li>$1</li>');
  }
}
