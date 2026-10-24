import {gridActionIds,getModel} from './models.js';
// Use the editor's rotation contract, including the encoder strip's position.
export function diagnosticLayout(modelId,rotation){
 const model=getModel(modelId);
 const grid=gridActionIds(model,rotation)||Array.from({length:model.rows},(_,row)=>Array.from({length:model.columns},(_,column)=>row*model.columns+column+1).filter(id=>id<=model.keys));
 const knobs=Array.from({length:model.encoders},(_,index)=>index+1);
 if(rotation===90||rotation===180)knobs.reverse();
 return {grid,rotation,knobSide:({0:'right',90:'bottom',180:'left',270:'top'})[rotation],knobs};
}
export function diagnosticPosition(modelId,rotation,id){
 const grid=diagnosticLayout(modelId,rotation).grid;
 for(let row=0;row<grid.length;row++){const column=grid[row].indexOf(id);if(column!==-1)return {row:row+1,column:column+1};}
 return null;
}
