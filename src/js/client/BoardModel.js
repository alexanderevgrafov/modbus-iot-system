import { makeObservable, observable, action } from "mobx"

const serverErrorCatch = x=>{if (!x.ok){ throw('Server error:' + x.message) }}

class PinConfigModel {
    pin = 0
    read = false
    write = false
    addr = 0

    constructor(v) {
        makeObservable(this, {
            read: observable,
            write: observable,
            addr: observable,
            setRead: action,
            setWrite: action,
            setAddr: action
        });

        v && Object.assign(this, v);
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
        x = Math.min(8, Math.max(parseInt(x) || 0, 0));
        this.addr = x > 0 ? x - this.pin - 1 : 0;
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

    @action
    setFromMasks({ read, write, addr }) {
        _.each(_.range(0, 8), pin => {
            this.pins[pin].read = !!(read & (1 << pin));
            this.pins[pin].write = !!(write & (1 << pin));
            this.pins[pin].addr = (addr >> (pin * 4)) & 0xF;
        })
    }

    update() {
        const data = { read: 0, write: 0, addr: 0 };

        _.each(_.range(0, 8), pin => {
            data.read |= this.pins[pin].read ? (1 << pin) : 0;
            data.write |= this.pins[pin].write ? (1 << pin) : 0;
            data.addr |= (this.pins[pin].addr & 0xF) << (4 * pin);
        })

        fetch("/config/" + this._parent.bid, { method: 'post', body: JSON.stringify(data) })
            .then(x => x.json())
            .then(serverErrorCatch)
            .catch(e => console.error(e));
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
        this.pins.splice(pin, 1, !this.pins[pin] ? 1 : 0);
        this.update();
    }

    @action
    setFromMasks({ pins }) {
        _.each(_.range(0, 8), pin => {
            this.pins[pin] = !!(pins & (1 << pin));
        })
    }

    update() {
        let pins = 0;

        _.each(_.range(0, 8), pin => {
            pins |= this.pins[pin] ? (1 << pin) : 0;
        })

        fetch("/data/" + this._parent.bid, { method: 'post', body: JSON.stringify({ pins }) })
            .then(x => x.json())
            .then(serverErrorCatch)
            .catch(e => console.error(e));
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
    fetchConfig() {
        if (!this.config) {
            this.config = new BoardConfigModel(this);
        }
        fetch("/config/" + this.bid)
            .then(x => x.json())
            .then(x => {
                serverErrorCatch(x);

                this.config.setFromMasks(x.data);
            })
            .catch(e => console.error(e));
    }

    @action
    fetchData() {
        if (!this.data) {
            this.data = new BoardDataModel(this);
        }
        fetch("/data/" + this.bid)
            .then(x => x.json())
            .then(x => {
                serverErrorCatch(x);
                this.data.setFromMasks(x.data);
            })
            .catch(e => console.error(e));
    }


}

export { PinConfigModel, BoardConfigModel, BoardDataModel, BoardModel };
