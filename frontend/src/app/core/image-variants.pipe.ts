import { Pipe, PipeTransform } from '@angular/core';
import { ImageVariantFormat, imageSrcset, imageWebp } from './image-path';

@Pipe({
  name: 'imageSrcset',
  pure: true,
})
export class ImageSrcsetPipe implements PipeTransform {
  transform(
    value: string | null | undefined,
    widths: readonly number[],
    format: ImageVariantFormat = 'webp',
  ): string {
    return imageSrcset(value, widths, format);
  }
}

@Pipe({
  name: 'imageWebp',
  pure: true,
})
export class ImageWebpPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    return imageWebp(value);
  }
}
