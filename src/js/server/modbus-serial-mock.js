const _ = require( "lodash" );
const fs = require( "fs" );
const BOARDS_ON_WIRE_FILE = __dirname + "/../../../boards_on_wire.json";

const BOARD_ADDR_ID = 4;
const BOARD_ADDR_EXT_CMD = 34;
class ModbusBoard {
  id = 0;
  memory = [];

  constructor( json ) {
    this.id = json.id;
    this.memory = _.map((json.memory || '').split( "," ), x=>parseInt(x));
  }

  loop(){
    this.id = this.memory[BOARD_ADDR_ID];
    const cmd = this.memory[BOARD_ADDR_EXT_CMD] & 0xFF00;
    if (cmd) {
      this.runExtCmd(cmd >> 8);
    }
  }

  randomizeId(params) {
    let newId;
    const [from,to] = [params[0], params[1]];


    do {
      newId = from + Math.round(Math.random() * (to - from));
    } while (newId === this.id);

    this.memory[BOARD_ADDR_ID] = newId;
  }

  runExtCmd(cmd) {
    const params = [];

    params.push( this.memory[ BOARD_ADDR_EXT_CMD ] & 0xFF );

    for( let i = 1; i < 4; i++ ) {
      const word = this.memory[ BOARD_ADDR_EXT_CMD + i ];
      params.push( (word & 0xFF00) >> 8 );
      params.push( word & 0xFF );
    }

  //  console.log('Board', this.id, 'starting command', cmd);

    switch(cmd) {
      case 1: // randomize ID
          this.randomizeId(params);
          break;
    }

    this.memory[BOARD_ADDR_EXT_CMD] = 0;

    this.loop();
  }

  write( packet ) {
    const {addr, data} = packet;
    try {
      const requiredFill = addr + data.length - this.memory.length;

      if (requiredFill > 0) {
        this.memory = _.concat(this.memory, _.fill(Array(requiredFill), 0));
      }

      const params = [ addr, data.length, ...data ];
      Array.prototype.splice.apply( this.memory, params);

      this.loop();
    }
    catch( e ) {
      return Promise.reject( e.message || e );
    }

    return Promise.resolve('ok');
  }

  read( packet ) {
    try {
      const data = this.memory.slice( packet.addr, packet.addr + packet.count );

      return Promise.resolve( data );
    }
    catch( e ) {
      return Promise.reject( e.message || e );
    }
  }

  async packetFromWire( packet ) {
    const timeOut = 300 + Math.random()*1200;

    return new Promise((resolve, reject)=>{
      setTimeout(()=>{
        if (packet.id && packet.id!==this.id) {
          return resolve();
        }
        //  console.log("--packet", packet);
        switch( packet.cmd ) {
          case "writeReg":
            resolve(this.write( packet ));
            break
          case "readReg":
            resolve(this.read( packet ));
            break;
          default:
            reject( "Unknown cmd" );
        }
      }, timeOut);
    })
  }

  toJSON() {
    return {
      id     : this.id,
      memory : this.memory.join( "," ),
    }
  }
}

class ModbusBoardsOnWire {
  boards = [];
  cachedSave = '';

  constructor() {
    let config;

    config = JSON.parse( fs.readFileSync( BOARDS_ON_WIRE_FILE ) || "{}" );

    _.each( config.boards, json => this.boards.push( new ModbusBoard( json ) ) );

    this.saveConfig = _.debounce(this._saveConfig, 1000);
  }

  async packetOnWire( packet ) {
    const all = await Promise.allSettled( _.map( this.boards, board => board.packetFromWire( packet ) ) );

    this.saveConfig();

    const errors = _.reduce( all, ( result, value ) => {
      if( value.status === "rejected" ) {
        result.push( value.reason );
      }

      return result;
    }, [] ).join( "; " );


    if( errors ) {
      return Promise.reject( errors );
    }

    const answers = _.reduce( all, ( result, value ) => {
      if( value.status === "fulfilled" && value.value ) {
        result.push( value.value );
      }
      return result
    }, [] );

    if( answers.length === 1 ) {
        return Promise.resolve( {data:answers[ 0 ]} );
    } else {
      const reason = answers.length ? answers/*("Many:" + answers.join( "; " ))*/ : "No Answer";
      return Promise.reject( reason );
    }
  }

  _saveConfig() {
    const data = {
      boards : _.map( this.boards, board => board.toJSON() ),
    };
    const string =  JSON.stringify( data, null, "  " );

    if (string !== this.cachedSave) {
      fs.writeFileSync( BOARDS_ON_WIRE_FILE, string);
      this.cachedSave = string;
    }
  }
}


const wire = new ModbusBoardsOnWire();

class ModbusRtuMock {
  data = [];
  selectedBoardId = 0;

  readHoldingRegisters( addr, count ) {
    return this.readInputRegisters( addr, count );
  }

  readInputRegisters( addr, count ) {
    const dataPacket = {
      cmd : "readReg",
      addr, count,
    }

    return this.sendPacket( dataPacket );
  }

  writeRegisters( addr, data ) {
    const dataPacket = {
      cmd : "writeReg",
      addr, data,
    }

    return this.sendPacket( dataPacket );
  }

  connectRTUBuffered( port, options, cb ) {
    cb();
    return Promise.resolve();
  }

  setTimeout( val ) {
    return Promise.resolve();
  }

  setID( id ) {
    this.selectedBoardId = id;

    return Promise.resolve();
  }

  sendPacket( data ) {
    const dataWithId = Object.assign( {}, data, { id : this.selectedBoardId } );

    return wire.packetOnWire( dataWithId );
  }

  close() {
    wire.saveConfig();

    return Promise.resolve();
  }
}

module.exports = { ModbusRTU: ModbusRtuMock };
