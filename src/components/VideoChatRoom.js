import React from "react";
import "./../App.css";
// Video 컴포넌트 - 실제 프로젝트에서는 비디오 스트림을 표시합니다.
const Video = ({ name }) => {
  return (
    <div className="video">
      <video autoPlay muted></video>
      <div className="name">{name}</div>
    </div>
  );
};

// VideoChatRoom 컴포넌트 - 비디오 스트림을 표시하는 Video 컴포넌트를 배열합니다.
const VideoChatRoom = ({ participants }) => {
  return (
    <div className="video-chat-room">
      {participants.map((participant) => (
        <Video key={participant.name} name={participant.name} />
      ))}
    </div>
  );
};

export default VideoChatRoom;
