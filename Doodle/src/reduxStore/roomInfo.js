import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    isPlaying: false,
    players: [],
    roomId: 0,
    playerId: 0,
    playerName: '',
    owner:0,
    turn:0,
    maxRounds:0,
    curRound:0,
    turnEndsAt:0,
    gameRunning:false,
    turnRunning:false,
    wordLen:0,
    guessedWord:false,
    word:"",
    rightGuesses:0
}

const roomInfoSlice = createSlice({
    name: 'roomInfo',
    initialState,
    reducers: {
        changeRoomInfo: (state, action)=>{
            state.isPlaying = action.payload.isPlaying
            state.players=[...state.players, ...action.payload.players]
            state.roomId = action.payload.roomId
            state.playerId = action.payload.playerId
            state.playerName = action.payload.playerName
            state.owner = action.payload.owner
            state.turn = action.payload.turn
            state.maxRounds = action.payload.maxRounds
            state.curRound = action.payload.curRound
            state.turnEndsAt = action.payload.turnEndsAt
            state.gameRunning = action.payload.gameRunning
            state.turnRunning = action.payload.turnRunning
            state.wordLen =  action.payload.wordLen
            state.guessedWord = false
            state.word = ""
        },
        updatePlayerDetails:(state, action)=>{
            state.players = [...action.payload]
            state.players.sort((x, y)=>(x.score-y.score)*-1)
            // if(state.players.length<=1)endGame()
        },
        addPlayer:(state, action)=>{
            state.players=[...state.players, action.payload]
            state.players.sort((x, y)=>(x.score-y.score)*-1)
        },
        removePlayer:(state, action)=>{
            state.players = state.players.filter(player=>player.id!==action.payload.playerId)
            state.players.sort((x, y)=>(x.score-y.score)*-1)
            // if(state.players.length<=1)endGame()
        },
        setOwner:(state, action)=>{
            state.owner = action.payload
        },
        startGame: (state, action)=>{//reducer used when a game is started
            state.maxRounds = action.payload.maxRounds
            state.curRound = action.payload.curRound
            state.turn = action.payload.turn
            state.gameRunning = action.payload.gameRunning
            state.turnRunning = action.payload.turnRunning
            state.wordLen = action.payload.wordLen
            state.turnEndsAt = action.payload.turnEndsAt
            state.rightGuesses = 0
        },
        setGuessedWord: (state, action)=>{
            state.guessedWord = action.payload
        },
        setWord: (state, action)=>{
            state.word = action.payload
        },
        changePlayerDetails:(state, action)=>{
            state.players=[...action.payload]
            state.players.sort((x, y)=>(x.score-y.score)*-1)
        },
        endTurn:(state)=>{
            state.guessedWord = false;
            state.wordLen = 0;
            state.word = ""
            state.turnRunning = false
            state.rightGuesses = 0
        },
        endGame:(state)=>{
            state.gameRunning =  false,
            state.turnRunning = false,
            state.wordLen = 0,
            state.guessedWord =  false,
            state.word = "",
            state.curRound = 0,
            state.maxRounds = 0
            state.rightGuesses = 0
        },
        rightGuess:(state)=>{
            state.rightGuesses+=1 
        },
        resetScores:(state)=>{
            state.players.forEach((player)=>{
                player.score = 0;
            })
        }
    }
})


export const {endGame, endTurn, changeRoomInfo, addPlayer, updatePlayerDetails, removePlayer, setOwner, startGame, setGuessedWord, setWord, rightGuess, resetScores} = roomInfoSlice.actions


export default roomInfoSlice.reducer