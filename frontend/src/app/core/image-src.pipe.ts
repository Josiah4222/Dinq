import { Pipe, PipeTransform } from '@angular/core';
import { imageSrc } from './image-path';

/**
 * Normalise a stored image value for an `src` binding.
 *
 * Applied at the point of rendering rather than when the value is read, so every
 * image on the site is covered by one change and a relative value can never slip
 * through on a route where it would resolve wrongly. Pure, so Angular only
 * re-checks it when the stored string actually changes.
 *
 *     <img [src]="heroImage() | imageSrc" alt="" />
 */
@Pipe({
  name: 'imageSrc',
  // The only argument is a path, so a change to anything else cannot affect it.
  pure: true,
})
export class ImageSrcPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    return imageSrc(value);
  }
}
