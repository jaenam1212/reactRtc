import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";

const SERVER_URL = "http://localhost:3001";

const VideoChat = () => {
  const [socket, setSocket] = useState(null);

  const [name, setName] = useState("");
  const [room, setRoom] = useState("");

  const [localStream, setLocalStream] = useState(null);

  const localVideoRef = useRef(null);
  const peerConnections = useRef({});
  const remoteVideoRefs = useRef({});

  useEffect(() => {
    // Socket 연결
    const newSocket = io(SERVER_URL);
    setSocket(newSocket);
    newSocket.on("connect", () => {
      console.log("Connected to the signaling server");
    });
    newSocket.on("message", (message) => {
      console.log("Message received:", message);
      // WebRTC 로직을 여기에 구현합니다.
    });
    newSocket.on("connect_error", (err) => {
      console.error("Connection failed:", err);
    });

    const configuration = {
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    };

    // 각 소켓 연결에 대한 PeerConnection 객체 생성
    socket.on("all users", (users) => {
      const peers = {};
      // 기존 사용자들에 대해 PeerConnection 생성 및 오퍼 전송
      users.forEach((userID) => {
        const peerConnection = new RTCPeerConnection(configuration);
        peerConnections.current[userID] = peerConnection;

        // ... 트랙 추가 및 ICE 후보 리스너 설정

        // 오퍼 생성 및 소켓을 통해 전송
        peerConnection
          .createOffer()
          .then((offer) => {
            return peerConnection.setLocalDescription(offer);
          })
          .then(() => {
            socket.emit("offer", {
              sdp: peerConnection.localDescription,
              receiver: userID,
            });
          });
      });
    });

    // 원격 사용자로부터 오퍼 수신 시 처리 로직
    socket.on("get offer", (data) => {
      // ... get offer 처리 로직
    });

    // 원격 사용자로부터 응답 수신 시 처리 로직
    socket.on("get answer", (data) => {
      // ... get answer 처리 로직
    });

    // 원격 사용자로부터 ICE 후보 수신 시 처리 로직
    socket.on("get ice-candidate", (data) => {
      // ... get ice-candidate 처리 로직
    });

    return () => {
      // 클린업 로직
      Object.values(peerConnections.current).forEach((pc) => pc.close());
      // ... 기타 필요한 클린업 작업
    };
  }, []);

  useEffect(() => {
    // 미디어 스트림을 가져옵니다.
    const getMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setLocalStream(stream);
        // 로컬 비디오 스트림을 <video> 태그에 연결
        const videoElement = document.getElementById("local-video");
        if (videoElement) {
          videoElement.srcObject = stream;
        }
      } catch (error) {
        console.error("Error accessing media devices.", error);
      }
    };

    getMedia();
  }, []);

  // 방에 입장하기 위해 서버에 'join' 이벤트를 보내는 함수
  const joinRoom = () => {
    if (socket) {
      socket.emit("join", { name, room });
    }
  };

  useEffect(() => {
    // ...socket connection and media stream fetching logic

    // Listen for remote offers
    socket.on("offer", handleReceiveCall);

    // Listen for remote answer
    socket.on("answer", handleAnswer);

    // Listen for ICE candidates
    socket.on("ice-candidate", handleNewICECandidateMsg);

    return () => {
      // ...clean up
    };
  }, []);

  // When user has media stream
  useEffect(() => {
    if (localStream) {
      localVideoRef.current.srcObject = localStream;
      // Emit event to join room
      socket.emit("join room", { room, name });
    }
  }, [localStream]);

  function handleReceiveCall(incoming) {
    const peerConnection = new RTCPeerConnection();
    peerConnections.current[incoming.socketId] = peerConnection;

    // Add each track from local stream to peer connection
    localStream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, localStream);
    });

    // Handle new ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", {
          target: incoming.socketId,
          candidate: event.candidate,
        });
      }
    };

    // Set up remote video stream once tracks are received
    peerConnection.ontrack = (event) => {
      // Use remoteVideoRefs to display remote streams
      // ...
    };

    // Create and send an offer to the caller
    peerConnection
      .setRemoteDescription(new RTCSessionDescription(incoming.sdp))
      .then(() => peerConnection.createAnswer())
      .then((answer) => peerConnection.setLocalDescription(answer))
      .then(() => {
        socket.emit("answer", {
          target: incoming.socketId,
          sdp: peerConnection.localDescription,
        });
      });
  }

  function handleAnswer(message) {
    const peerConnection = peerConnections.current[message.socketId];
    const desc = new RTCSessionDescription(message.sdp);
    peerConnection.setRemoteDescription(desc).catch((e) => console.log(e));
  }

  function handleNewICECandidateMsg(incoming) {
    const peerConnection = peerConnections.current[incoming.socketId];
    const candidate = new RTCIceCandidate(incoming.candidate);
    peerConnection.addIceCandidate(candidate).catch((e) => console.log(e));
  }

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
      <button onClick={joinRoom}>Join Room</button>

      <video id="local-video" autoPlay muted></video>
      <div id="remote-videos">
        {/* 원격 스트림을 표시할 <video> 태그들이 여기에 올 것입니다. */}
      </div>
    </div>
  );
};

export default VideoChat;
