import { useEffect } from 'react'; // <--- you forgot this
import Peer from 'simple-peer';
import socket from './socket';

export default function VoiceChat({ room }) {
  useEffect(() => {
    let peer;
    let localStream;

    const initVoiceChat = async () => {
      localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });

      peer = new Peer({
        initiator: true,
        trickle: false,
        stream: localStream,
      });

      peer.on('signal', (data) => {
        socket.emit('voiceSignal', { room, signal: data });
      });

      peer.on('stream', (stream) => {
        const audio = document.createElement('audio');
        audio.srcObject = stream;
        audio.play();
      });
    };

    socket.on('voiceSignal', ({ signal }) => {
      if (peer) {
        peer.signal(signal);
      }
    });

    initVoiceChat();

    return () => {
      if (peer) peer.destroy();
    };
  }, [room]);

  return null; // No UI element required, just managing the voice connection
}
