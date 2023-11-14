import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";

const SERVER_URL = "http://localhost:3001";

const VideoChat = () => {
  const [socket, setSocket] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const localVideoRef = useRef(null);
  const peerConnections = useRef({});

  const [name, setName] = useState("");
  const [room, setRoom] = useState("");

  const joinRoom = () => {
    if (socket && name !== "" && room !== "") {
      // 이름과 방 번호가 제대로 입력되었는지 확인
      socket.emit("join room", { name, room });
    }
  };

  useEffect(() => {
    const newSocket = io(SERVER_URL);
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Connected to the signaling server");
    });

    newSocket.on("connect_error", (err) => {
      console.error("Connection failed:", err);
    });

    return () => newSocket.close();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const configuration = {
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    };

    const getMedia = async () => {
      try {
        // 미디어 장치에 대한 제약 조건을 설정합니다.
        const constraints = {
          video: true, // 비디오를 사용할 것임
          audio: true, // 오디오를 사용할 것임
        };

        // 사용 가능한 미디어 입력 장치를 요청합니다.
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        setLocalStream(stream);

        // 선택한 스트림을 비디오 태그에 연결합니다.
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error("Error accessing media devices.", error);
      }
    };
    const getMediaDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(
          (device) => device.kind === "videoinput"
        );
        const audioDevices = devices.filter(
          (device) => device.kind === "audioinput"
        );

        // 사용자에게 장치를 선택하게 하고, 선택된 deviceId를 constraints에 사용
        const constraints = {
          video: { deviceId: { exact: videoDevices[0].deviceId } }, // 첫 번째 비디오 장치 선택
          audio: { deviceId: { exact: audioDevices[0].deviceId } }, // 첫 번째 오디오 장치 선택
        };

        // 선택된 장치로 스트림을 요청합니다.
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        // 스트림 처리 로직...
      } catch (error) {
        console.error("Error fetching media devices.", error);
      }
    };

    getMediaDevices();
    getMedia();

    socket.on("offer", (data) => {
      const peerConnection = new RTCPeerConnection(configuration);
      peerConnections.current[data.socketId] = peerConnection;

      localStream
        .getTracks()
        .forEach((track) => peerConnection.addTrack(track, localStream));

      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("ice-candidate", {
            target: data.socketId,
            candidate: event.candidate,
          });
        }
      };

      peerConnection
        .setRemoteDescription(new RTCSessionDescription(data.sdp))
        .then(() => peerConnection.createAnswer())
        .then((answer) => peerConnection.setLocalDescription(answer))
        .then(() => {
          socket.emit("answer", {
            sdp: peerConnection.localDescription,
            receiver: data.socketId,
          });
        });

      peerConnection.ontrack = (event) => {
        // Here you would add the stream to a video tag to display it
      };
    });

    socket.on("answer", (data) => {
      const peerConnection = peerConnections.current[data.socketId];
      peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));
    });

    socket.on("ice-candidate", (data) => {
      const peerConnection = peerConnections.current[data.socketId];
      peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
    });

    return () => {
      Object.values(peerConnections.current).forEach((pc) => pc.close());
    };
  }, [socket, localStream]);

  return (
    <div>
      <input
        type="text"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        type="text"
        placeholder="Room"
        value={room}
        onChange={(e) => setRoom(e.target.value)}
      />
      <button onClick={joinRoom}>Join Room</button>{" "}
      {/* 버튼 클릭 시 joinRoom 호출 */}
      <video ref={localVideoRef} autoPlay muted />
      {/* 원격 비디오 스트림을 표시할 <video> 태그들을 여기에 추가할 수 있습니다. */}
    </div>
  );
};

export default VideoChat;
