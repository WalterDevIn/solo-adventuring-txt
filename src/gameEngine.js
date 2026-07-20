const LOCATION_NAMES = {
  CITY: "the city",
  DUNGEON: "the dungeon",
};

const CITY_NPCS = {
  GUIDE: {
    name: "the Guide",
    subplace: "GUIDE_HOME",
    arrivalMessage: "You visit the Guide. He is ready to offer practical advice about the world.",
  },
  NURSE: {
    name: "the Nurse",
    subplace: "NURSE_CLINIC",
    arrivalMessage: "You visit the Nurse at her clinic. She looks prepared to treat your wounds.",
  },
  ZOOLOGIST: {
    name: "the Zoologist",
    subplace: "ZOOLOGIST_HOME",
    arrivalMessage: "You visit the Zoologist. Notes about creatures and wildlife cover the room.",
  },
};

export function createGameEngine(initialLocation = "CITY") {
  const state = {
    location: initialLocation,
    subplace: null,
  };

  function processTravelIntent(intent) {
    const isAtDestination = state.location === intent.destination;

    if (isAtDestination && state.subplace === null) {
      return {
        accepted: true,
        changed: false,
        state: { ...state },
        message: `You are already in ${LOCATION_NAMES[state.location]}.`,
      };
    }

    const previousState = { ...state };
    state.location = intent.destination;
    state.subplace = null;

    return {
      accepted: true,
      changed: true,
      event: {
        type: isAtDestination ? "SUBPLACE_EXITED" : "LOCATION_CHANGED",
        from: previousState,
        to: { ...state },
      },
      state: { ...state },
      message: isAtDestination
        ? `You return to the center of ${LOCATION_NAMES[state.location]}.`
        : `You travel to ${LOCATION_NAMES[state.location]}.`,
    };
  }

  function processVisitNpcIntent(intent) {
    const npc = CITY_NPCS[intent.npc];

    if (!npc) {
      return {
        accepted: false,
        changed: false,
        state: { ...state },
        message: "That person does not exist in this world.",
      };
    }

    if (state.location !== "CITY") {
      return {
        accepted: false,
        changed: false,
        state: { ...state },
        message: `You must return to the city before you can visit ${npc.name}.`,
      };
    }

    if (state.subplace === npc.subplace) {
      return {
        accepted: true,
        changed: false,
        state: { ...state },
        message: `You are already visiting ${npc.name}.`,
      };
    }

    const previousSubplace = state.subplace;
    state.subplace = npc.subplace;

    return {
      accepted: true,
      changed: true,
      event: {
        type: "SUBPLACE_CHANGED",
        location: state.location,
        from: previousSubplace,
        to: state.subplace,
        npc: intent.npc,
      },
      state: { ...state },
      message: npc.arrivalMessage,
    };
  }

  function processIntent(intent) {
    if (intent.type === "TRAVEL") {
      return processTravelIntent(intent);
    }

    if (intent.type === "VISIT_NPC") {
      return processVisitNpcIntent(intent);
    }

    return {
      accepted: false,
      changed: false,
      state: { ...state },
      message:
        "I do not understand that command. Try traveling to the city or dungeon, or visiting the Guide, Nurse, or Zoologist.",
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
