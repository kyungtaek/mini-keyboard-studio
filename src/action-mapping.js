import {getModel,actionCount} from './models.js';
// Profile slots describe the editor's fixed base grid. This firmware's physical
// scan matrix is clockwise 90 degrees from those slots. Never apply this map to
// raw backup records: their IDs are already wire IDs.
const mini16Wire=[13,9,5,1,14,10,6,2,15,11,7,3,16,12,8,4];
export function hasCalibratedMapping({vid,pid,identity}={}){return vid===0x514c&&pid===0x8850&&Array.isArray(identity)&&identity.length===3&&identity.every((value,index)=>value===[16,3,11][index]);}
function check(modelId,id){const model=getModel(modelId);if(!Number.isInteger(id)||id<1||id>actionCount(model))throw Error('키 동작 번호가 올바르지 않습니다.');return model;}
export function deviceActionId(modelId,logicalId,{calibrated=true}={}){check(modelId,logicalId);return calibrated&&modelId==='mini-16x3'&&logicalId<=16?mini16Wire[logicalId-1]:logicalId;}
export function profileActionId(modelId,wireId,{calibrated=true}={}){check(modelId,wireId);return calibrated&&modelId==='mini-16x3'&&wireId<=16?mini16Wire.indexOf(wireId)+1:wireId;}
function checkActions(modelId,actions){if(!Array.isArray(actions)||actions.length!==actionCount(modelId))throw Error('키 동작 개수가 모델과 다릅니다.');}
export function toProfileActions(modelId,wireActions,options){checkActions(modelId,wireActions);return wireActions.map((_,index)=>wireActions[deviceActionId(modelId,index+1,options)-1]);}
export function toDeviceActions(modelId,logicalActions,options){checkActions(modelId,logicalActions);return logicalActions.map((_,index)=>logicalActions[profileActionId(modelId,index+1,options)-1]);}
