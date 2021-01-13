import { makeObservable, observable, action } from "mobx"
import { BoardModel } from "./BoardModel";

class AppState {
    @observable boards = {};

    constructor() {
        makeObservable(this);
    }

    @action
    getBoard(bid) {
        if (!this.boards[bid]) {
            this.boards[bid] = new BoardModel(bid);
        }
        return this.boards[bid];
    }

    @action
    save(){

    }
}

//const ApplicationState = new AppState;

export { AppState };
