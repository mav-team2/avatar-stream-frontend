import React from "react";
import useHlsPlayer from "../hooks/useHlsPlayer";
import "./VideoPlayer.css";

const VideoPlayer: React.FC = () => {
  const { videoRef } = useHlsPlayer();

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

export default VideoPlayer;
