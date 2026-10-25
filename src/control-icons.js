// Small hardware-control pictograms share one optical grid. Keep their labels
// on the containing control; these SVGs are decorative, never extra AX nodes.
const paths = Object.freeze({
  'chevron-down': '<path d="m7 9.5 5 5 5-5"/>',
  'rotate-left': '<path d="M4.2 8a8.2 8.2 0 1 1 .4 9.6"/><path d="M4.2 3.8V8h4.2"/>',
  'rotate-right': '<path d="M19.8 8a8.2 8.2 0 1 0-.4 9.6"/><path d="M19.8 3.8V8h-4.2"/>',
  reset: '<path d="M4.2 8a8.2 8.2 0 1 1 .4 9.6"/><path d="M4.2 3.8V8h4.2"/><path d="M12 8v8"/>',
  'knob-left': '<path d="M5 17a8 8 0 1 1 14 0"/><path d="m5 12.5 0 4.5 4.5 0"/><path d="M12 8v4"/>',
  'knob-right': '<path d="M19 17a8 8 0 1 0-14 0"/><path d="m19 12.5 0 4.5-4.5 0"/><path d="M12 8v4"/>',
  power: '<path d="M12 3v9"/><path d="M6.4 5.8a8.3 8.3 0 1 0 11.2 0"/>',
});

export function controlIcon(name, {size = 16} = {}) {
  if (!Object.hasOwn(paths, name)) throw new Error('Unknown control icon');
  if (!Number.isFinite(size) || size < 8 || size > 64) throw new Error('Control icon size must be between 8 and 64');
  return `<svg class="control-icon control-icon--${name}" xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths[name]}</svg>`;
}
