import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { ResumeParseResult, ResumeInfo } from '../models';

@Injectable({ providedIn: 'root' })
export class ResumeService {
  private api = inject(ApiService);

  parse(file: File, position: string): Observable<ResumeParseResult> {
    const fd = new FormData();
    fd.append('resume', file);
    if (position) fd.append('position', position);
    return this.api.upload<ResumeParseResult>('/resume/parse', fd);
  }

  generateTemplate(info: ResumeInfo, position: string): Observable<{ template: string }> {
    return this.api.post<{ template: string }>('/resume/generate-template', { info, position });
  }
}
