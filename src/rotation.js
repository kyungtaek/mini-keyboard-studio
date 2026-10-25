import {validateProfile} from './profile.js';
// Rotate the physical board and its functions together. Assignments already use
// firmware key IDs; permuting them here counter-rotates the visible functions.
// This also keeps unknown/preserve slots, dial assignments and per-key LEDs on
// their original physical controls without guessing their stored values.
export function rotateProfileKeys(value,rotation){
 return validateProfile({...value,rotation});
}
