import {getModel,actionCount} from './models.js';
// Physical row-major measurements + independent raw readback establish that
// profile slots already use firmware IDs. Rotate placement only in the UI;
// an additional USB permutation rotates the saved keymap incorrectly.
function check(modelId,id){const model=getModel(modelId);if(!Number.isInteger(id)||id<1||id>actionCount(model))throw Error('키 동작 번호가 올바르지 않습니다.');}
export function deviceActionId(modelId,id){check(modelId,id);return id;}
export function profileActionId(modelId,id){check(modelId,id);return id;}
function copyActions(modelId,actions){if(!Array.isArray(actions)||actions.length!==actionCount(modelId))throw Error('키 동작 개수가 모델과 다릅니다.');return [...actions];}
export function toProfileActions(modelId,actions){return copyActions(modelId,actions);}
export function toDeviceActions(modelId,actions){return copyActions(modelId,actions);}
