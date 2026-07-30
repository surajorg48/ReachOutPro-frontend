import { Component, OnInit, ViewChild, ElementRef, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SettingsService } from '../../core/services/settings.service';
import { ToastService } from '../../core/services/toast.service';
import {
  SettingsIconComponent, MailIconComponent, InfoIconComponent, PlusIconComponent,
  LinkIconComponent, TrashIconComponent, DisconnectIconComponent, CheckIconComponent,
  AlertIconComponent, ZapIconComponent, DownloadIconComponent, XIconComponent
} from '../../shared/components/icon/icon';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    SettingsIconComponent, MailIconComponent, InfoIconComponent, PlusIconComponent,
    LinkIconComponent, TrashIconComponent, DisconnectIconComponent, CheckIconComponent,
    AlertIconComponent, ZapIconComponent, DownloadIconComponent, XIconComponent
  ],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
  private settingsApi = inject(SettingsService);
  public toast = inject(ToastService);

  @ViewChild('newCredRef') newCredRef!: ElementRef<HTMLInputElement>;

  settings = signal<any>({
    sender_email: '', test_email: '', send_delay_ms: '15000',
    resume_path: '', applicant_name: '', applicant_phone: '',
    applicant_linkedin: '', applicant_github: '',
    gmailConnected: false, credentialsUploaded: false
  });
  
  saving = signal(false);
  loading = signal(true);
  showGuide = signal(false);

  accounts = signal<any[]>([]);
  activeAccountId = signal<number | null>(null);
  showAddForm = signal(false);
  
  newEmail = signal('');
  newLabel = signal('');
  newCredFile = signal<File | null>(null);
  addingAccount = signal(false);

  delaySeconds = computed(() => Math.round(parseInt(this.settings().send_delay_ms || '15000') / 1000));

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.settingsApi.get().pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (r: any) => {
        this.settings.set(r);
        this.accounts.set(r.gmail_accounts || []);
        this.activeAccountId.set(r.active_account?.id || null);
      },
      error: () => {}
    });
  }

  handleSave() {
    this.saving.set(true);
    const data = {
      sender_email: this.settings().sender_email, test_email: this.settings().test_email,
      send_delay_ms: this.settings().send_delay_ms, resume_path: this.settings().resume_path,
      applicant_name: this.settings().applicant_name, applicant_phone: this.settings().applicant_phone,
      applicant_linkedin: this.settings().applicant_linkedin, applicant_github: this.settings().applicant_github,
    };
    this.settingsApi.update(data).pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => this.toast.success('Settings saved!'),
      error: (e: Error) => this.toast.error(e.message)
    });
  }

  handleConnectAccount(accId: number) {
    this.settingsApi.getAccountAuthUrl(accId).subscribe({
      next: (res: any) => {
        window.open(res.url, '_blank', 'width=500,height=600');
        
        const onMessage = (event: MessageEvent) => {
          if (event.data === 'gmail_connected') {
            window.removeEventListener('message', onMessage);
            this.load();
            this.toast.success('✅ Account connected!');
          }
        };
        window.addEventListener('message', onMessage);
        
        const poll = setInterval(() => {
          this.settingsApi.getGmailAccounts().subscribe({
            next: (r: any) => {
              const acc = r.accounts?.find((a: any) => a.id === accId);
              if (acc && acc.isConnected) {
                clearInterval(poll);
                window.removeEventListener('message', onMessage);
                this.load();
                this.toast.success('✅ Account connected!');
              }
            }
          });
        }, 3000);
        setTimeout(() => { clearInterval(poll); window.removeEventListener('message', onMessage); }, 120000);
      },
      error: (e: Error) => this.toast.error(e.message)
    });
  }

  handleActivate(accId: number) {
    this.settingsApi.activateGmailAccount(accId).subscribe({
      next: () => {
        this.load();
        this.toast.success('Switched active sending account');
      },
      error: (e: Error) => this.toast.error(e.message)
    });
  }

  handleDisconnectAccount(accId: number, email: string) {
    if (!confirm(`Disconnect ${email}? You can reconnect later without re-uploading credentials.`)) return;
    this.settingsApi.disconnectGmailAccount(accId).subscribe({
      next: () => {
        this.load();
        this.toast.success('Account disconnected');
      },
      error: (e: Error) => this.toast.error(e.message)
    });
  }

  handleRemoveAccount(accId: number, email: string) {
    if (!confirm(`Remove ${email}? Credentials will be deleted.`)) return;
    this.settingsApi.removeGmailAccount(accId).subscribe({
      next: () => {
        this.load();
        this.toast.success('Account removed');
      },
      error: (e: Error) => this.toast.error(e.message)
    });
  }

  handleAddAccount() {
    if (!this.newEmail().trim()) return this.toast.error('Enter email address');
    if (!this.newCredFile()) return this.toast.error('Upload credentials.json for this account');
    
    this.addingAccount.set(true);
    this.settingsApi.addGmailAccount(this.newEmail().trim(), this.newLabel().trim() || this.newEmail().trim(), this.newCredFile()!)
      .pipe(finalize(() => this.addingAccount.set(false)))
      .subscribe({
        next: () => {
          this.toast.success(`Account ${this.newEmail()} added! Now click "Connect" to authorize.`);
          this.newEmail.set('');
          this.newLabel.set('');
          this.newCredFile.set(null);
          this.showAddForm.set(false);
          this.load();
        },
        error: (e: Error) => this.toast.error(e.message)
      });
  }

  handleFileSelect(e: any) {
    const file = e.target.files[0];
    if (file) this.newCredFile.set(file);
    e.target.value = '';
  }
}
