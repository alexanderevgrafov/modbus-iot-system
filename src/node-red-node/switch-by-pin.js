module.exports = function (RED) {
  function SHomeSwitchByPin(config) {
    const node = this;

    RED.nodes.createNode(node, config);

    node.on('input', msg => {
      console.log('Switch by pin received', msg);
    });

    this.on('close', (removed, done) => done());
  }

  RED.nodes.registerType('s-home-switch-by-pin', SHomeSwitchByPin);
}
