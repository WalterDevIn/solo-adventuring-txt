const LOCATION_NAMES = {
  CITY: "the city",
  DUNGEON: "the dungeon",
};

export function createGameEngine(initialLocation = "CITY") {
  const state = {
    location: initialLocation,
  };

  function processIntent(intent) {
    if (intent.type === "TRAVEL") {
      if (state.location === intent.destination) {
        return {
          accepted: true,
          changed: false,
          state: { ...state },
          message: `You are already in ${LOCATION_NAMES[state.location]}.`,
        };
      }

      const previousLocation = state.location;
      state.location = intent.destination;

      return {
        accepted: true,
        changed: true,
        event: {
          type: "LOCATION_CHANGED",
          from: previousLocation,
          to: state.location,
        },
        state: { ...state },
        message: `You travel to ${LOCATION_NAMES[state.location]}.`,
      };
    }

    return {
      accepted: false,
      changed: false,
      state: { ...state },
      message: "I do not understand that command. Try going to the city or the dungeon.",
    };
  }

  function getState() {
    return { ...state };
  }

  return {
    processIntent,
    getState,
  };
}
