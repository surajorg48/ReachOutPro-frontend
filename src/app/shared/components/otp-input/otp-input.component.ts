import { Component, output, input, signal, ViewChildren, QueryList, ElementRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-otp-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './otp-input.component.html',
  styleUrls: ['./otp-input.component.scss'],
})
export class OtpInputComponent {
  length = input(6);
  code = output<string>();

  @ViewChildren('otpInput') inputRefs!: QueryList<ElementRef>;

  digits = signal<string[]>(Array(6).fill(''));
  focusedIndex = signal(0);

  constructor() {
    effect(() => {
      const len = this.length();
      this.digits.set(Array(len).fill(''));
    });
  }

  onInput(index: number, event: Event) {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/\D/g, '');

    const newDigits = [...this.digits()];
    newDigits[index] = value ? value[0] : '';
    this.digits.set(newDigits);

    if (value && index < this.digits().length - 1) {
      this.focusInput(index + 1);
    }

    this.emitCode();
  }

  onKeyDown(index: number, event: KeyboardEvent) {
    if (event.key === 'Backspace' && !this.digits()[index] && index > 0) {
      this.focusInput(index - 1);
    }
    if (event.key === 'ArrowLeft' && index > 0) {
      this.focusInput(index - 1);
    }
    if (event.key === 'ArrowRight' && index < this.digits().length - 1) {
      this.focusInput(index + 1);
    }
  }

  onPaste(event: ClipboardEvent) {
    event.preventDefault();
    const pasted = event.clipboardData?.getData('text')?.replace(/\D/g, '') ?? '';
    if (!pasted) return;

    const newDigits = [...this.digits()];
    for (let i = 0; i < Math.min(pasted.length, newDigits.length); i++) {
      newDigits[i] = pasted[i];
    }
    this.digits.set(newDigits);

    const nextEmpty = newDigits.findIndex((d) => !d);
    this.focusInput(nextEmpty >= 0 ? nextEmpty : newDigits.length - 1);
    this.emitCode();
  }

  reset() {
    this.digits.set(Array(this.length()).fill(''));
    this.focusInput(0);
  }

  private focusInput(index: number) {
    setTimeout(() => {
      const inputs = this.inputRefs?.toArray();
      if (inputs?.[index]) {
        inputs[index].nativeElement.focus();
      }
    });
  }

  private emitCode() {
    const code = this.digits().join('');
    if (code.length === this.length()) {
      this.code.emit(code);
    }
  }
}
