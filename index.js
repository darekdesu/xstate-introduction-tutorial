const { Machine, interpret } = require("xstate");

const lit = {
  on: {
    BREAK: {
      target: "broken",
    },
    TOGGLE: "unlit",
  },
  exit: () => console.log("no more light! (exit action)"),
};
const unlit = {
  on: {
    BREAK: {
      target: "broken",
      actions: () => console.log("(transition action)"),
    },
    TOGGLE: "lit",
  },
};
const broken = {
  entry: (context, event) =>
    console.log(`I'm broken! with payload: ${event.payload} (entry action)`),
  type: "final",
};

const states = { lit, unlit, broken };

const config = {
  id: "lightBulb",
  initial: "unlit",
  states,
  strict: true,
};

const actions = {
  // logBroken: (context, event) => {
  // console.log(`I'm broken! with payload: ${event.payload}`);
  // },
};

const lightBulbMachine = Machine(config, { actions });

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
