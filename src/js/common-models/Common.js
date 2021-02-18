const _ =require('lodash');
const {types} = require('mobx-state-tree');
//import {serverErrorCatch} from '../client/Utils'

const CommonModel = types
  .model('CommonModel',
    {
    })
  .actions(self => {
    return {
      set(patch, source){
        const changes = {};
        _.each(patch, (val,key)=>{
          //ToDo: check if key belongs to model
          if (self[key]!==val) {
            changes[key] = self[key] = val;
          }
        });

        if (_.keys(changes).length) {
          self.onChange(changes, source);
        }
      },

      getDiff(data) {
         var snapshot = self
      },

      onChange(patch, source) {
        console.log('Changed', patch, 'from', source);
      },
    }
  })


module.exports = {CommonModel};
