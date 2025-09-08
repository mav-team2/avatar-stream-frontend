import React from "react";
import useWebRTCPlayer from "../hooks/useWebRTCPlayer";
import "./VideoPlayer.css";

const WebRTCPlayer: React.FC = () => {
  const { videoRef } = useWebRTCPlayer();

  return (
    <video
      ref={videoRef}
      className="fullscreen-video"
      muted
      autoPlay
      playsInline
    />
  );
};

export default WebRTCPlayer;