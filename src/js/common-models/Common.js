const _ =require('lodash');
const {types, getRoot} = require('mobx-state-tree');
//import {serverErrorCatch} from '../client/Utils'

const CommonModel = types
  .model('CommonModel',
    {
    })
  .actions(self => {
    let manager = getRoot(self);
    return {
      set(patch, source){
        const changes = {};
        _.each(patch, (val,key)=>{
          //ToDo: check if key belongs to model
          if (self[key]!==val) {
            self[key] = changes[key] = val;
          }
        });

        if (_.keys(changes).length && self.onChange) {
          self.onChange(changes, source);
        }

        return changes;
      },

      getDiff(data) {
         var snapshot = self
      },

      save(){

      }
    }
  })


module.exports = {CommonModel};
