import { useState, useRef, useEffect, useCallback } from 'react';

export interface AudioDevice {
  deviceId: string;
  label: string;
}

export interface AudioRecorderState {
  isRecording: boolean;
  duration: number;
  audioBlob: Blob | null;
  audioBase64: string | null;
  audioUrl: string | null;
  mimeType: string;
  error: string | null;
  errorType:
    | 'permission_denied'
    | 'device_not_found'
    | 'in_use'
    | 'unsupported'
    | 'iframe_blocked'
    | 'insecure_context'
    | 'unknown'
    | null;
  permissionStatus: 'prompt' | 'granted' | 'denied' | 'unsupported';
  isCheckingPermission: boolean;
  audioLevel: number;
  frequencyBands: number[];
  availableDevices: AudioDevice[];
  selectedDeviceId: string;
  isIframe: boolean;
}

export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState('audio/webm');
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<AudioRecorderState['errorType']>(null);
  const [permissionStatus, setPermissionStatus] = useState<AudioRecorderState['permissionStatus']>('prompt');
  const [isCheckingPermission, setIsCheckingPermission] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [frequencyBands, setFrequencyBands] = useState<number[]>(new Array(16).fill(4));
  const [availableDevices, setAvailableDevices] = useState<AudioDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [isIframe, setIsIframe] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastMeterUpdateRef = useRef<number>(0);
  const stopResolverRef = useRef<((value: { base64: string; blob: Blob; mimeType: string; duration: number }) => void) | null>(null);

  useEffect(() => {
    try {
      setIsIframe(window.self !== window.top);
    } catch {
      setIsIframe(true);
    }
  }, []);

  const refreshDevices = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices
        .filter((d) => d.kind === 'audioinput')
        .map((d, index) => ({
          deviceId: d.deviceId,
          label: d.label || `Microfone ${index + 1}`,
        }));
      setAvailableDevices(audioInputs);
      if (audioInputs.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(audioInputs[0].deviceId);
      }
    } catch {
      // Ignore enumeration error
    }
  }, [selectedDeviceId]);


  // Limpeza de recursos e timers ao desmontar o hook
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    setIsCheckingPermission(true);
    setError(null);
    setErrorType(null);

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('NOT_SUPPORTED');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Release tracks immediately
      stream.getTracks().forEach((track) => track.stop());
      setPermissionStatus('granted');
      await refreshDevices();
      setIsCheckingPermission(false);
      return true;
    } catch (err: any) {
      setIsCheckingPermission(false);
      const name = err?.name || '';

      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        setPermissionStatus('denied');
        setErrorType(isIframe ? 'iframe_blocked' : 'permission_denied');
        setError(
          isIframe
            ? 'Acesso ao microfone foi bloqueado. Verifique se a permissão foi concedida ou abra o app em uma nova aba.'
            : 'Permissão de microfone negada. Clique no ícone de cadeado na barra de endereços para permitir.',
        );
      } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        setErrorType('device_not_found');
        setError('Nenhum microfone encontrado. Conecte um microfone e tente novamente.');
      } else if (name === 'NotReadableError' || name === 'TrackStartError') {
        setErrorType('in_use');
        setError('O microfone já está em uso por outro aplicativo ou aba.');
      } else {
        setErrorType('unknown');
        setError(`Não foi possível acessar o microfone (${name || err.message}).`);
      }
      return false;
    }
  }, [isIframe, refreshDevices]);

  // Visualizer de alta fluidez com Web Audio API, suavização exponencial e limitação de taxa para não sobrecarregar o React
  const startLevelMeter = (stream: MediaStream) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.85; // Suavização acústica orgânica (evita solavancos)
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const timeData = new Uint8Array(bufferLength);
      const freqData = new Uint8Array(bufferLength);

      let smoothedLevel = 0;

      const update = () => {
        if (!analyserRef.current) return;

        // Análise temporal (RMS para intensidade do volume)
        analyserRef.current.getByteTimeDomainData(timeData);
        let sumSquares = 0;
        for (let i = 0; i < bufferLength; i++) {
          const norm = (timeData[i] - 128) / 128;
          sumSquares += norm * norm;
        }
        const rms = Math.sqrt(sumSquares / bufferLength);
        // Converte para escala perceptiva dinâmica (0 a 100) com ganho de fala humana
        const instantLevel = Math.min(100, Math.round(rms * 220));
        // Média móvel exponencial para animação física natural
        smoothedLevel = smoothedLevel * 0.75 + instantLevel * 0.25;

        // Análise de frequências para as 16 barras do equalizador
        analyserRef.current.getByteFrequencyData(freqData);

        const now = performance.now();
        // Atualiza o estado do React a ~30fps para máxima fluidez sem travar a interface
        if (now - lastMeterUpdateRef.current >= 33) {
          lastMeterUpdateRef.current = now;
          setAudioLevel(Math.round(smoothedLevel));

          const bands: number[] = [];
          const step = Math.floor(bufferLength / 16);
          for (let i = 0; i < 16; i++) {
            let bandSum = 0;
            const start = i * step;
            const end = start + step;
            for (let j = start; j < end; j++) {
              bandSum += freqData[j] || 0;
            }
            const bandAvg = bandSum / step;
            // Altura normalizada entre 8% e 100% para manter vida visual mesmo em pausas
            const height = Math.max(8, Math.min(100, Math.round((bandAvg / 200) * 100)));
            bands.push(height);
          }
          setFrequencyBands(bands);
        }

        animFrameRef.current = requestAnimationFrame(update);
      };

      update();
    } catch {
      // Audio meter fallback silencioso
    }
  };

  const stopLevelMeter = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setAudioLevel(0);
    setFrequencyBands(new Array(16).fill(4));
  };

  const startRecording = useCallback(async () => {
    setError(null);
    setErrorType(null);
    setAudioBlob(null);
    setAudioBase64(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    chunksRef.current = [];
    setDuration(0);

    let stream: MediaStream;
    try {
      const constraints: MediaStreamConstraints = {
        audio: selectedDeviceId
          ? { deviceId: { exact: selectedDeviceId }, echoCancellation: true, noiseSuppression: true }
          : { echoCancellation: true, noiseSuppression: true },
      };

      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (firstErr) {
        // Fallback sem restrições estritas
        stream = await navigator.mediaDevices.getUserMedia({
          audio: selectedDeviceId ? { deviceId: { exact: selectedDeviceId } } : true,
        });
      }
    } catch (err: any) {
      const name = err?.name || '';
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        setPermissionStatus('denied');
        setErrorType(isIframe ? 'iframe_blocked' : 'permission_denied');
        setError(
          isIframe
            ? 'Acesso ao microfone foi negado na visualização incorporada. Abra em uma nova aba para gravar.'
            : 'Permissão de acesso ao microfone foi negada no navegador. Permita o uso nas configurações para iniciar a gravação.',
        );
      } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        setErrorType('device_not_found');
        setError('Nenhum microfone encontrado. Conecte um microfone e tente novamente.');
      } else if (name === 'NotReadableError' || name === 'TrackStartError') {
        setErrorType('in_use');
        setError('O microfone já está em uso por outro programa ou aplicativo.');
      } else {
        setErrorType('unknown');
        setError('Não foi possível acessar o microfone para iniciar a gravação.');
      }
      return;
    }

    audioStreamRef.current = stream;
    setPermissionStatus('granted');
    refreshDevices();
    startLevelMeter(stream);

    // Seleciona o melhor tipo MIME suportado
    let chosenMime = 'audio/webm';
    if (typeof MediaRecorder !== 'undefined') {
      const types = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4',
      ];
      for (const t of types) {
        if (MediaRecorder.isTypeSupported(t)) {
          chosenMime = t;
          break;
        }
      }
    }
    setMimeType(chosenMime);

    try {
      const recorder = new MediaRecorder(stream, { mimeType: chosenMime });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const fullBlob = new Blob(chunksRef.current, { type: chosenMime });
        setAudioBlob(fullBlob);

        const localUrl = URL.createObjectURL(fullBlob);
        setAudioUrl(localUrl);

        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          setAudioBase64(base64);

          // Se havia alguém aguardando a finalização via stopAndGetAudio(), resolve a Promise
          if (stopResolverRef.current) {
            stopResolverRef.current({
              base64,
              blob: fullBlob,
              mimeType: chosenMime,
              duration,
            });
            stopResolverRef.current = null;
          }
        };
        reader.readAsDataURL(fullBlob);

        stopLevelMeter();
        if (audioStreamRef.current) {
          audioStreamRef.current.getTracks().forEach((t) => t.stop());
          audioStreamRef.current = null;
        }
      };

      recorder.start(250);
      setIsRecording(true);

      timerRef.current = window.setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } catch (recorderErr) {
      stopLevelMeter();
      stream.getTracks().forEach((t) => t.stop());
      setError('Falha ao instanciar o gravador de áudio.');
      setErrorType('unknown');
    }
  }, [selectedDeviceId, isIframe, audioUrl, duration, refreshDevices]);

  const stopRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  }, []);

  // Método assíncrono robusto: finaliza e aguarda o base64 com garantia e timeout
  const stopAndGetAudio = useCallback(async (): Promise<{
    base64: string;
    blob: Blob;
    mimeType: string;
    duration: number;
  }> => {
    // Se já está parado e já tem o base64
    if (!isRecording && audioBase64 && audioBlob) {
      return {
        base64: audioBase64,
        blob: audioBlob,
        mimeType,
        duration,
      };
    }

    // Se ainda está gravando, solicita a parada e aguarda o evento onstop
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        stopResolverRef.current = null;
        reject(new Error('Tempo limite excedido ao converter o áudio gravado.'));
      }, 5000);

      stopResolverRef.current = (result) => {
        clearTimeout(timeout);
        resolve(result);
      };

      stopRecording();
    });
  }, [isRecording, audioBase64, audioBlob, mimeType, duration, stopRecording]);

  const resetRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    stopLevelMeter();
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((t) => t.stop());
      audioStreamRef.current = null;
    }
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setIsRecording(false);
    setDuration(0);
    setAudioBlob(null);
    setAudioBase64(null);
    setError(null);
    setErrorType(null);
    setAudioLevel(0);
    setFrequencyBands(new Array(16).fill(4));
    chunksRef.current = [];
    stopResolverRef.current = null;
  }, [audioUrl]);

  return {
    isRecording,
    duration,
    audioBlob,
    audioBase64,
    audioUrl,
    mimeType,
    error,
    errorType,
    permissionStatus,
    isCheckingPermission,
    audioLevel,
    frequencyBands,
    availableDevices,
    selectedDeviceId,
    setSelectedDeviceId,
    isIframe,
    startRecording,
    stopRecording,
    stopAndGetAudio,
    resetRecording,
    requestPermission,
    refreshDevices,
  };
}
