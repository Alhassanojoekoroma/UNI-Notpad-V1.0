"use client";

import { Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type ChatSettings = {
  learningLevel?: string;
  chatStyle?: string;
  responseLength?: string;
  customInstructions?: string;
};

interface ChatSettingsProps {
  settings: ChatSettings;
  onChange: (settings: ChatSettings) => void;
}

export function ChatSettingsPopover({ settings, onChange }: ChatSettingsProps) {
  const update = (patch: Partial<ChatSettings>) => {
    onChange({ ...settings, ...patch });
  };

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="ghost" size="icon" aria-label="Chat settings">
            <Settings2 className="size-4" />
          </Button>
        }
      />
      <PopoverContent align="end" className="w-80">
        <PopoverHeader>
          <PopoverTitle>Chat Settings</PopoverTitle>
        </PopoverHeader>

        <div className="flex flex-col gap-4">
          {/* Learning Level */}
          <fieldset className="flex flex-col gap-2">
            <Label className="text-xs text-muted-foreground">
              Learning Level
            </Label>
            <RadioGroup
              value={settings.learningLevel ?? "intermediate"}
              onValueChange={(value: string) =>
                update({ learningLevel: value })
              }
              className="flex gap-3"
            >
              {(["beginner", "intermediate", "advanced"] as const).map(
                (level) => (
                  <div key={level} className="flex items-center gap-1.5">
                    <RadioGroupItem value={level} />
                    <Label className="text-xs capitalize">{level}</Label>
                  </div>
                )
              )}
            </RadioGroup>
          </fieldset>

          {/* Chat Style */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Chat Style</Label>
            <Select
              value={settings.chatStyle ?? "default"}
              onValueChange={(value) => value && update({ chatStyle: value })}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="learning-guide">Learning Guide</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Response Length */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">
              Response Length
            </Label>
            <Select
              value={settings.responseLength ?? "default"}
              onValueChange={(value) =>
                value && update({ responseLength: value })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="shorter">Shorter</SelectItem>
                <SelectItem value="longer">Longer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Custom Instructions */}
          {settings.chatStyle === "custom" && (
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">
                Custom Instructions
                <span className="ml-1 text-muted-foreground/60">
                  ({(settings.customInstructions ?? "").length}/500)
                </span>
              </Label>
              <Textarea
                placeholder="Tell the AI how you'd like it to respond..."
                value={settings.customInstructions ?? ""}
                onChange={(e) => {
                  const value = e.target.value.slice(0, 500);
                  update({ customInstructions: value });
                }}
                maxLength={500}
                rows={3}
                className="min-h-0 text-xs"
              />
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
