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
  // SVG viewBox: 0 0 2000 1000
  const latLonToSVG = (lat: number, lon: number) => {
    const x = ((lon + 180) / 360) * 2000;
    
    // Mercator projection for latitude
    const latRad = (lat * Math.PI) / 180;
    const mercN = Math.log(Math.tan((Math.PI / 4) + (latRad / 2)));
    const y = (1000 / 2) - (1000 * mercN / (2 * Math.PI));
    
    return { x, y };
  };

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-blue-100 via-indigo-50 to-purple-100 dark:from-gray-900 dark:via-indigo-950 dark:to-purple-950">
      <svg
        viewBox="0 0 2000 1000"
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Ocean gradient */}
          <linearGradient id="ocean" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#dbeafe" className="dark:stop-color-[#1e293b]" />
            <stop offset="100%" stopColor="#bfdbfe" className="dark:stop-color-[#0f172a]" />
          </linearGradient>
        </defs>

        {/* Ocean background */}
        <rect width="2000" height="1000" fill="url(#ocean)" />

        {/* Equator line */}
        <line 
          x1="0" 
          y1="500" 
          x2="2000" 
          y2="500" 
          stroke="#a5b4fc" 
          strokeWidth="2" 
          strokeDasharray="10,10" 
          opacity="0.4"
        />
        <text x="20" y="495" fill="#6366f1" fontSize="18" opacity="0.5" fontWeight="500">Equator</text>

        {/* Prime Meridian line */}
        <line 
          x1="1000" 
          y1="0" 
          x2="1000" 
          y2="1000" 
          stroke="#a5b4fc" 
          strokeWidth="2" 
          strokeDasharray="10,10" 
          opacity="0.4"
        />
        <text x="1010" y="30" fill="#6366f1" fontSize="18" opacity="0.5" fontWeight="500">Prime Meridian</text>

        {/* CONTINENTS - More accurate shapes */}
        
        {/* North America */}
        <path
          d="M 180 200 L 200 180 L 230 170 L 270 165 L 310 170 L 350 180 L 380 200 L 400 230 L 410 270 L 405 310 L 390 350 L 370 380 L 340 400 L 310 410 L 280 415 L 250 410 L 220 395 L 200 370 L 185 340 L 175 300 L 170 260 L 175 230 Z M 340 160 L 360 150 L 380 155 L 390 170 L 385 190 L 370 200 L 350 195 L 335 180 L 340 160 Z"
          fill="#86efac"
          stroke="#22c55e"
          strokeWidth="2"
          opacity="0.85"
        />

        {/* South America */}
        <path
          d="M 320 450 L 340 440 L 360 445 L 375 465 L 385 500 L 390 540 L 385 580 L 375 620 L 360 660 L 340 690 L 315 710 L 290 715 L 270 710 L 255 690 L 245 660 L 240 620 L 245 580 L 255 540 L 270 500 L 290 470 L 310 455 Z"
          fill="#86efac"
          stroke="#22c55e"
          strokeWidth="2"
          opacity="0.85"
        />

        {/* Europe */}
        <path
          d="M 950 200 L 980 190 L 1010 185 L 1040 190 L 1070 200 L 1090 220 L 1100 245 L 1095 270 L 1080 290 L 1050 300 L 1020 295 L 990 285 L 965 270 L 950 250 L 945 225 Z"
          fill="#86efac"
          stroke="#22c55e"
          strokeWidth="2"
          opacity="0.85"
        />

        {/* Africa */}
        <path
          d="M 980 330 L 1010 325 L 1040 330 L 1070 345 L 1095 370 L 1110 400 L 1120 440 L 1125 480 L 1120 520 L 1110 560 L 1090 600 L 1065 630 L 1035 655 L 1005 670 L 975 675 L 945 670 L 920 650 L 905 620 L 895 580 L 890 540 L 895 500 L 905 460 L 920 420 L 940 385 L 960 355 Z"
          fill="#86efac"
          stroke="#22c55e"
          strokeWidth="2"
          opacity="0.85"
        />

        {/* Asia */}
        <path
          d="M 1150 180 L 1200 170 L 1260 165 L 1320 170 L 1380 180 L 1440 195 L 1490 215 L 1530 240 L 1560 270 L 1580 305 L 1590 340 L 1585 375 L 1570 405 L 1545 430 L 1510 445 L 1470 450 L 1430 445 L 1390 435 L 1350 420 L 1310 400 L 1275 375 L 1245 345 L 1220 310 L 1200 270 L 1185 230 L 1175 200 Z"
          fill="#86efac"
          stroke="#22c55e"
          strokeWidth="2"
          opacity="0.85"
        />

        {/* Southeast Asia islands */}
        <ellipse cx="1450" cy="520" rx="60" ry="35" fill="#86efac" stroke="#22c55e" strokeWidth="2" opacity="0.85" />
        <ellipse cx="1520" cy="550" rx="40" ry="25" fill="#86efac" stroke="#22c55e" strokeWidth="2" opacity="0.85" />

        {/* Australia */}
        <path
          d="M 1480 630 L 1520 625 L 1560 630 L 1595 645 L 1620 670 L 1635 700 L 1640 730 L 1635 760 L 1620 785 L 1595 805 L 1560 815 L 1520 820 L 1480 815 L 1445 800 L 1420 775 L 1405 745 L 1400 715 L 1405 685 L 1420 660 L 1445 640 Z"
          fill="#86efac"
          stroke="#22c55e"
          strokeWidth="2"
          opacity="0.85"
        />

        {/* Antarctica (bottom) */}
        <ellipse 
          cx="1000" 
          cy="930" 
          rx="700" 
          ry="60" 
          fill="#86efac" 
          stroke="#22c55e" 
          strokeWidth="2" 
          opacity="0.7"
        />

        {/* Event markers */}
        {events.map((event) => {
          const { x, y } = latLonToSVG(event.latitude, event.longitude);
          
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
              className="cursor-pointer transition-all duration-200"
              style={{
                transformOrigin: `${x}px ${y}px`,
              }}
            >
              {/* Pulse animation ring for hovered marker */}
              {isHovered && (
                <circle
                  cx={x}
                  cy={y}
                  r="15"
                  fill="none"
                  stroke={markerColor}
                  strokeWidth="3"
                  opacity="0.6"
                >
                  <animate
                    attributeName="r"
                    from="15"
                    to="35"
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

              {/* Main marker circle */}
              <circle
                cx={x}
                cy={y}
                r={isHovered ? 16 : 12}
                fill={markerColor}
                stroke="white"
                strokeWidth="4"
                className="transition-all duration-200"
                style={{
                  filter: isHovered 
                    ? 'drop-shadow(0 6px 12px rgba(0,0,0,0.4))' 
                    : 'drop-shadow(0 3px 6px rgba(0,0,0,0.3))',
                }}
              />

              {/* Inner white dot */}
              <circle
                cx={x}
                cy={y}
                r={isHovered ? 6 : 4}
                fill="white"
                className="transition-all duration-200"
              />
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
      <div className="absolute top-4 left-4 bg-white/95 dark:bg-gray-800/95 rounded-xl shadow-xl p-4 space-y-3 backdrop-blur-sm border-2 border-gray-200 dark:border-gray-700">
        <h3 className="font-bold text-base mb-2 flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Event Types
        </h3>
        {Object.entries(POPUP_TYPE_CONFIG).map(([key, config]) => (
          <div key={key} className="flex items-center gap-3 text-sm">
            <div 
              className="w-5 h-5 rounded-full border-2 border-white shadow-md"
              style={{ 
                backgroundColor: key === 'art' ? '#a855f7' : key === 'shop' ? '#ec4899' : '#6366f1' 
              }}
            />
            <span className="font-medium">{config.icon} {config.label}</span>
          </div>
        ))}
      </div>

      {/* Event counter */}
      <div className="absolute bottom-4 right-4 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-xl px-4 py-3 text-sm font-semibold shadow-xl border-2 border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
          <span className="text-base">{events.length} event{events.length !== 1 ? 's' : ''} worldwide</span>
        </div>
      </div>
    </div>
  );
}
