import { Component, ElementRef, computed, inject, input, output, signal, viewChild } from '@angular/core';
import { CmsService, ImageAsset } from '../core/cms.service';
import { ACCEPTED_UPLOAD_TYPES } from '../core/image-path';
import { ImageSrcPipe } from '../core/image-src.pipe';

/**
 * Choose an image for a content block: upload a new one, or reuse one already in
 * the library.
 *
 * The component does not save anything. It reports a chosen path to its parent,
 * which is put in the page draft like any other edit, so Save stays the single
 * moment a change goes live. Uploading a file therefore never publishes a
 * half-finished page.
 *
 * The text box is kept alongside the buttons on purpose. An upload is the easy
 * path, not the only one: a remote URL, or a file that lives elsewhere, is still
 * a legitimate value and the server will happily store it.
 */
@Component({
  selector: 'app-image-picker',
  imports: [ImageSrcPipe],
  templateUrl: './image-picker.component.html',
  styleUrl: './image-picker.component.scss',
})
export class ImagePickerComponent {
  private readonly cms = inject(CmsService);

  /** The stored value to start from. */
  readonly value = input<string>('');
  /** Field id, so the surrounding <label for> points at something real. */
  readonly inputId = input<string>('image-picker');

  /** Raised with the new path when an image is chosen, typed, or cleared. */
  readonly valueChange = output<string>();

  readonly uploading = signal(false);
  readonly uploadError = signal<string | null>(null);

  readonly library = signal<ImageAsset[]>([]);
  readonly libraryError = signal<string | null>(null);
  readonly libraryOpen = signal(false);
  readonly loadingLibrary = signal(false);

  /** The file input, driven by the button so the two are one control. */
  readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('file');

  /** The `accept` filter for the file input, matching what the server will keep. */
  readonly uploadAccept = ACCEPTED_UPLOAD_TYPES;

  readonly hasValue = computed(() => !!this.value().trim());

  onType(text: string): void {
    this.valueChange.emit(text);
  }

  onFileChosen(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    // Reset immediately so choosing the same file twice in a row still fires.
    input.value = '';
    if (!file) {
      return;
    }
    this.upload(file);
  }

  private upload(file: File): void {
    this.uploading.set(true);
    this.uploadError.set(null);
    this.cms.uploadImage(file).subscribe({
      next: asset => {
        this.uploading.set(false);
        this.valueChange.emit(asset.path);
      },
      error: (response: { error?: { detail?: string } }) => {
        this.uploading.set(false);
        this.uploadError.set(response?.error?.detail ?? 'That image could not be uploaded. Please try again.');
      },
    });
  }

  toggleLibrary(): void {
    const open = !this.libraryOpen();
    this.libraryOpen.set(open);
    if (open && !this.library().length && !this.loadingLibrary()) {
      this.loadLibrary();
    }
  }

  private loadLibrary(): void {
    this.loadingLibrary.set(true);
    this.libraryError.set(null);
    this.cms.listImages().subscribe({
      next: res => {
        this.library.set(res.results ?? []);
        this.loadingLibrary.set(false);
      },
      error: () => {
        this.libraryError.set('The image library could not be loaded.');
        this.loadingLibrary.set(false);
      },
    });
  }

  choose(asset: ImageAsset): void {
    this.libraryOpen.set(false);
    this.valueChange.emit(asset.path);
  }

  clear(): void {
    this.valueChange.emit('');
  }

  /** Focus the file input, so the button and the input are one control. */
  openFileDialog(): void {
    this.fileInput()?.nativeElement.click();
  }
}
