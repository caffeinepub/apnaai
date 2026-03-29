import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Key, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useSetApiKey } from "../hooks/useQueries";

interface ApiKeyModalProps {
  open: boolean;
  onClose: () => void;
}

export function ApiKeyModal({ open, onClose }: ApiKeyModalProps) {
  const [key, setKey] = useState("");
  const setApiKey = useSetApiKey();

  const handleSave = async () => {
    if (!key.trim()) return;
    try {
      await setApiKey.mutateAsync(key.trim());
      toast.success("API key saved successfully");
      setKey("");
      onClose();
    } catch {
      toast.error("Failed to save API key");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        data-ocid="apikey.dialog"
        className="bg-card border border-white/10 text-foreground max-w-md"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Key className="w-5 h-5 text-primary" />
            Configure OpenAI API Key
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <Label htmlFor="api-key" className="text-muted-foreground text-sm">
            Enter your OpenAI API key to enable AI responses
          </Label>
          <Input
            id="api-key"
            data-ocid="apikey.input"
            type="password"
            placeholder="sk-..."
            value={key}
            onChange={(e) => setKey(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            className="bg-secondary border-white/10 text-foreground placeholder:text-muted-foreground focus:ring-primary"
          />
        </div>
        <DialogFooter className="gap-2">
          <Button
            data-ocid="apikey.cancel_button"
            variant="ghost"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            Cancel
          </Button>
          <Button
            data-ocid="apikey.submit_button"
            onClick={handleSave}
            disabled={!key.trim() || setApiKey.isPending}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {setApiKey.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            Save Key
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
