
import { useState } from "react";
import { widgetRegistry } from "./widgets/registry";
import { defaultWidgetOrder } from "./DashboardGrid";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Save, RotateCcw, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useI18n } from "@/lib/i18n-context";

interface DashboardBuilderProps {
    currentConfig: { widgets: string[] } | null;
    onSave: (newConfig: { widgets: string[] }) => void;
    onCancel: () => void;
}

export function DashboardBuilder({ currentConfig, onSave, onCancel }: DashboardBuilderProps) {
    const { t } = useI18n();
    const { toast } = useToast();
    // Initialize with current config or default, ensuring we know about ALL available widgets
    // We want to show a list of all widgets to enable/disable

    // State: ordered list of currently enabled widget IDs
    const [enabledWidgets, setEnabledWidgets] = useState<string[]>(
        currentConfig?.widgets || defaultWidgetOrder
    );

    // Helper to toggle a widget
    const toggleWidget = (widgetId: string) => {
        setEnabledWidgets(prev => {
            if (prev.includes(widgetId)) {
                return prev.filter(id => id !== widgetId);
            } else {
                // Add to end
                return [...prev, widgetId];
            }
        });
    };

    const handleSave = () => {
        onSave({ widgets: enabledWidgets });
        toast({
            title: t('common.save') + "...",
            description: "Your layout preferences are being saved.",
        });
    };

    const handleReset = () => {
        setEnabledWidgets(defaultWidgetOrder);
    };

    return (
        <div className="bg-muted/30 border rounded-xl p-6 mb-6 animate-in fade-in slide-in-from-top-4">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-lg font-semibold flex items-center gap-2">{t('dashboard.customizeWidgets')}</h2>
                    <p className="text-sm text-muted-foreground">{t('dashboard.welcome')}</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={handleReset}>
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Reset
                    </Button>
                    <Button variant="outline" size="sm" onClick={onCancel}>
                        <X className="w-4 h-4 mr-2" />
                        {t('common.cancel')}
                    </Button>
                    <Button size="sm" onClick={handleSave}>
                        <Save className="w-4 h-4 mr-2" />
                        {t('common.save')}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {widgetRegistry.map((widget) => {
                    const isEnabled = enabledWidgets.includes(widget.id);

                    return (
                        <div
                            key={widget.id}
                            className={`flex items-center justify-between p-4 rounded-lg border transition-all ${isEnabled ? 'bg-card border-primary/50 shadow-sm' : 'bg-muted/50 border-transparent opacity-70'}`}
                        >
                            <div className="flex items-center gap-3">
                                <Switch
                                    id={`widget-${widget.id}`}
                                    checked={isEnabled}
                                    onCheckedChange={() => toggleWidget(widget.id)}
                                />
                                <div className="space-y-0.5">
                                    <Label htmlFor={`widget-${widget.id}`} className="font-medium cursor-pointer">
                                        {t(`dashboard.widgets.${widget.id}.label`)}
                                    </Label>
                                    <p className="text-xs text-muted-foreground line-clamp-1">
                                        {t(`dashboard.widgets.${widget.id}.description`)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <p className="text-xs text-muted-foreground mt-4 text-center">
                * Drag and drop reordering coming soon in v2.
            </p>
        </div>
    );
}
