import React, { useState } from "react";
import "./App.css";
import VideoChat from "./components/VideoChat";

const App = () => {
  const [name, setName] = useState("");
  const [room, setRoom] = useState("");

  const [inRoom, setInRoom] = useState(false);
  const handleJoinRoom = (e) => {
    e.preventDefault();
    setInRoom(true);
  };

  // const tempParticipants = [
  //   { name: "Alice" },
  //   { name: "Bob" },
  //   { name: "Charlie" },
  // ];

  return (
    <div className="App">
      {!inRoom ? ( // inRoom 상태가 false일 때, 즉 사용자가 방에 입장하지 않았을 때
        <form onSubmit={handleJoinRoom}>
          <input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            type="text"
            placeholder="Enter room number"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
          />
          <button type="submit">Join Room</button>
        </form>
      ) : (
        // inRoom 상태가 true일 때, 즉 사용자가 방에 입장했을 때
        <VideoChat name={name} room={room} />
      )}
    </div>
  );
};

export default App;
