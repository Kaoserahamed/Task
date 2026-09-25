export const MAX_TOUR_IMAGES = 5;
export const MAX_TOUR_IMAGE_SIZE = 5 * 1024 * 1024;
export const ALLOWED_TOUR_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

const fileFingerprint = (file) => [file.name, file.size, file.lastModified, file.type].join(':');

/**
 * Select the files that can be added to a tour image list.
 *
 * The same limits are enforced by every backend storage adapter. Keeping the
 * browser policy here avoids uploading files that the API would reject, while
 * accepting valid files from a mixed selection.
 */
export function selectTourImages(existingImages = [], incomingFiles = []) {
  const selected = [...existingImages];
  const fingerprints = new Set(existingImages.map(fileFingerprint));
  const messages = [];
  let remainingSlots = Math.max(0, MAX_TOUR_IMAGES - selected.length);

  for (const file of Array.from(incomingFiles)) {
    if (remainingSlots === 0) {
      messages.push(`A tour can have at most ${MAX_TOUR_IMAGES} images.`);
      break;
    }
    if (!ALLOWED_TOUR_IMAGE_TYPES.includes(file.type)) {
      messages.push(`${file.name}: use JPEG, PNG, WebP, or GIF.`);
      continue;
    }
    if (file.size < 1 || file.size > MAX_TOUR_IMAGE_SIZE) {
      messages.push(`${file.name}: images must be between 1 byte and 5 MB.`);
      continue;
    }

    const fingerprint = fileFingerprint(file);
    if (fingerprints.has(fingerprint)) {
      messages.push(`${file.name} is already selected.`);
      continue;
    }

    fingerprints.add(fingerprint);
    selected.push(file);
    remainingSlots -= 1;
  }

  return { images: selected, error: messages.join(' ') };
}
