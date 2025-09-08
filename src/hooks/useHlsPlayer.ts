import { useEffect, useRef, RefObject } from 'react';
import Hls from 'hls.js';

interface UseHlsPlayerReturn {
  videoRef: RefObject<HTMLVideoElement | null>;
}

const useHlsPlayer = (): UseHlsPlayerReturn => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const streamUrl =
      window.location.hostname === "localhost"
        ? "http://localhost:8888/mystream/index.m3u8"
        : "http://mediamtx:8888/mystream/index.m3u8";

    if (Hls.isSupported()) {
      const hls = new Hls();

      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log("HLS manifest loaded, starting playback");
        video.play().catch((error) => {
          console.error("Error starting video playback:", error);
        });
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error("HLS error:", event, data);
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.error(
                "Fatal network error encountered, trying to recover"
              );
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.error("Fatal media error encountered, trying to recover");
              hls.recoverMediaError();
              break;
            default:
              console.error("Fatal error encountered, destroying HLS instance");
              hls.destroy();
              break;
          }
        }
      });

      return () => {
        hls.destroy();
      };
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = streamUrl;
      video.addEventListener("loadedmetadata", () => {
        console.log("Native HLS support detected, starting playback");
        video.play().catch((error) => {
          console.error("Error starting video playback:", error);
        });
      });
    } else {
      console.error("HLS is not supported in this browser");
    }
  }, []);

  return { videoRef };
};

export default useHlsPlayer;