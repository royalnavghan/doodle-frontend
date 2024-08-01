import React, { useEffect, memo, useMemo } from "react";
import CanvasDraw from "react-canvas-draw";
import { useState, useRef } from "react";
import { Slider } from "rsuite";
import "rsuite/Slider/styles/index.css";
import "rsuite/RangeSlider/styles/index.css";
import { client } from "stompjs";
import { useDispatch, useSelector } from "react-redux";
import { generateSlug } from "random-word-slugs";
import { toast } from "react-toastify";
import {
  setWord,
  endGame,
  setOwner,
  removePlayer,
  addPlayer,
  startGame as start,
} from "../reduxStore/roomInfo";
import ScorePage from "./score/ScorePage";
import FinalScorePage from "./score/FinalScorePage";
import { showFinalScorePage, changeDetails } from "../reduxStore/scorePage";

const Canvas = () => {
  const dispatcher = useDispatch();
  const playerId = useSelector((state) => state.roomInfo.playerId);
  const roomId = useSelector((state) => state.roomInfo.roomId);
  const owner = useSelector((state) => state.roomInfo.owner);
  const turn = useSelector((state) => state.roomInfo.turn);
  const gameRunning = useSelector((state) => state.roomInfo.gameRunning);
  const turnRunning = useSelector((state) => state.roomInfo.turnRunning);
  const players = useSelector((state) => state.roomInfo.players);
  const scorePageVisible = useSelector(
    (state) => state.scorePage.isScoreVisible
  );
  const finalScorePageVisible = useSelector(
    (state) => state.scorePage.isFinalScoreVisible
  );

  const sketchPad = useRef({});
  const strokeWidthController = useRef();

  const [width, setWidth] = new useState(Math.min(800, window.innerWidth));
  const [height, setHeight] = new useState((window.innerHeight * 57) / 100);
  const [strokeColor, setStrokeColor] = useState("black");
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [strokeWidthControllerVisibility, setStrokeWidthControllerVisibility] =
    useState(false);
  const [maximumRounds, setMaximumRounds] = useState(3);
  const [drawTime, setDrawTime] = useState(90);

  const StompConnection = useMemo(() => {
    const con = client(`${import.meta.env.VITE_WEB_SERVICE_URL}/ws`);
    con.debug = () => {};
    return con;
  }, []);

  const sendSketch = (sketch) => {
    if(playerId!==turn)return ;
    StompConnection.send(
      `/app/drawing/${roomId}`,
      {},
      JSON.stringify({ senderId: playerId, drawing: sketch })
    );
  };

  const getPlayerName = (players, id) => {
    let ans;
    players.forEach((player) => {
      if (player.id === id) ans = player.name;
    });
    return ans;
  };

  const subscribe = () => {
    const con = client(`${import.meta.env.VITE_WEB_SERVICE_URL}/ws`);
    con.debug = () => {};
    con.connect({}, () => {
      con.subscribe(`/topic/drawing/${roomId}`, (sketch) => {
        sketch = JSON.parse(sketch.body);
        if (sketch.senderId !== playerId) {
          sketchPad.current.loadSaveData(sketch.drawing);
        }
      });
      con.subscribe(`/topic/endgame/${roomId}`, (data) => {
        data = JSON.parse(data.body);
        if (data.endGame) {
          dispatcher(showFinalScorePage());
          dispatcher(endGame());
        }
      });
      con.subscribe(`/topic/newplayer/${roomId}`, (player) => {
        player = JSON.parse(player.body);
        dispatcher(addPlayer(player));
      });
      con.subscribe(`/topic/removeplayer/${roomId}`, (player) => {
        player = JSON.parse(player.body);
        dispatcher(removePlayer(player));
        dispatcher(setOwner(player.newOwner));
      });
      con.subscribe(`/topic/endturn/${roomId}`, (data) => {
        data = JSON.parse(data.body);
        const newPlayers = data.players;
        dispatcher(
          changeDetails({
            players: newPlayers,
            word: data.word,
          })
        );
        dispatcher(setOwner(data.owner));
      });
      con.subscribe(`/topic/roominfo/${roomId}`, (roomInfo) => {
        roomInfo = JSON.parse(roomInfo.body);
        dispatcher(start(roomInfo));
      });
    });
  };

  useEffect(() => {
    document.getElementById("root").addEventListener("click", (e) => {
      if (
        strokeWidthController.current &&
        !strokeWidthController.current.contains(e.target)
      )
        setStrokeWidthControllerVisibility(false);
    });
    window.addEventListener("resize", () => {
      setWidth(Math.min(800, window.innerWidth));
      setHeight((window.innerHeight * 57) / 100);
    });

    subscribe();
  }, []);

  const startGame = () => {
    fetch(`${import.meta.env.VITE_WEB_SERVICE_URL}/game/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomId: roomId,
        maxRounds: maximumRounds,
        drawTime: drawTime,
      }),
    });
  };

  const startTurn = (word) => {
    dispatcher(setWord(word));
    fetch(`${import.meta.env.VITE_WEB_SERVICE_URL}/game/turn/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomId: roomId,
        word: word,
      }),
    });
  };

  useEffect(() => {
    sketchPad.current.clear();
  }, [turn]);

  useEffect(()=>{
    setTimeout(()=>{sendSketch(sketchPad.current.getSaveData())}, 1000)
    ;
  }, [players])


  return (
    <section id="canvasContainer" className="w-full h-[60%] relative">
      {/* Shown when the game is yet to start */}
      {finalScorePageVisible && <FinalScorePage />}
      {scorePageVisible && !finalScorePageVisible && <ScorePage />}
      {!gameRunning && !finalScorePageVisible && (
        <div className=" text-white curtainDown z-20 absolute h-full w-full bg-[#000000b1] flex justify-center items-center flex-col">
          {owner === playerId ? (
            <>
              <span className="mb-6">Maximum allowed players: 8</span>
              <span className="mb-6">
                Maximum Rounds:
                <select
                  defaultValue={3}
                  onChange={(e) => setMaximumRounds(e.target.value)}
                  className="ml-1 bg-white text-black rounded-sm w-8"
                >
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                  <option value="6">6</option>
                  <option value="7">7</option>
                  <option value="8">8</option>
                </select>
              </span>
              <span className="mb-6">
                Drawtime:
                <select
                  defaultValue={90}
                  onChange={(e) => setDrawTime(e.target.value)}
                  className="ml-1 bg-white text-black rounded-sm w-18"
                >
                  <option value="20">20</option>
                  <option value="60">60</option>
                  <option value="90">90</option>
                  <option value="120">120</option>
                  <option value="200">200</option>
                  <option value="240">240</option>
                </select>
              </span>
              <button
                onClick={() => {
                  if (players.length === 1) {
                    toast.info("Waiting for more players to join.");
                  } else startGame();
                }}
                className="px-3 py-2 font-bold hover:red-400 active:bg-[#fad8de] hover:bg-[#fcb1be] transition-colors bg-pink text-white"
              >
                Start
              </button>
            </>
          ) : (
            <span className="text-white">Ask the owner to start the game</span>
          )}
        </div>
      )}
      {/* Shown when the user with turn choosing a word */}
      {gameRunning && !turnRunning && !scorePageVisible && (
        <div className=" curtainDown z-20 absolute h-full w-full bg-[#000000a3] flex justify-center items-center flex-col">
          {turn === playerId ? (
            <div className="w-fit h-fit flex flex-row justify-center items-center">
              <input
                type="button"
                value={generateSlug(1, {
                  format: "lower",
                })}
                onClick={(e) => startTurn(e.target.value)}
                className="px-2 py-1 m-2 cursor-pointer hover:scale-110 transition-all text-sm font-bold bg-transparent text-white border-white border-2"
              />
              <input
                type="button"
                value={generateSlug(1, {
                  format: "lower",
                })}
                onClick={(e) => startTurn(e.target.value)}
                className="px-2 py-1 m-2 cursor-pointer hover:scale-110 transition-all text-sm font-bold bg-transparent text-white border-white border-2"
              />
              <input
                type="button"
                value={generateSlug(1, {
                  format: "lower",
                })}
                onClick={(e) => startTurn(e.target.value)}
                className="px-2 py-1 m-2 cursor-pointer hover:scale-110 transition-all text-sm font-bold bg-transparent text-white border-white border-2"
              />
            </div>
          ) : (
            <span className="text-white">{`${getPlayerName(
              players,
              turn
            )} is choosing a word.`}</span>
          )}
        </div>
      )}
      <div
        className="w-full h-full cursor-pointer flex items-end justify-center"
      >
        <div className="w-full h-full">
          <CanvasDraw
            ref={sketchPad}
            brushRadius={strokeWidth}
            lazyRadius={0}
            brushColor={strokeColor}
            hideGrid={true}
            immediateLoading={true}
            canvasHeight={height}
            canvasWidth={width}
            catenaryColor={playerId != turn ? "white" : strokeColor}
            disabled={playerId != turn}
            onChange={()=>sendSketch(sketchPad.current.getSaveData())}
          />
        </div>

        {playerId === turn && (
          <div
            className={` bg-transparent absolute flex justify-center items-center p-1 h-max w-max mb-4 white  rounded-full`}
          >
            <span
              title="Undo"
              onClick={() => {
                sketchPad.current.undo();
              }}
              className={` text-gray-800 h-10 w-10 flex justify-center items-center rounded-full mx-1  hover:scale-125 duration-200 transition-all cursor-pointer bg-white  shadow-sm shadow-black`}
            >
              <i className="pointer-events-none fa-solid fa-rotate-left"></i>
            </span>
            <span
              title="Clear Canvas"
              onClick={() => {
                sketchPad.current.eraseAll();
              }}
              className={`text-gray-800 h-10 w-10 flex justify-center items-center rounded-full mx-1  hover:scale-125 duration-200 transition-all cursor-pointer bg-white  shadow-sm shadow-black`}
            >
              <i className="pointer-events-none fa-solid fa-trash-can"></i>
            </span>
            <span
              title="Stroke color"
              className="h-10 w-10 flex justify-center items-center mx-1 rounded-full hover:scale-125 duration-200 transition-all cursor-pointer bg-white  shadow-sm shadow-black overflow-hidden border-white border-4"
            >
              <input
                className="h-[200%] scale-150 cursor-pointer"
                type="color"
                onChange={(e) => setStrokeColor(e.target.value)}
              ></input>
            </span>
            <div
              ref={strokeWidthController}
              className="flex justify-center flex-col items-center"
            >
              <div
                onClick={() =>
                  setStrokeWidthControllerVisibility(
                    !strokeWidthControllerVisibility
                  )
                }
                title="Stroke Width"
                className="z-10 h-10 w-10 flex justify-center items-center rounded-full mx-1  hover:scale-125 duration-200 transition-all cursor-pointer bg-white  shadow-sm shadow-black"
              >
                <span
                  style={{ height: strokeWidth, width: strokeWidth }}
                  className={`bg-black rounded-full`}
                ></span>
              </div>
              <span
                className={`transition-all duration-300 overflow-hidden bg-white rounded-full pb-10 shadow-md shadow-[#00000055] ${
                  strokeWidthControllerVisibility ? "h-[30vh] " : "h-0"
                } absolute top-1 w-8 flex justify-center`}
              >
                <Slider
                  style={{ marginTop: "3.1rem", height: "85%" }}
                  onChange={(num) => setStrokeWidth(num)}
                  max={16}
                  min={2}
                  progress={true}
                  vertical={true}
                  defaultValue={4}
                />
              </span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default Canvas;
