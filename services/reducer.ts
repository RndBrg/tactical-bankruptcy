import {
  getActivePlayer,
  getActivePlayerTurns,
  getActiveRound,
  getActiveTurn,
  getHasActivePlayerPassed,
  getNextPlayer,
  getNextPlayerIndex,
  getNextRound,
} from './selectors'
import { Player, Round, Turn } from './types'

export type State = {
  turns: Turn[]
  rounds: Round[]
  players: Player[]
  activeRoundIndex: number
  activePlayerIndex: number
}

export type Actions =
  | { type: 'START_ROUND' }
  | { type: 'START_PLAYER_TURN' }
  | { type: 'END_PLAYER_TURN'; data: { type: Turn['type'] } }

export const reducer = (state: State, action: Actions): State => {
  switch (action.type) {
    case 'START_ROUND':
      const activeRound = getActiveRound(state)

      return {
        ...state,
        rounds: [
          ...state.rounds.slice(0, -1),
          { ...activeRound, startTime: Date.now() },
          {
            startTime: null,
            playerOrder: [],
          },
        ],
        turns: [
          ...state.turns,
          {
            startTime: Date.now(),
            roundIndex: state.activeRoundIndex,
            playerColor: activeRound.playerOrder[0],
          },
        ],
      }
    case 'END_PLAYER_TURN':
      const activeTurn = getActiveTurn(state)
      const activePlayer = getActivePlayer(state)
      const hasActivePlayerPassed = getHasActivePlayerPassed(state)
      const nextRound = getNextRound(state)
      const nextPlayerIndex = getNextPlayerIndex(state)
      const nextPlayer = getNextPlayer(state)
      const isFirstTimePassing = !hasActivePlayerPassed && action.data.type === 'pass'
      const isLastPassForRound =
        isFirstTimePassing && nextRound.playerOrder.length === state.players.length - 1

      return {
        ...state,
        turns: [
          ...state.turns.slice(0, -1),
          { ...activeTurn, endTime: Date.now(), type: action.data.type },
          ...(isLastPassForRound
            ? []
            : [
                {
                  startTime: Date.now(),
                  roundIndex: state.activeRoundIndex,
                  playerColor: nextPlayer.color,
                },
              ]),
        ],
        rounds: isFirstTimePassing
          ? [
              ...state.rounds.slice(0, -1),
              { ...nextRound, playerOrder: [...nextRound.playerOrder, activePlayer.color] },
            ]
          : state.rounds,
        activeRoundIndex: isLastPassForRound ? state.activeRoundIndex + 1 : state.activeRoundIndex,
        activePlayerIndex: isLastPassForRound ? 0 : nextPlayerIndex,
      }
  }

  return state
}

export const defaultPlayers: Player[] = [
  {
    name: 'Sean',
    color: 'gray',
    isAlien: false,
  },
  {
    name: 'Ryan',
    color: 'red',
    isAlien: false,
  },
  {
    name: 'Alan',
    color: 'blue',
    isAlien: false,
  },
]

export const defaultState: State = {
  turns: [],
  rounds: [{ startTime: null, playerOrder: defaultPlayers.map(player => player.color) }],
  players: defaultPlayers,
  activeRoundIndex: 0,
  activePlayerIndex: 0,
}
