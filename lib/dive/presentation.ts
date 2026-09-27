/** Keys a presentation clicker or keyboard uses to move between sections of /dive. */
export const NEXT_KEYS = new Set(["ArrowRight", "ArrowDown", "PageDown"]);
export const PREV_KEYS = new Set(["ArrowLeft", "ArrowUp", "PageUp"]);

/** Posted by the embedded app so the clicker keeps working after someone taps inside the phone. */
export const PRESENTATION_KEY_MESSAGE = "tide:presentation-key";

/** Typing, sliders and menus keep their own arrow keys. */
export function ownsArrowKeys(target: EventTarget | null) {
  if (!(target instanceof Element)) return false;
  return !!target.closest("input, textarea, select, [contenteditable=''], [contenteditable='true'], [role='slider']");
}
