"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";

interface MapCustomer {
  customer_id: string;
  name: string;
  address: string;
  postcode: string;
  position: number;
  latitude: number | null;
  longitude: number | null;
}

interface RunMapProps {
  customers: MapCustomer[];
  googleMapsApiKey: string;
}

declare global {
  interface Window {
    initRunMap?: () => void;
  }
}

export function RunMap({ customers, googleMapsApiKey }: RunMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (!googleMapsApiKey || customers.length === 0) {
      setLoading(false);
      return;
    }

    function initMap() {
      if (!mapRef.current) return;

      const map = new google.maps.Map(mapRef.current, {
        zoom: 12,
        mapTypeControl: false,
        streetViewControl: false,
      });
      mapInstanceRef.current = map;

      const geocoder = new google.maps.Geocoder();
      const bounds = new google.maps.LatLngBounds();
      let processed = 0;

      function addMarker(customer: MapCustomer, pos: google.maps.LatLng | google.maps.LatLngLiteral) {
        bounds.extend(pos);

        const marker = new google.maps.Marker({
          position: pos,
          map,
          label: {
            text: String(customer.position),
            color: "#ffffff",
            fontWeight: "bold",
            fontSize: "12px",
          },
          title: `${customer.position}. ${customer.name}`,
        });

        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="font-family: sans-serif; min-width: 140px;">
              <p style="font-weight: 600; margin: 0 0 4px;">${customer.position}. ${customer.name}</p>
              <p style="color: #666; margin: 0; font-size: 13px;">${customer.address}</p>
              <p style="color: #666; margin: 0; font-size: 13px;">${customer.postcode}</p>
            </div>
          `,
        });

        marker.addListener("click", () => {
          infoWindow.open(map, marker);
        });
      }

      function checkDone() {
        processed++;
        if (processed === customers.length) {
          if (!bounds.isEmpty()) {
            map.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 });
          }
          setLoading(false);
        }
      }

      customers.forEach((customer) => {
        // Use cached lat/lng if available
        if (customer.latitude != null && customer.longitude != null) {
          addMarker(customer, { lat: customer.latitude, lng: customer.longitude });
          checkDone();
          return;
        }

        // Geocode and cache the result
        const query = `${customer.address}, ${customer.postcode}, UK`;
        geocoder.geocode({ address: query }, (results, status) => {
          if (status === "OK" && results && results[0]) {
            const pos = results[0].geometry.location;
            addMarker(customer, pos);

            // Save lat/lng to database
            fetch("/api/geocode-cache", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                customer_id: customer.customer_id,
                latitude: pos.lat(),
                longitude: pos.lng(),
              }),
            }).catch(() => {}); // fire and forget
          }
          checkDone();
        });
      });
    }

    if (typeof google !== "undefined" && google.maps) {
      initMap();
      return;
    }

    // Prevent loading the script multiple times
    if (document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]')) {
      // Script exists but google isn't ready yet — wait for it
      const interval = setInterval(() => {
        if (typeof google !== "undefined" && google.maps) {
          clearInterval(interval);
          initMap();
        }
      }, 100);
      return () => clearInterval(interval);
    }

    window.initRunMap = initMap;
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(googleMapsApiKey)}&callback=initRunMap`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      setError("Failed to load Google Maps");
      setLoading(false);
    };
    document.head.appendChild(script);

    return () => {
      window.initRunMap = undefined;
    };
  }, [customers, googleMapsApiKey]);

  if (!googleMapsApiKey) return null;
  if (customers.length === 0) return null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center gap-2 w-full text-left"
      >
        <MapPin className="w-4 h-4 text-[#3b6d8f]" />
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
          Map
        </h3>
        <span className="text-xs text-gray-400 ml-auto">
          {collapsed ? "Show" : "Hide"}
        </span>
      </button>

      {!collapsed && (
        <div className="mt-4">
          {error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : (
            <div className="relative">
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-lg z-10">
                  <p className="text-sm text-gray-500">Loading map...</p>
                </div>
              )}
              <div
                ref={mapRef}
                className="w-full rounded-lg"
                style={{ height: "400px" }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
