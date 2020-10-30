const { Machine, interpret, send, assign } = require("xstate");

const lit = {
  on: {
    BREAK: "broken",
    TOGGLE: "unlit",
    SPEAK: {
      actions: [() => console.log(`I'm speaking something`), send("ECHO")],
    },
    ECHO: {
      actions: () =>
        console.log("There comes the echo because you spoke something!"),
    },
    CHANGE_COLOR: {
      actions: ["setColor"],
    },
    INCREMENT: {
      actions: [
        (ctx) => console.log(ctx.prevCount),
        "savePrevCounter",
        "increment",
        "increment",
        "increment",
        (ctx) => console.log(ctx.count),
      ],
    },
  },
  entry: ["entryLog"],
  exit: ["exitLog"],
};

const unlit = {
  id: "unlit",
  on: {
    BREAK: {
      target: "broken",
      actions: ["transitionLog"],
    },
    TOGGLE: {
      target: "lit",
      cond: "bulbChangedEnabled",
    },
    TOGGLE_BULB_CHANGE: {
      actions: ["toggleBulbChange"],
    },
    SEE_OUTSIDE: "wallBox",
  },
  activities: ["beeping"],
};

const broken = {
  entry: ["logPayload", "buyANewBulb"],
  type: "final",
};

const wallBox = {
  on: {
    SEE_INSIDE: "#unlit",
  },
  type: "parallel",
  states: {
    door: {
      initial: "opened",
      states: {
        closed: {
          on: {
            OPEN: "opened",
          },
        },
        opened: {
          on: {
            CLOSE: "closed",
          },
        },
      },
    },
    dust: {
      initial: "clean",
      states: {
        clean: {
          on: {
            WAIT: "dirty",
          },
        },
        dirty: {
          on: {
            CLEAN_UP: "clean",
          },
        },
      },
    },
  },
};

const states = { lit, unlit, broken, wallBox };

const config = {
  id: "lightBulb",
  initial: "unlit",
  states,
  strict: true,
  context: {
    color: "white",
    count: 0,
    prevCount: undefined,
    isBulbChangeEnabled: false,
  },
};

const options = {
  actions: {
    entryLog: () => console.log("(entry action)"),
    transitionLog: () => console.log("(transition action)"),
    exitLog: () => console.log("(exit action)"),
    logPayload: (ctx, event) => console.log(`Payload: ${event.payload}`),
    buyANewBulb: () => console.log("Buy a new bulb"),
    setColor: assign((ctx, event) => ({
      color: event.color || config.context.color,
    })),
    increment: assign({
      count: (ctx) => ctx.count + 1,
    }),
    savePrevCounter: assign({
      prevCount: (ctx) => ctx.count,
    }),
    toggleBulbChange: assign({
      isBulbChangeEnabled: (context) => !context.isBulbChangeEnabled,
    }),
  },
  activities: {
    beeping: () => {
      const beep = () => console.log("beep activity");

      beep();
      const intervalId = setInterval(beep, 1000);
      return () => clearInterval(intervalId);
    },
  },
  guards: {
    bulbChangedEnabled: (context) => context.isBulbChangeEnabled,
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

service.send("SEE_OUTSIDE");
service.send("CLOSE");
service.send("WAIT");
service.send("SEE_INSIDE");
service.send("TOGGLE_BULB_CHANGE");
service.send("TOGGLE");
service.send("SPEAK");
service.send("INCREMENT");
service.send("TOGGLE");
service.send("BREAK", { payload: "some-payload" });
