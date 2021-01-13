import { makeObservable, observable, action } from "mobx"

class PinConfigModel {
    pin = 0
    read = false
    write = false
    addr = 0

    constructor(values) {
        makeObservable(this, {
            read: observable,
            write: observable,
            addr: observable,
            setRead: action,
            setWrite: action,
            setAddr: action
        });

        values && Object.assign(this, values);
    }

    setRead(x) {
        this.read = x;
        x && (this.write = false);
    }

    setWrite(x) {
        this.write = x;
        x && (this.read = false);
    }

    setAddr(x) {
        x = parseInt(x) || 0;
        this.addr = Math.min(7 - this.pin, Math.max(x, -this.pin));
    }
}

class BoardConfigModel {
    @observable pins = []

    constructor(parent) {
        this._parent = parent;
        _.each(_.range(0, 8), pin =>
            this.pins[pin] = new PinConfigModel({ pin })
        )
        makeObservable(this);
    }

    save() {
        this._parent.updateBoardConfig();
    }
}

class BoardDataModel {
    @observable pins = [0, 0, 0, 0, 0, 0, 0, 0]

    constructor(parent) {
        makeObservable(this);
        this._parent = parent;
        //_.each(_.range(0, 8), pin =>        this.pins.push(false)    );

    }

    @action
    togglePin(pin) {
        this.pins.splice(pin, 1, !this.pins[pin] ? 1:0 );
        this._parent.updateBoardData();
    }
}

class BoardModel {
    bid = 0
    @observable config = null;
    @observable data = null;

    constructor(bid) {
        this.bid = bid;
        makeObservable(this);
    }

    @action
    loadConfig() {
        new Promise(res => {
            setTimeout(() => {
                res(new BoardConfigModel(this));
            }, 200);
        })
            .then(x => {
                this.config = x
            })
            .catch(e => console.error(e));
    }

    @action
    loadData() {
        new Promise(res => {
            setTimeout(() => {
                res(new BoardDataModel(this));
            }, 300);
        }).then(x => {
                this.data = x
            })
            .catch(e => console.error(e));
    }

    updateBoardConfig() {
        console.log("Write CONFIG to ", this.bid, this.config);
    }

    updateBoardData() {
        console.log("Write data to ", this.bid, this.data.pins.join("|"));
    }
}

export { PinConfigModel, BoardConfigModel, BoardDataModel, BoardModel };
