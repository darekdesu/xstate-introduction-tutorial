const { Machine, interpret } = require("xstate");

const lit = {
  on: {
    BREAK: {
      target: "broken",
    },
    TOGGLE: "unlit",
  },
  entry: ["entryLog"],
  exit: ["exitLog"],
};
const unlit = {
  on: {
    BREAK: {
      target: "broken",
      actions: ["transitionLog"],
    },
    TOGGLE: "lit",
  },
};
const broken = {
  entry: ["logPayload", "buyANewBulb"],
  type: "final",
};

const states = { lit, unlit, broken };

const config = {
  id: "lightBulb",
  initial: "unlit",
  states,
  strict: true,
};

const options = {
  actions: {
    entryLog: () => console.log("(entry action)"),
    transitionLog: () => console.log("(transition action)"),
    exitLog: () => console.log("(exit action)"),
    logPayload: (context, event) => console.log(`Payload: ${event.payload}`),
    buyANewBulb: () => console.log("Buy a new bulb"),
  },
};

const lightBulbMachine = Machine(config, options);

const service = interpret(lightBulbMachine).start();

service.onTransition((state) => {
  // console.log("Current value:", state.value);
  // if (state.changed) {
  //   console.log("I`m changed!");
  // } else {
  //   console.log("I`m not changed!");
  // }
  // if (state.matches("lit")) {
  //   console.log("I`m lit now!");
  // }
});

service.send("TOGGLE");
service.send("TOGGLE");
service.send("BREAK", { payload: "some-payload" });
