module.exports = {
  Networks: { TESTNET: "Test SDF Network ; September 2015" },
  Contract: class Contract {
    constructor(id) { this.id = id; }
    call() { return {}; }
  },
  Address: class Address {
    constructor(addr) { this.addr = addr; }
    toScVal() { return {}; }
  },
  xdr: {
    ScVal: {
      scvString: (s) => s,
      scvU32: (u) => u,
      scvI128: (i) => i
    },
    Int128Parts: class Int128Parts {},
    Int64: { fromString: () => {} },
    Uint64: { fromString: () => {} }
  },
  scValToNative: (v) => v,
  rpc: {
    Server: class {
      getAccount() { return Promise.resolve({ sequence: "1" }); }
      simulateTransaction() { return Promise.resolve({}); }
      assembleTransaction() { return { build: () => ({ toXDR: () => "xdr" }) }; }
      sendTransaction() { return Promise.resolve({ status: "SUCCESS", hash: "hash" }); }
      getTransaction() { return Promise.resolve({ status: "SUCCESS" }); }
    },
    Api: {
      isSimulationError: () => false
    }
  }
};
