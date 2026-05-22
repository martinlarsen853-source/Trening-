import { ScheduleGrid } from '@/components/ScheduleGrid';
import { WeatherForecast } from '@/components/WeatherForecast';

export default function TimeplanPage() {
  return (
    <div className="max-w-lg mx-auto">
      <WeatherForecast />
      <ScheduleGrid />
    </div>
  );
}
