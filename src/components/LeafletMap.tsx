"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { ActivityType, UserType, HotspotType } from "@/types";
import { TYPE_COLORS, ACTIVITY_TYPES, USER_ROLES } from "@/lib/utils";

interface LeafletMapProps {
  userLocation: { lat: number; lng: number };
  activities: ActivityType[];
  users: UserType[];
  hotspots: HotspotType[];
  onActivityClick: (a: ActivityType) => void;
  onUserClick: (u: UserType) => void;
  onHotspotClick: (h: HotspotType) => void;
  centerTrigger?: number;
}

export default function LeafletMap({
  userLocation,
  activities,
  users,
  hotspots,
  onActivityClick,
  onUserClick,
  onHotspotClick,
  centerTrigger,
}: LeafletMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const selfMarkerRef = useRef<L.Marker | null>(null);
  const radiusRef = useRef<L.Circle | null>(null);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView([userLocation.lat, userLocation.lng], 15);

    // Beautiful dark-ish modern map tiles
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
    }).addTo(map);

    // Radius circle showing nearby area
    radiusRef.current = L.circle([userLocation.lat, userLocation.lng], {
      radius: 1500,
      color: "#6C5CE7",
      fillColor: "#6C5CE7",
      fillOpacity: 0.04,
      weight: 1.5,
      dashArray: "8 6",
      opacity: 0.3,
    }).addTo(map);

    // Self marker with glowing pulse
    const selfIcon = L.divIcon({
      className: "",
      html: `
        <div class="self-marker-wrap">
          <div class="self-pulse-ring"></div>
          <div class="self-pulse-ring delay"></div>
          <div class="self-marker-dot">
            <div class="self-inner-dot"></div>
          </div>
        </div>
      `,
      iconSize: [60, 60],
      iconAnchor: [30, 30],
    });
    selfMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], { icon: selfIcon, zIndexOffset: 1000 }).addTo(map);

    // Layer group for dynamic markers
    markersRef.current = L.layerGroup().addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Center on user
  useEffect(() => {
    if (mapRef.current && centerTrigger) {
      mapRef.current.flyTo([userLocation.lat, userLocation.lng], 15, { duration: 0.8 });
    }
  }, [centerTrigger, userLocation]);

  // Fly to real location when GPS updates from 0,0
  const hasFlownRef = useRef(false);
  useEffect(() => {
    if (mapRef.current && userLocation.lat !== 0 && userLocation.lng !== 0 && !hasFlownRef.current) {
      mapRef.current.flyTo([userLocation.lat, userLocation.lng], 15, { duration: 1.2 });
      hasFlownRef.current = true;
    }
  }, [userLocation]);

  // Update self marker + radius
  useEffect(() => {
    if (selfMarkerRef.current) {
      selfMarkerRef.current.setLatLng([userLocation.lat, userLocation.lng]);
    }
    if (radiusRef.current) {
      radiusRef.current.setLatLng([userLocation.lat, userLocation.lng]);
    }
  }, [userLocation]);

  // Update all markers
  useEffect(() => {
    if (!markersRef.current) return;
    markersRef.current.clearLayers();

    // ─── ACTIVITY MARKERS ───
    activities.forEach((a) => {
      const color = TYPE_COLORS[a.type] || "#6C5CE7";
      const emoji = ACTIVITY_TYPES.find((t) => t.value === a.type)?.icon || "⭐";
      const pCount = a.participants?.length || a._count?.participants || 0;
      const isEvent = a.isEvent;

      const size = isEvent ? 52 : 44;
      const icon = L.divIcon({
        className: "",
        html: `
          <div class="map-marker activity-marker ${isEvent ? "event-marker" : ""}" style="--marker-color: ${color}">
            <div class="marker-body" style="width:${size}px;height:${size}px">
              <span class="marker-emoji">${emoji}</span>
              ${pCount > 0 ? `<span class="marker-badge">${pCount}</span>` : ""}
            </div>
            ${isEvent ? '<div class="event-tag">EVENT</div>' : ""}
            <div class="marker-shadow"></div>
          </div>
        `,
        iconSize: [size + 10, size + 20],
        iconAnchor: [(size + 10) / 2, size + 10],
      });

      const marker = L.marker([a.lat, a.lng], { icon });
      marker.on("click", () => onActivityClick(a));
      markersRef.current!.addLayer(marker);
    });

    // ─── USER MARKERS ───
    users.forEach((u) => {
      const isOnline = u.online;
      const roleInfo = USER_ROLES.find((r) => r.value === u.role);
      const hasRole = !!u.role && roleInfo;
      const initial = u.name.charAt(0).toUpperCase();

      // Color based on role
      let bgColor = "#00B894";
      if (u.role === "founder") bgColor = "#6C5CE7";
      else if (u.role === "developer") bgColor = "#0984E3";
      else if (u.role === "designer") bgColor = "#FD79A8";
      else if (u.role === "investor") bgColor = "#FDCB6E";
      else if (u.role === "freelancer") bgColor = "#E17055";

      const avatarHtml = u.avatar
        ? `<img src="${u.avatar}" class="user-avatar-img" />`
        : `<span class="user-initial">${initial}</span>`;

      const icon = L.divIcon({
        className: "",
        html: `
          <div class="map-marker user-marker">
            <div class="user-marker-body" style="--user-color: ${bgColor}">
              ${avatarHtml}
              ${isOnline ? '<div class="online-dot"></div>' : ""}
            </div>
            ${hasRole ? `<div class="role-tag" style="background:${bgColor}">${roleInfo.icon}</div>` : ""}
            <div class="marker-shadow small"></div>
          </div>
        `,
        iconSize: [44, 52],
        iconAnchor: [22, 44],
      });

      const marker = L.marker([u.lat, u.lng], { icon });
      marker.on("click", () => onUserClick(u));
      markersRef.current!.addLayer(marker);
    });

    // ─── HOTSPOT MARKERS ───
    hotspots.forEach((h) => {
      const icon = L.divIcon({
        className: "",
        html: `
          <div class="map-marker hotspot-marker">
            <div class="hotspot-body">
              <div class="hotspot-pulse"></div>
              <div class="hotspot-pulse delay2"></div>
              <div class="hotspot-core">
                <span class="hotspot-count">${h.count}</span>
                <span class="hotspot-label">active</span>
              </div>
            </div>
          </div>
        `,
        iconSize: [70, 70],
        iconAnchor: [35, 35],
      });

      const marker = L.marker([h.lat, h.lng], { icon });
      marker.on("click", () => onHotspotClick(h));
      markersRef.current!.addLayer(marker);
    });
  }, [activities, users, hotspots, onActivityClick, onUserClick, onHotspotClick]);

  return (
    <>
      <style jsx global>{`
        /* ─── SELF MARKER ─── */
        .self-marker-wrap {
          position: relative;
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .self-pulse-ring {
          position: absolute;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          border: 2px solid rgba(108, 92, 231, 0.4);
          animation: selfPulse 2.5s ease-out infinite;
        }
        .self-pulse-ring.delay {
          animation-delay: 1.25s;
        }
        .self-marker-dot {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: linear-gradient(135deg, #6C5CE7, #A29BFE);
          border: 3px solid white;
          box-shadow: 0 2px 12px rgba(108, 92, 231, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2;
        }
        .self-inner-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: white;
        }
        @keyframes selfPulse {
          0% { transform: scale(0.3); opacity: 0.8; }
          100% { transform: scale(1); opacity: 0; }
        }

        /* ─── ACTIVITY MARKERS ─── */
        .activity-marker .marker-body {
          border-radius: 50%;
          background: var(--marker-color);
          border: 3px solid white;
          box-shadow: 0 4px 15px rgba(0,0,0,0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          transition: transform 0.2s;
          cursor: pointer;
        }
        .activity-marker .marker-body:hover {
          transform: scale(1.15);
        }
        .marker-emoji {
          font-size: 20px;
          line-height: 1;
          filter: drop-shadow(0 1px 2px rgba(0,0,0,0.2));
        }
        .event-marker .marker-body {
          border: 3px solid #FFD700;
          box-shadow: 0 4px 20px rgba(255, 215, 0, 0.4), 0 4px 15px rgba(0,0,0,0.2);
        }
        .marker-badge {
          position: absolute;
          top: -4px;
          right: -4px;
          min-width: 20px;
          height: 20px;
          padding: 0 5px;
          border-radius: 10px;
          background: white;
          color: #333;
          font-size: 11px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
          border: 1.5px solid var(--marker-color);
        }
        .event-tag {
          position: absolute;
          bottom: 6px;
          left: 50%;
          transform: translateX(-50%);
          background: linear-gradient(135deg, #8E44AD, #6C5CE7);
          color: white;
          font-size: 8px;
          font-weight: 800;
          padding: 1px 6px;
          border-radius: 4px;
          letter-spacing: 0.5px;
          white-space: nowrap;
        }
        .marker-shadow {
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 24px;
          height: 6px;
          border-radius: 50%;
          background: rgba(0,0,0,0.15);
          filter: blur(2px);
        }
        .marker-shadow.small {
          width: 18px;
          height: 4px;
        }

        /* ─── USER MARKERS ─── */
        .user-marker .user-marker-body {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--user-color), color-mix(in srgb, var(--user-color) 70%, white));
          border: 3px solid white;
          box-shadow: 0 3px 12px rgba(0,0,0,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 14px;
          font-weight: 700;
          position: relative;
          cursor: pointer;
          overflow: hidden;
          transition: transform 0.2s;
        }
        .user-marker .user-marker-body:hover {
          transform: scale(1.15);
        }
        .user-avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 50%;
        }
        .user-initial {
          font-size: 14px;
          font-weight: 800;
          text-shadow: 0 1px 3px rgba(0,0,0,0.2);
        }
        .online-dot {
          position: absolute;
          bottom: 0;
          right: 0;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #00E676;
          border: 2px solid white;
          box-shadow: 0 0 6px rgba(0, 230, 118, 0.6);
        }
        .role-tag {
          position: absolute;
          bottom: 4px;
          left: 50%;
          transform: translateX(-50%);
          width: 18px;
          height: 18px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          border: 1.5px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        /* ─── HOTSPOT MARKERS ─── */
        .hotspot-marker .hotspot-body {
          position: relative;
          width: 70px;
          height: 70px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .hotspot-pulse {
          position: absolute;
          width: 70px;
          height: 70px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255,71,87,0.3), rgba(255,71,87,0));
          animation: hotPulse 2s ease-out infinite;
        }
        .hotspot-pulse.delay2 {
          animation-delay: 1s;
        }
        .hotspot-core {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: linear-gradient(135deg, #FF6B6B, #FF4757);
          border: 3px solid white;
          box-shadow: 0 4px 20px rgba(255,71,87,0.5);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: white;
          z-index: 2;
          cursor: pointer;
          transition: transform 0.2s;
        }
        .hotspot-core:hover {
          transform: scale(1.1);
        }
        .hotspot-count {
          font-size: 18px;
          font-weight: 900;
          line-height: 1;
        }
        .hotspot-label {
          font-size: 8px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          opacity: 0.9;
        }
        @keyframes hotPulse {
          0% { transform: scale(0.5); opacity: 0.8; }
          100% { transform: scale(1.2); opacity: 0; }
        }

        /* ─── MAP GLOBAL STYLES ─── */
        .leaflet-container {
          background: #f8f9fa;
        }
        .leaflet-marker-icon {
          background: none !important;
          border: none !important;
        }
      `}</style>
      <div ref={containerRef} className="h-full w-full" />
    </>
  );
}
