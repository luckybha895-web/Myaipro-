import React, { createContext, useContext, useState, useEffect } from "react";
import { BUILD_MODELS, resolveBuildModel, type BuildModelId } from "@/lib/models";
import { type StudioVoice, getPreferredVoice, setPreferredVoice } from "@/lib/speech";

export type AiPersona = "adaptive" | "technical" | "research" | "concise";

type AiContextType = {
  selectedModel: BuildModelId;
  setSelectedModel: (model: BuildModelId) => void;
  persona: AiPersona;
  setPersona: (p: AiPersona) => void;
  preferredVoice: StudioVoice;
  setPreferredVoice: (v: StudioVoice) => void;
  liveSearchEnabled: boolean;
  setLiveSearchEnabled: (enabled: boolean) => void;
  handleAiError: (error: unknown) => void;
};

const AiContext = createContext<AiContextType | undefined>(undefined);

export const MODELS = BUILD_MODELS.filter((model) => model.available).map((model) => ({
  id: model.id,
  name: model.label,
}));

export function AiProvider({ children }: { children: React.ReactNode }) {
  const [selectedModel, setSelectedModel] = useState(resolveBuildModel(undefined).id);
  const [persona, setPersonaState] = useState<AiPersona>("adaptive");
  const [voice, setVoiceState] = useState<StudioVoice>("Kore");
  const [liveSearchEnabled, setLiveSearchEnabled] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedPersona =
        (localStorage.getItem("creative_ai_persona") as AiPersona) || "adaptive";
      setPersonaState(storedPersona);
      setVoiceState(getPreferredVoice());
    }
  }, []);

  const setPersona = (p: AiPersona) => {
    setPersonaState(p);
    if (typeof window !== "undefined") {
      localStorage.setItem("creative_ai_persona", p);
    }
  };

  const handleVoiceChange = (v: StudioVoice) => {
    setVoiceState(v);
    setPreferredVoice(v);
  };

  const handleAiError = (error: unknown) => {
    console.error("Creative AI Engine Error:", error);
  };

  return (
    <AiContext.Provider
      value={{
        selectedModel,
        setSelectedModel,
        persona,
        setPersona,
        preferredVoice: voice,
        setPreferredVoice: handleVoiceChange,
        liveSearchEnabled,
        setLiveSearchEnabled,
        handleAiError,
      }}
    >
      {children}
    </AiContext.Provider>
  );
}

export function useAi() {
  const context = useContext(AiContext);
  if (!context) throw new Error("useAi must be used within AiProvider");
  return context;
}
