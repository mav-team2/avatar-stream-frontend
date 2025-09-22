import React from "react";
import WebRTCPlayer from "../components/WebRTCPlayer";
import { AvatarCanvas } from "../components/AvatarCanvas";

const WebRTCStreamPage: React.FC = () => {
  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh" }}>
      {/* WebRTC 비디오 배경 */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 0,
        }}
      >
        <WebRTCPlayer />
      </div>

      {/* 아바타 오버레이 */}
      <AvatarCanvas
        avatarId={1}
        initialX={400}
        initialY={300}
        moveSpeed={200}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          pointerEvents: "auto",
          zIndex: 10,
        }}
      />
    </div>
  );
};

export default WebRTCStreamPage;
