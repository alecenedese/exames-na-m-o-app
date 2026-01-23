import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

interface DaySchedule {
  enabled: boolean;
  allDay: boolean;
  hasBreak: boolean;
  openTime: string;
  closeTime: string;
  breakStart: string;
  breakEnd: string;
}

export interface OpeningHoursState {
  weekdays: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

const defaultSchedule: DaySchedule = {
  enabled: false,
  allDay: false,
  hasBreak: false,
  openTime: '08:00',
  closeTime: '18:00',
  breakStart: '12:00',
  breakEnd: '13:00',
};

export const initialOpeningHours: OpeningHoursState = {
  weekdays: { ...defaultSchedule },
  saturday: { ...defaultSchedule },
  sunday: { ...defaultSchedule },
};

const timeOptions = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', 
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', 
  '18:00', '19:00', '20:00', '21:00', '22:00'
];

interface DayScheduleEditorProps {
  label: string;
  schedule: DaySchedule;
  onChange: (schedule: DaySchedule) => void;
}

function DayScheduleEditor({ label, schedule, onChange }: DayScheduleEditorProps) {
  const updateSchedule = (updates: Partial<DaySchedule>) => {
    onChange({ ...schedule, ...updates });
  };

  return (
    <div className="space-y-3 border rounded-lg p-3">
      <div className="flex items-center space-x-2">
        <Checkbox 
          id={`${label}-enabled`}
          checked={schedule.enabled}
          onCheckedChange={(checked) => updateSchedule({ enabled: checked === true })}
        />
        <label htmlFor={`${label}-enabled`} className="text-sm font-medium cursor-pointer">
          {label}
        </label>
      </div>

      {schedule.enabled && (
        <div className="pl-6 space-y-3">
          {/* All Day Option */}
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Aberto 24h</Label>
            <Switch 
              checked={schedule.allDay}
              onCheckedChange={(checked) => updateSchedule({ allDay: checked, hasBreak: false })}
            />
          </div>

          {!schedule.allDay && (
            <>
              {/* Opening Hours */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Abre às</Label>
                  <Select 
                    value={schedule.openTime} 
                    onValueChange={(value) => updateSchedule({ openTime: value })}
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timeOptions.map((time) => (
                        <SelectItem key={time} value={time}>{time}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Fecha às</Label>
                  <Select 
                    value={schedule.closeTime} 
                    onValueChange={(value) => updateSchedule({ closeTime: value })}
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timeOptions.map((time) => (
                        <SelectItem key={time} value={time}>{time}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Break Option */}
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Intervalo para almoço</Label>
                <Switch 
                  checked={schedule.hasBreak}
                  onCheckedChange={(checked) => updateSchedule({ hasBreak: checked })}
                />
              </div>

              {schedule.hasBreak && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Início intervalo</Label>
                    <Select 
                      value={schedule.breakStart} 
                      onValueChange={(value) => updateSchedule({ breakStart: value })}
                    >
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {timeOptions.map((time) => (
                          <SelectItem key={time} value={time}>{time}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Fim intervalo</Label>
                    <Select 
                      value={schedule.breakEnd} 
                      onValueChange={(value) => updateSchedule({ breakEnd: value })}
                    >
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {timeOptions.map((time) => (
                          <SelectItem key={time} value={time}>{time}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

interface OpeningHoursSelectorProps {
  value: OpeningHoursState;
  onChange: (value: OpeningHoursState) => void;
}

export function OpeningHoursSelector({ value, onChange }: OpeningHoursSelectorProps) {
  return (
    <div className="space-y-3">
      <Label>Horário de funcionamento</Label>
      
      <DayScheduleEditor
        label="Segunda a Sexta"
        schedule={value.weekdays}
        onChange={(schedule) => onChange({ ...value, weekdays: schedule })}
      />
      
      <DayScheduleEditor
        label="Sábado"
        schedule={value.saturday}
        onChange={(schedule) => onChange({ ...value, saturday: schedule })}
      />
      
      <DayScheduleEditor
        label="Domingo"
        schedule={value.sunday}
        onChange={(schedule) => onChange({ ...value, sunday: schedule })}
      />
    </div>
  );
}

export function formatOpeningHoursToString(hours: OpeningHoursState): string {
  const formatDay = (label: string, schedule: DaySchedule): string | null => {
    if (!schedule.enabled) return null;
    
    if (schedule.allDay) {
      return `${label}: 24h`;
    }
    
    if (schedule.hasBreak) {
      return `${label}: ${schedule.openTime}-${schedule.breakStart} e ${schedule.breakEnd}-${schedule.closeTime}`;
    }
    
    return `${label}: ${schedule.openTime}-${schedule.closeTime}`;
  };

  const parts = [
    formatDay('Seg-Sex', hours.weekdays),
    formatDay('Sáb', hours.saturday),
    formatDay('Dom', hours.sunday),
  ].filter(Boolean);

  return parts.join(' | ');
}
