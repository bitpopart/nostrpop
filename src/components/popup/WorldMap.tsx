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

  // Convert lat/lon to SVG coordinates using Mercator projection
  // SVG viewBox: 0 0 1000 500
  const latLonToSVG = (lat: number, lon: number) => {
    // Mercator projection formulas
    const x = ((lon + 180) / 360) * 1000;
    
    // Convert latitude to radians and apply Mercator projection
    const latRad = (lat * Math.PI) / 180;
    const mercN = Math.log(Math.tan((Math.PI / 4) + (latRad / 2)));
    const y = (500 / 2) - (500 * mercN / (2 * Math.PI));
    
    return { x, y };
  };

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-blue-100 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <svg
        viewBox="0 0 1000 500"
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Ocean background */}
        <rect width="1000" height="500" fill="url(#ocean-gradient)" />
        
        <defs>
          <linearGradient id="ocean-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#dbeafe" />
            <stop offset="100%" stopColor="#bfdbfe" />
          </linearGradient>
          
          {/* Grid pattern */}
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path
              d="M 20 0 L 0 0 0 20"
              fill="none"
              stroke="rgba(99, 102, 241, 0.08)"
              strokeWidth="0.5"
            />
          </pattern>
        </defs>

        {/* Grid overlay */}
        <rect width="1000" height="500" fill="url(#grid)" opacity="0.5" />

        {/* Simplified continents using approximate Mercator projection coordinates */}
        {/* North America */}
        <path
          d="M 100 100 L 150 80 L 200 90 L 250 100 L 280 120 L 300 140 L 280 180 L 250 200 L 200 220 L 180 240 L 160 230 L 140 220 L 120 200 L 100 180 L 90 150 L 100 120 Z"
          fill="#86efac"
          stroke="#059669"
          strokeWidth="1"
          opacity="0.9"
        />
        
        {/* South America */}
        <path
          d="M 240 250 L 260 240 L 280 250 L 290 280 L 285 320 L 275 350 L 260 370 L 240 360 L 230 340 L 225 310 L 230 280 L 235 260 Z"
          fill="#86efac"
          stroke="#059669"
          strokeWidth="1"
          opacity="0.9"
        />

        {/* Europe */}
        <path
          d="M 480 100 L 520 90 L 560 100 L 580 120 L 570 140 L 550 150 L 520 145 L 500 135 L 480 120 Z"
          fill="#86efac"
          stroke="#059669"
          strokeWidth="1"
          opacity="0.9"
        />

        {/* Africa */}
        <path
          d="M 480 160 L 520 155 L 560 165 L 580 180 L 590 210 L 585 250 L 575 290 L 560 320 L 540 340 L 515 350 L 490 345 L 475 320 L 470 285 L 475 240 L 480 200 L 485 175 Z"
          fill="#86efac"
          stroke="#059669"
          strokeWidth="1"
          opacity="0.9"
        />

        {/* Asia */}
        <path
          d="M 600 80 L 680 70 L 760 85 L 820 100 L 850 120 L 860 145 L 850 170 L 830 185 L 800 195 L 760 200 L 720 195 L 680 185 L 650 170 L 620 150 L 605 125 L 600 100 Z"
          fill="#86efac"
          stroke="#059669"
          strokeWidth="1"
          opacity="0.9"
        />

        {/* Australia */}
        <path
          d="M 750 320 L 800 315 L 850 325 L 870 345 L 865 370 L 840 385 L 800 390 L 760 385 L 740 365 L 735 340 Z"
          fill="#86efac"
          stroke="#059669"
          strokeWidth="1"
          opacity="0.9"
        />

        {/* Latitude lines */}
        <line x1="0" y1="125" x2="1000" y2="125" stroke="rgba(99, 102, 241, 0.15)" strokeWidth="1" strokeDasharray="3,3" />
        <line x1="0" y1="250" x2="1000" y2="250" stroke="rgba(99, 102, 241, 0.25)" strokeWidth="1.5" strokeDasharray="5,5" />
        <line x1="0" y1="375" x2="1000" y2="375" stroke="rgba(99, 102, 241, 0.15)" strokeWidth="1" strokeDasharray="3,3" />

        {/* Longitude lines */}
        <line x1="250" y1="0" x2="250" y2="500" stroke="rgba(99, 102, 241, 0.15)" strokeWidth="1" strokeDasharray="3,3" />
        <line x1="500" y1="0" x2="500" y2="500" stroke="rgba(99, 102, 241, 0.25)" strokeWidth="1.5" strokeDasharray="5,5" />
        <line x1="750" y1="0" x2="750" y2="500" stroke="rgba(99, 102, 241, 0.15)" strokeWidth="1" strokeDasharray="3,3" />

        {/* Labels */}
        <text x="20" y="255" fill="rgba(99, 102, 241, 0.4)" fontSize="12" fontWeight="bold">Equator</text>
        <text x="505" y="20" fill="rgba(99, 102, 241, 0.4)" fontSize="12" fontWeight="bold">Prime Meridian</text>

        {/* Event markers */}
        {events.map((event) => {
          const { x, y } = latLonToSVG(event.latitude, event.longitude);
          const typeConfig = POPUP_TYPE_CONFIG[event.type];
          
          // Determine marker color based on type
          const markerColor = event.type === 'art' 
            ? '#a855f7' 
            : event.type === 'shop' 
            ? '#ec4899' 
            : '#6366f1';

          const isHovered = hoveredEvent?.id === event.id;

          return (
            <g
              key={event.id}
              onMouseEnter={() => setHoveredEvent(event)}
              onMouseLeave={() => setHoveredEvent(null)}
              className="cursor-pointer transition-transform duration-200"
              style={{
                transformOrigin: `${x}px ${y}px`,
              }}
            >
              {/* Marker shadow */}
              <ellipse
                cx={x}
                cy={y + 12}
                rx={isHovered ? 8 : 6}
                ry={isHovered ? 3 : 2}
                fill="rgba(0,0,0,0.2)"
                className="transition-all duration-200"
              />
              
              {/* Marker pin */}
              <path
                d={`M ${x} ${y} Q ${x - 8} ${y - 8} ${x} ${y - 16} Q ${x + 8} ${y - 8} ${x} ${y} Z`}
                fill={markerColor}
                stroke="white"
                strokeWidth="2"
                className="transition-all duration-200"
                style={{
                  filter: isHovered ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
                  transform: isHovered ? 'scale(1.3)' : 'scale(1)',
                }}
              />
              
              {/* Marker dot */}
              <circle
                cx={x}
                cy={y - 16}
                r="3"
                fill="white"
              />

              {/* Pulse animation for hovered marker */}
              {isHovered && (
                <circle
                  cx={x}
                  cy={y}
                  r="10"
                  fill="none"
                  stroke={markerColor}
                  strokeWidth="2"
                  opacity="0.6"
                >
                  <animate
                    attributeName="r"
                    from="10"
                    to="25"
                    dur="1.5s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    from="0.6"
                    to="0"
                    dur="1.5s"
                    repeatCount="indefinite"
                  />
                </circle>
              )}
            </g>
          );
        })}
      </svg>

      {/* Hover tooltip */}
      {hoveredEvent && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 pointer-events-none animate-in fade-in slide-in-from-bottom-2 duration-200">
          <Card className="p-4 shadow-2xl max-w-sm border-2">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge className={`${POPUP_TYPE_CONFIG[hoveredEvent.type].bgColor} ${POPUP_TYPE_CONFIG[hoveredEvent.type].color} border`}>
                  {POPUP_TYPE_CONFIG[hoveredEvent.type].icon} {POPUP_TYPE_CONFIG[hoveredEvent.type].label}
                </Badge>
              </div>
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

      {/* Map Legend */}
      <div className="absolute top-4 left-4 bg-white/95 dark:bg-gray-800/95 rounded-lg shadow-lg p-4 space-y-2 backdrop-blur-sm">
        <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Event Types
        </h3>
        {Object.entries(POPUP_TYPE_CONFIG).map(([key, config]) => (
          <div key={key} className="flex items-center gap-2 text-xs">
            <svg width="16" height="20" viewBox="0 0 16 20">
              <path
                d="M 8 0 Q 2 4 8 12 Q 14 4 8 0 Z"
                fill={key === 'art' ? '#a855f7' : key === 'shop' ? '#ec4899' : '#6366f1'}
                stroke="white"
                strokeWidth="1.5"
              />
              <circle cx="8" cy="4" r="2" fill="white" />
            </svg>
            <span className="font-medium">{config.icon} {config.label}</span>
          </div>
        ))}
      </div>

      {/* Coordinates info */}
      <div className="absolute bottom-4 right-4 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-lg px-4 py-2 text-sm font-medium shadow-lg">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          {events.length} event{events.length !== 1 ? 's' : ''} worldwide
        </div>
      </div>
    </div>
  );
}
