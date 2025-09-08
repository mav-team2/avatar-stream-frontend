import { useEffect, useRef, RefObject } from 'react';

interface UseWebRTCPlayerReturn {
  videoRef: RefObject<HTMLVideoElement | null>;
}

const useWebRTCPlayer = (): UseWebRTCPlayerReturn => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let pc: RTCPeerConnection | null = null;

    const startWebRTC = async () => {
      try {
        pc = new RTCPeerConnection({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });

        pc.ontrack = (event) => {
          if (video && event.streams && event.streams[0]) {
            video.srcObject = event.streams[0];
            console.log('WebRTC stream connected');
          }
        };

        pc.oniceconnectionstatechange = () => {
          console.log('ICE connection state:', pc?.iceConnectionState);
        };

        pc.addTransceiver('video', { direction: 'recvonly' });

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        const serverUrl = window.location.hostname === "localhost"
          ? "http://localhost:8889/mystream/whep"
          : "http://mediamtx:8889/mystream/whep";

        const response = await fetch(serverUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/sdp',
          },
          body: offer.sdp,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const answer = await response.text();
        await pc.setRemoteDescription({
          type: 'answer',
          sdp: answer,
        });

        console.log('WebRTC connection established');
      } catch (error) {
        console.error('WebRTC connection failed:', error);
      }
    };

    startWebRTC();

    return () => {
      if (pc) {
        pc.close();
        console.log('WebRTC connection closed');
      }
    };
  }, []);

  return { videoRef };
};

export default useWebRTCPlayer;