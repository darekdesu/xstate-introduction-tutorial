const { Machine, interpret, send, assign } = require("xstate");

const fetchPokemons = ({ limit = 10, offset = 0 }) =>
  fetch(`https://pokeapi.co/api/v2/pokemon?limit=${limit}&offset=${offset}`)
    .then((result) => result.json())
    .then((data) => data.results.map((result) => result.name));

const echoCallbackHandler = (ctx, event) => (callback, onEvent) => {
  onEvent((event) => {
    if (event.type === "HALLO") {
      callback("ECHO");
    } else {
      console.log(
        "There is no echo callback because event type is diffrent than HALLO :("
      );
    }
  });
};

const lit = {
  invoke: {
    id: "echoCallback",
    src: echoCallbackHandler,
  },
  on: {
    BREAK: "broken",
    TOGGLE: "unlit",
    SPEAK: {
      actions: [
        () => console.log(`I'm speaking something`),
        send("HALLO", { to: "echoCallback" }),
      ],
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
    SEE_OUTSIDE: "wallBox.hist",
    TRY_BREAK: "tryBreak",
    GO_TO_STOP_LIGHT: "stopLight",
    LOAD_POKEMONS: "pokemons",
  },
  activities: ["beeping"],
};

const pokemons = {
  id: "pokemons",
  context: {
    pokemons: [],
    error: null,
  },
  initial: "loading",
  states: {
    loading: {
      invoke: {
        id: "fetchPokemons",
        src: fetchPokemons,
        onDone: {
          target: "success",
          actions: assign({
            pokemons: (ctx, event) => event.data,
          }),
        },
        onError: {
          target: "failure",
          actons: assign({
            error: (ctx, event) => event.data,
          }),
        },
      },
    },
    success: {
      type: "final",
    },
    failure: {
      on: {
        RETRY: "loading",
      },
    },
  },
};

const stopLight = {
  id: "stopLight",
  initial: "green",
  on: {
    SWITCH_TO_LIT: "lit",
  },
  states: {
    green: {
      after: {
        ONE_SEC_IN_MS: "yellow",
      },
    },
    yellow: {
      after: {
        ONE_SEC_IN_MS: "red",
      },
    },
    red: {
      after: {
        ONE_SEC_IN_MS: "green",
      },
    },
  },
};

const tryBreak = {
  entry: ["litEntryIncrease"],
  on: {
    "": [{ target: "broken", cond: "litTryBreakable" }, { target: "unlit" }],
  },
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
    hist: {
      type: "history",
      history: "deep",
    },
  },
};

const states = { lit, unlit, broken, wallBox, tryBreak, stopLight, pokemons };

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
    litEntryCounter: 0,
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
    litEntryIncrease: assign({
      litEntryCounter: (context) => context.litEntryCounter + 1,
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
    litTryBreakable: (context) => context.litEntryCounter > 2,
  },
  delays: {
    ONE_SEC_IN_MS: 1000,
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
