import { Component, EventEmitter, Output } from '@angular/core';
import { SupportService, SupportRequest } from '../../services/support.service';

@Component({
  selector: 'app-support-dialog',
  templateUrl: './support-dialog.component.html',
  styleUrls: ['./support-dialog.component.scss'],
  standalone: false,
})
export class SupportDialogComponent {
  @Output() close = new EventEmitter<void>();

  category: 'question' | 'feature_request' | 'bug_report' = 'question';
  description: string = '';
  captcha: string = '';
  isSubmitting: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  constructor(private supportService: SupportService) {}

  getCategoryLabel(category: string): string {
    switch (category) {
      case 'question':
        return 'I have a question or need help';
      case 'feature_request':
        return 'I want to request a feature';
      case 'bug_report':
        return 'I want to report a bug';
      default:
        return category;
    }
  }

  submitRequest() {
    if (!this.description.trim()) {
      this.errorMessage = 'Please provide a description.';
      return;
    }

    if (!this.captcha.trim()) {
      this.errorMessage = 'Please complete the captcha.';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const request: SupportRequest = {
      category: this.category,
      description: this.description.trim(),
      captcha: this.captcha.trim(),
    };

    this.supportService.submitSupportRequest(request).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        if (response.success) {
          this.successMessage = response.message;
          // Reset form
          this.description = '';
          this.captcha = '';
          this.category = 'question';
          // Close dialog after a short delay
          setTimeout(() => {
            this.closeDialog();
          }, 2000);
        } else {
          this.errorMessage = response.message;
        }
      },
      error: (error) => {
        this.isSubmitting = false;
        this.errorMessage =
          'An error occurred while submitting your request. Please try again.';
        console.error('Support request error:', error);
      },
    });
  }

  closeDialog() {
    this.close.emit();
  }

  onBackdropClick(event: Event) {
    if (event.target === event.currentTarget) {
      this.closeDialog();
    }
  }
}
