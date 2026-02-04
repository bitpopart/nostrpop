import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin } from 'lucide-react';
import { POPUP_TYPE_CONFIG, type PopUpEventData } from '@/lib/popupTypes';
import { format } from 'date-fns';

interface WorldMapProps {
  events: PopUpEventData[];
}

export function WorldMap({ events }: WorldMapProps) {
  const [hoveredEvent, setHoveredEvent] = useState<PopUpEventData | null>(null);

  // Convert lat/lon to percentage position on the map
  // Using Equirectangular projection
  const latLonToPosition = (lat: number, lon: number) => {
    const x = ((lon + 180) / 360) * 100;
    const y = ((90 - lat) / 180) * 100;
    
    return { x: `${x}%`, y: `${y}%` };
  };

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-blue-100 via-indigo-50 to-purple-100 dark:from-slate-900 dark:via-indigo-950 dark:to-purple-950 overflow-hidden">
      {/* World map background */}
      <div className="absolute inset-0">
        <img 
          src="/world-map.svg" 
          alt="World Map" 
          className="w-full h-full object-contain"
          style={{ opacity: 0.9 }}
        />
      </div>

      {/* Equator and Prime Meridian overlays */}
      <div className="absolute inset-0">
        <div 
          className="absolute w-full border-t-2 border-indigo-300 dark:border-indigo-700 border-dashed opacity-40"
          style={{ top: '50%' }}
        >
          <span className="absolute left-4 -top-3 text-indigo-600 dark:text-indigo-400 text-sm font-medium bg-white/80 dark:bg-gray-800/80 px-2 py-1 rounded">
            Equator
          </span>
        </div>
        <div 
          className="absolute h-full border-l-2 border-indigo-300 dark:border-indigo-700 border-dashed opacity-40"
          style={{ left: '50%' }}
        >
          <span className="absolute top-4 -left-12 text-indigo-600 dark:text-indigo-400 text-sm font-medium bg-white/80 dark:bg-gray-800/80 px-2 py-1 rounded">
            Prime Meridian
          </span>
        </div>
      </div>

      {/* Event markers */}
      <div className="absolute inset-0">
        {events.map((event) => {
          const { x, y } = latLonToPosition(event.latitude, event.longitude);
          
          const markerColor = event.type === 'art' 
            ? '#a855f7' 
            : event.type === 'shop' 
            ? '#ec4899' 
            : '#6366f1';

          const isHovered = hoveredEvent?.id === event.id;

          return (
            <div
              key={event.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200 z-20"
              style={{ left: x, top: y }}
              onMouseEnter={() => setHoveredEvent(event)}
              onMouseLeave={() => setHoveredEvent(null)}
            >
              {/* Pulse animation */}
              {isHovered && (
                <div
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full animate-ping"
                  style={{
                    width: '40px',
                    height: '40px',
                    backgroundColor: markerColor,
                    opacity: 0.4,
                  }}
                />
              )}

              {/* Main marker */}
              <div
                className={`rounded-full border-4 border-white transition-all duration-200 ${
                  isHovered ? 'scale-125' : 'scale-100'
                }`}
                style={{
                  width: isHovered ? '28px' : '20px',
                  height: isHovered ? '28px' : '20px',
                  backgroundColor: markerColor,
                  boxShadow: isHovered 
                    ? '0 4px 12px rgba(0,0,0,0.4)' 
                    : '0 2px 6px rgba(0,0,0,0.3)',
                }}
              >
                {/* Inner white dot */}
                <div
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"
                  style={{
                    width: isHovered ? '10px' : '6px',
                    height: isHovered ? '10px' : '6px',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Hover tooltip */}
      {hoveredEvent && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-30 pointer-events-none animate-in fade-in slide-in-from-bottom-2 duration-200">
          <Card className="p-4 shadow-2xl max-w-sm border-2">
            <div className="space-y-2">
              <Badge className={`${POPUP_TYPE_CONFIG[hoveredEvent.type].bgColor} ${POPUP_TYPE_CONFIG[hoveredEvent.type].color} border`}>
                {POPUP_TYPE_CONFIG[hoveredEvent.type].icon} {POPUP_TYPE_CONFIG[hoveredEvent.type].label}
              </Badge>
              <h3 className="font-bold text-lg">{hoveredEvent.title}</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{hoveredEvent.location}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {format(new Date(hoveredEvent.startDate), 'MMM d, yyyy')}
                {hoveredEvent.endDate && ` - ${format(new Date(hoveredEvent.endDate), 'MMM d, yyyy')}`}
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* Legend */}
      <div className="absolute top-4 left-4 bg-white/95 dark:bg-gray-800/95 rounded-xl shadow-xl p-4 space-y-3 backdrop-blur-sm border border-gray-200 dark:border-gray-700 z-20">
        <h3 className="font-bold text-base mb-2 flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Event Types
        </h3>
        {Object.entries(POPUP_TYPE_CONFIG).map(([key, config]) => (
          <div key={key} className="flex items-center gap-3 text-sm">
            <div 
              className="w-5 h-5 rounded-full border-2 border-white shadow-md flex-shrink-0"
              style={{ 
                backgroundColor: key === 'art' ? '#a855f7' : key === 'shop' ? '#ec4899' : '#6366f1' 
              }}
            />
            <span className="font-medium">{config.icon} {config.label}</span>
          </div>
        ))}
      </div>

      {/* Event counter */}
      <div className="absolute bottom-4 right-4 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-xl px-4 py-3 shadow-xl border border-gray-200 dark:border-gray-700 z-20">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse flex-shrink-0" />
          <span className="text-sm font-semibold whitespace-nowrap">{events.length} event{events.length !== 1 ? 's' : ''} worldwide</span>
        </div>
      </div>
    </div>
  );
}
