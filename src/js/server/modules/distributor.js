const PluginBase = require( "./_PluginBaseClass" )
const _ = require( "lodash" );

const NAME = "Distributor";
const STATE_ERR = "err";
const STATE_OK = "ok";

class DistributorModule extends PluginBase {
  title = NAME;
  state = {};

  init( plug, app ) {
    super.init( plug, app );

    this.scanning = false;
    this.fromId = this.config.scanFrom;
    this.toId = this.config.scanTo;
    this.totalFound = 0;
  }

  getLayout() {
    return {
      scanning : {
        type  : "button",
        label : "Start",
        state : {
          status : "Scanner?",
        }
      },
      start    : {
        type  : "input",
        label : "from",
        state : {
          value : this.fromId,
        }
      },
      finish   : {
        type  : "input",
        label : "to",
        state : {
          value : this.toId,
        }
      },
      status   : {
        type  : "information",
        label : "Status",
        state : {
          status : this.getStatusText(),
        }
      }
    }
  }

  getStatusText() {
    return "Found:" + this.totalFound + '; ' + JSON.stringify( this.state )
    // "OK:[" + this.okIds.join( ", " ) +
    //        "], Errs:[" + this.errIds.join( ", " ) +
    //        "], Safe:[" + this.safeIds.join( ", " ) + "]";
  }

  onLayoutChange( controlName, change ) {
    console.log( "SCANNER PLUG caught LayoutChange:", controlName, change );

    if( controlName === "scanning" ) {
      this.toggleScan( change.value );
    }

    if( controlName === "start" ) {
      this.fromId = parseInt( change.value );
    }

    if( controlName === "finish" ) {
      this.toId = parseInt( change.value );
    }
    // const butt = this.buttons[controlName];
    //
    // if (butt) {
    //   const {bid, pin} = butt;
    //   const board = this.application.boardsManager.getBoard(bid);
    //
    //   if (board) {
    //     board.setDataPin(pin, change.value);
    //   }
    //
    //   // board && board.data.togglePin(pin, change.value);
    // }

    // this.emitChange(controlName, change);
  }

  async toggleScan( val ) {
    this.scanning = val;

    if( val ) {
      this.cycleNumber = 0;

      // force process to start from 222 as this id is initially on every virgin board
      this.state[ 222 ] = STATE_ERR;
      await this.randomizeWrong();

      await this.startCycle();
    }
  }

  async startCycle() {
    console.log( "Scanner is active. Cycle", this.cycleNumber, "; Found", this.totalFound );

    await this.scanRange();
    this.reportState();
    await this.saveOksToSafe();
    this.reportState();
    await this.randomizeWrong();

    this.cycleNumber++;

    if( this.cycleNumber < 150 && _.keys( this.state ).length ) {
      await this.startCycle();
    }
  }

  async scanRange() {
    let cur = this.fromId;

    while( this.scanning && cur <= this.toId ) {
      const res = await this.idStatus( cur ).then();

      console.log( "==scan", cur, res );

      if( res === "many" ) {
        this.state[ cur ] = STATE_ERR;
      }
      if( res === "ok" ) {
        this.state[ cur ] = STATE_OK;
      }
      if( res === "empty" ) {
        delete this.state[ cur ];
      }

      cur++;
    }
  }

  async randomizeWrong() {
    const proms =
      _.map(
        _.filter(
          _.toPairs( this.state ), ( [ id, state ] ) => state === STATE_ERR
        ), ( [ id ] ) => this.randomizeId( id ) );

    return Promise.allSettled( proms );
  }

  async saveOksToSafe() {
    let safeId = 0;
    const ids = _.map( _.filter( _.toPairs( this.state ), ( [ id, state ] ) => state === STATE_OK ), x => {
      while( safeId < 255 ) {
        const id = x[ 0 ];
        safeId++;
        //    console.log('--trying to safe', id, 'into', safeId);
        try {
          this.application.boardsManager.getBoard( safeId );
        }
        catch( err ) {
          break;
        }
      }
      return [ x[ 0 ], safeId ];
    } );

    const proms = _.map( ids, ( [ oldId, newId ] ) =>
      this.application.modServer.setBoardId( oldId, newId ).then( res =>
          this.application.modServer.pingBoard( res.id ) )
        .then( bid => {
          this.application.boardsManager.addBoard( { bid } )
          this.totalFound++;
          delete this.state[ oldId ];
        } )
        .catch( e => {
          console.log( "Change SAFE id error", e.message || e );
          this.state[ oldId ] = STATE_ERR;
        } ) )

    return Promise.allSettled( proms );
  }

  async idStatus( id ) {
    return this.application.modServer.pingBoard( id )
      .then( res => res === id ? "ok" : "n/a" )
      .catch( err => {
        if( _.isArray( err ) ) { // TODO: Тут признак наличия нескольких плат - надо отличать от признака отсутствия (?? CRC vs Timeout ??)
          return "many";
        }
        if( err === "No Answer" ) {
          return "empty";
        }
        return "n/a"
      } )
  }

  async randomizeId( id ) {
    const params = {
      id, cmd : 1, cmdDataBytes : [ this.fromId, this.toId ]
    };

    this.application.modServer.setBoardCommand( params )
      .catch( err => {
        // команда отправлена на id с несколькими платами - никакого адекватного ответа не получить
      } )
  }

  reportState() {
    const status = this.getStatusText();
    this.emitChange( "status", { status } );
  }
}

const defaultConfig = {
  ids      : [],
  scanFrom : 220,
  scanTo   : 225,
};

module.exports = {
  Class : DistributorModule,
  title : NAME,
  defaultConfig
}
