import {
  getActivePlayer,
  getActiveRound,
  getActiveTurn,
  getHasActivePlayerPassed,
  getNextPlayer,
  getNextPlayerIndex,
  getNextRound,
  getNextRoundIndex,
  getPlayer,
} from './selectors'
import { Player, Round, Turn, Actions } from './types'

import { v4 } from 'uuid'

export type State = {
  turns: Turn[]
  rounds: Round[]
  players: Player[]
  activeRoundIndex: number | null
  activePlayerIndex: number
  focusedPlayerId: string | null
}

export function reducer<S extends State, A extends Actions>(state: S, action: A): State {
  switch (action.type) {
    case 'START_ROUND': {
      const nextRoundIndex = getNextRoundIndex(state)
      const nextRound = getNextRound(state)

      return {
        ...state,
        rounds: [
          ...state.rounds.slice(0, -1),
          { ...nextRound, startTime: action.data.time },
          {
            startTime: null,
            playerOrder: [],
          },
        ],
        turns: [
          ...state.turns,
          {
            startTime: action.data.time,
            roundIndex: nextRoundIndex,
            playerId: nextRound.playerOrder[0],
          },
        ],
        activeRoundIndex: nextRoundIndex,
      }
    }

    case 'RESET': {
      return {
        ...state,
        activePlayerIndex: 0,
        activeRoundIndex: null,
        focusedPlayerId: null,
        players: [],
        rounds: [
          {
            startTime: null,
            playerOrder: [],
          },
        ],
        turns: [],
      }
    }

    case 'END_PLAYER_TURN': {
      const activeTurn = getActiveTurn(state)
      const activePlayer = getActivePlayer(state)
      const hasActivePlayerPassed = getHasActivePlayerPassed(state)
      const activeRound = getActiveRound(state)
      const nextRound = getNextRound(state)
      const nextPlayerIndex = getNextPlayerIndex(state)
      const nextPlayer = getNextPlayer(state)
      const isFirstTimePassing = !hasActivePlayerPassed && action.data.type === 'pass'
      const isLastPassForRound =
        isFirstTimePassing && nextRound.playerOrder.length === state.players.length - 1

      if (!activePlayer || !nextPlayer) return state

      return {
        ...state,
        turns: [
          ...state.turns.slice(0, -1),
          { ...activeTurn, endTime: action.data.time, type: action.data.type },
          ...(isLastPassForRound
            ? []
            : [
                {
                  startTime: action.data.time,
                  roundIndex: state.activeRoundIndex,
                  playerId: nextPlayer.id,
                },
              ]),
        ],
        rounds: isFirstTimePassing
          ? [
              ...(isLastPassForRound
                ? [...state.rounds.slice(0, -2), { ...activeRound, endTime: action.data.time }]
                : state.rounds.slice(0, -1)),
              { ...nextRound, playerOrder: [...nextRound.playerOrder, activePlayer.id] },
            ]
          : state.rounds,
        activePlayerIndex: isLastPassForRound ? 0 : nextPlayerIndex,
      }
    }

    case 'ADD_PLAYER': {
      const currentRound = getActiveRound(state)
      const player = { id: v4(), ...action.data }

      return {
        ...state,
        players: [...state.players, player],
        rounds: [{ ...currentRound, playerOrder: [player.id, ...currentRound.playerOrder] }],
      }
    }

    case 'UPDATE_PLAYER_SCORE': {
      const { playerId, key, value } = action.data
      const player = getPlayer(state, playerId)

      return {
        ...state,
        players: state.players.map(p =>
          p === player ? { ...player, score: { ...player.score, [key]: value } } : p,
        ),
      }
    }

    case 'FOCUS_PLAYER': {
      return {
        ...state,
        focusedPlayerId: action.data.playerId,
      }
    }

    case 'BLUR_PLAYER': {
      return {
        ...state,
        focusedPlayerId: null,
      }
    }
  }

  return state
}

export const defaultState: State = {
  turns: [],
  rounds: [{ startTime: null, playerOrder: [] }],
  players: [],
  activeRoundIndex: null,
  activePlayerIndex: 0,
  focusedPlayerId: null,
}
