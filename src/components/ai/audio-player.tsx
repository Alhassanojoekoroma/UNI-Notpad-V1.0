"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  Play,
  Pause,
  Square,
  Download,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface AudioPlayerProps {
  script: string;
  audioBase64?: string | null;
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function base64ToBlob(base64: string, mimeType = "audio/mpeg"): Blob {
  const byteChars = atob(base64);
  const byteNumbers = new Uint8Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) {
    byteNumbers[i] = byteChars.charCodeAt(i);
  }
  return new Blob([byteNumbers], { type: mimeType });
}

// HTML5 Audio mode
function Html5Player({ audioBase64 }: { audioBase64: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioUrl = useMemo(() => {
    const blob = base64ToBlob(audioBase64);
    return URL.createObjectURL(blob);
  }, [audioBase64]);

  useEffect(() => {
    return () => {
      URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoaded = () => setDuration(audio.duration);
    const onEnded = () => setPlaying(false);

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
    } else {
      audio.play();
    }
    setPlaying(!playing);
  };

  const handleSeek = (value: number | readonly number[], _eventDetails: unknown) => {
    const time = Array.isArray(value) ? value[0] : value;
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = audioUrl;
    a.download = "audio-overview.mp3";
    a.click();
  };

  return (
    <>
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={togglePlay}
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
        </Button>

        <span className="w-10 text-center font-mono text-xs text-muted-foreground">
          {formatTime(currentTime)}
        </span>

        <Slider
          value={[currentTime]}
          min={0}
          max={duration || 1}
          onValueChange={handleSeek}
          className="flex-1"
        />

        <span className="w-10 text-center font-mono text-xs text-muted-foreground">
          {formatTime(duration)}
        </span>

        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleDownload}
          aria-label="Download audio"
        >
          <Download className="size-4" />
        </Button>
      </div>
    </>
  );
}

// Web Speech API mode
function SpeechPlayer({ script }: { script: string }) {
  const [playing, setPlaying] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>("");
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    const loadVoices = () => {
      const available = window.speechSynthesis.getVoices();
      setVoices(available);
      if (available.length > 0 && !selectedVoice) {
        const defaultVoice =
          available.find((v) => v.default) ?? available[0];
        setSelectedVoice(defaultVoice.name);
      }
    };

    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
      window.speechSynthesis.cancel();
    };
  }, []);

  const handlePlay = useCallback(() => {
    if (playing) {
      window.speechSynthesis.pause();
      setPlaying(false);
      return;
    }

    // If paused, resume
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setPlaying(true);
      return;
    }

    // Start fresh
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(script);
    const voice = voices.find((v) => v.name === selectedVoice);
    if (voice) utterance.voice = voice;

    utterance.onend = () => setPlaying(false);
    utterance.onerror = () => setPlaying(false);

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setPlaying(true);
  }, [playing, script, voices, selectedVoice]);

  const handleStop = () => {
    window.speechSynthesis.cancel();
    setPlaying(false);
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={handlePlay}
        aria-label={playing ? "Pause" : "Play"}
      >
        {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
      </Button>

      <Button
        variant="ghost"
        size="icon-sm"
        onClick={handleStop}
        aria-label="Stop"
        disabled={!playing}
      >
        <Square className="size-4" />
      </Button>

      {voices.length > 0 && (
        <Select value={selectedVoice} onValueChange={(v) => v && setSelectedVoice(v)}>
          <SelectTrigger className="h-7 max-w-48 text-xs">
            <SelectValue placeholder="Voice" />
          </SelectTrigger>
          <SelectContent>
            {voices.map((voice) => (
              <SelectItem key={voice.name} value={voice.name}>
                {voice.name} ({voice.lang})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}

export function AudioPlayer({ script, audioBase64 }: AudioPlayerProps) {
  const [scriptOpen, setScriptOpen] = useState(false);

  return (
    <Card size="sm">
      <CardContent>
        {audioBase64 ? (
          <Html5Player audioBase64={audioBase64} />
        ) : (
          <SpeechPlayer script={script} />
        )}

        <Collapsible open={scriptOpen} onOpenChange={setScriptOpen}>
          <CollapsibleTrigger
            render={
              <button
                type="button"
                className="mt-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                {scriptOpen ? (
                  <ChevronUp className="size-3" />
                ) : (
                  <ChevronDown className="size-3" />
                )}
                {scriptOpen ? "Hide script" : "Show script"}
              </button>
            }
          />
          <CollapsibleContent>
            <div className="mt-2 max-h-48 overflow-y-auto rounded-md bg-muted p-3 text-xs leading-relaxed text-muted-foreground">
              {script}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
