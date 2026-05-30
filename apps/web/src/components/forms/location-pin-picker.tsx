"use client";

import {
  type PointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Crosshair, LocateFixed, MapPin, Minus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const MAP_BOX_SIZE = 0.008;
const MAP_RANGE = MAP_BOX_SIZE * 2;
const TILE_SIZE = 256;
const DEFAULT_LATITUDE = 14.5995;
const DEFAULT_LONGITUDE = 120.9842;
const DEFAULT_ZOOM = 15;

type LocationPinPickerProps = {
  defaultLatitude?: number;
  defaultLongitude?: number;
  latitudeName?: string;
  longitudeName?: string;
  title?: string;
  description?: string;
};

export function LocationPinPicker({
  defaultLatitude,
  defaultLongitude,
  latitudeName = "latitude",
  longitudeName = "longitude",
  title = "Exact map pin",
  description = "Use this for physical visits and route estimates. You can update it anytime in your profile.",
}: LocationPinPickerProps) {
  const [latitude, setLatitude] = useState(formatCoordinate(defaultLatitude));
  const [longitude, setLongitude] = useState(formatCoordinate(defaultLongitude));
  const [mapCenter, setMapCenter] = useState(() => ({
    latitude: defaultLatitude,
    longitude: defaultLongitude,
  }));
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [mapSize, setMapSize] = useState({ width: 0, height: 0 });
  const [dragStart, setDragStart] = useState<{
    x: number;
    y: number;
    latitude: number;
    longitude: number;
    zoom: number;
    moved: boolean;
  } | null>(null);
  const [status, setStatus] = useState("");
  const mapRef = useRef<HTMLDivElement | null>(null);

  const parsedLatitude = Number(latitude);
  const parsedLongitude = Number(longitude);
  const hasValidPin =
    Number.isFinite(parsedLatitude) &&
    Number.isFinite(parsedLongitude) &&
    parsedLatitude >= -90 &&
    parsedLatitude <= 90 &&
    parsedLongitude >= -180 &&
    parsedLongitude <= 180;

  const centerLatitude =
    typeof mapCenter.latitude === "number"
      ? mapCenter.latitude
      : hasValidPin
        ? parsedLatitude
        : DEFAULT_LATITUDE;
  const centerLongitude =
    typeof mapCenter.longitude === "number"
      ? mapCenter.longitude
      : hasValidPin
        ? parsedLongitude
        : DEFAULT_LONGITUDE;

  const tiles = useMemo(
    () => getVisibleTiles(centerLatitude, centerLongitude, zoom, mapSize),
    [centerLatitude, centerLongitude, zoom, mapSize],
  );

  useEffect(() => {
    if (!mapRef.current) return;

    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      setMapSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });

    observer.observe(mapRef.current);
    return () => observer.disconnect();
  }, []);

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setStatus("Your browser does not support location detection.");
      return;
    }

    setStatus("Getting your location...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLatitude = position.coords.latitude;
        const nextLongitude = position.coords.longitude;
        setPinLocation(nextLatitude, nextLongitude);
        setStatus("Pin updated from your current device location.");
      },
      () => setStatus("Unable to get location. You can enter the pin manually."),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  function recenterMap() {
    if (!hasValidPin) {
      setPinLocation(DEFAULT_LATITUDE, DEFAULT_LONGITUDE);
      setStatus("Map centered on Manila. Drag to choose your exact pin.");
      return;
    }

    setMapCenter({ latitude: parsedLatitude, longitude: parsedLongitude });
    setStatus("Map centered on the saved pin.");
  }

  function updatePinFromClick(event: PointerEvent<HTMLDivElement>) {
    const nextLocation = getLocationFromPointer(event);
    if (!nextLocation) return;

    setPinLocation(nextLocation.latitude, nextLocation.longitude);
    setStatus("Pin moved. Save the form to keep this exact location.");
  }

  function startDraggingMap(event: PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);

    setDragStart({
      x: event.clientX,
      y: event.clientY,
      latitude: centerLatitude,
      longitude: centerLongitude,
      zoom,
      moved: false,
    });
  }

  function dragMap(event: PointerEvent<HTMLDivElement>) {
    if (!dragStart) return;

    const deltaX = event.clientX - dragStart.x;
    const deltaY = event.clientY - dragStart.y;
    const startWorldPoint = latLngToWorldPixel(
      dragStart.latitude,
      dragStart.longitude,
      dragStart.zoom,
    );
    const nextLocation = worldPixelToLatLng(
      startWorldPoint.x - deltaX,
      startWorldPoint.y - deltaY,
      dragStart.zoom,
    );

    setDragStart({
      ...dragStart,
      moved: dragStart.moved || Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3,
    });
    setPinLocation(nextLocation.latitude, nextLocation.longitude);
    setStatus("Map moved. Save the form to keep this exact location.");
  }

  function stopDraggingMap(event: PointerEvent<HTMLDivElement>) {
    if (!dragStart) return;

    if (!dragStart.moved) {
      updatePinFromClick(event);
    }

    setDragStart(null);
  }

  function getLocationFromPointer(event: PointerEvent<HTMLDivElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    if (bounds.width <= 0 || bounds.height <= 0) return null;

    const centerPoint = latLngToWorldPixel(centerLatitude, centerLongitude, zoom);
    const nextWorldX = centerPoint.x + event.clientX - bounds.left - bounds.width / 2;
    const nextWorldY = centerPoint.y + event.clientY - bounds.top - bounds.height / 2;
    return worldPixelToLatLng(nextWorldX, nextWorldY, zoom);
  }

  function setPinLocation(nextLatitude: number, nextLongitude: number) {
    const safeLatitude = clamp(nextLatitude, -85, 85);
    const safeLongitude = normalizeLongitude(nextLongitude);
    setLatitude(formatCoordinate(safeLatitude));
    setLongitude(formatCoordinate(safeLongitude));
    setMapCenter({ latitude: safeLatitude, longitude: safeLongitude });
  }

  function changeZoom(nextZoom: number) {
    setZoom(clamp(nextZoom, 5, 19));
    if (hasValidPin) {
      setMapCenter({ latitude: parsedLatitude, longitude: parsedLongitude });
    }
  }

  return (
    <section className="rounded-2xl border border-primary/10 bg-[#f6f0e4] p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
            <MapPin className="size-5" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-primary">{title}</h3>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {description}
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          className="h-10 shrink-0 rounded-xl bg-white"
          onClick={useCurrentLocation}
        >
          <Crosshair className="size-4" />
          Use current location
        </Button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold text-primary">
          Latitude
          <Input
            name={latitudeName}
            inputMode="decimal"
            value={latitude}
            onChange={(event) => setLatitude(event.target.value)}
            placeholder="14.5995"
            className="h-11 rounded-xl bg-white"
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-primary">
          Longitude
          <Input
            name={longitudeName}
            inputMode="decimal"
            value={longitude}
            onChange={(event) => setLongitude(event.target.value)}
            placeholder="120.9842"
            className="h-11 rounded-xl bg-white"
          />
        </label>
      </div>

      {status ? (
        <p className="mt-3 rounded-xl border border-primary/10 bg-white px-3 py-2 text-xs leading-5 text-primary">
          {status}
        </p>
      ) : null}

      <div className="mt-4 overflow-hidden rounded-2xl border border-primary/10 bg-white">
        {hasValidPin || mapSize ? (
          <div ref={mapRef} className="relative h-72 select-none overflow-hidden bg-[#dfe8df]">
            <div className="absolute inset-0">
              {tiles.map((tile) => (
                <img
                  key={`${tile.zoom}-${tile.x}-${tile.y}`}
                  alt=""
                  src={`https://tile.openstreetmap.org/${tile.zoom}/${tile.wrappedX}/${tile.y}.png`}
                  className="absolute size-64 max-w-none select-none"
                  draggable={false}
                  style={{
                    left: tile.left,
                    top: tile.top,
                  }}
                />
              ))}
            </div>
            <div
              className="absolute inset-0 cursor-grab active:cursor-grabbing"
              role="application"
              aria-label="Drag the map or click to move the exact location pin"
              onPointerDown={startDraggingMap}
              onPointerMove={(event) => {
                if (event.buttons === 1) {
                  dragMap(event);
                }
              }}
              onPointerUp={stopDraggingMap}
              onPointerCancel={() => setDragStart(null)}
            >
              <div
                className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full drop-shadow-[0_8px_14px_rgba(8,43,69,0.35)]"
              >
                <div className="flex flex-col items-center">
                  <span className="flex size-11 items-center justify-center rounded-full border-4 border-white bg-secondary text-primary shadow-lg">
                    <MapPin className="size-6 fill-current" />
                  </span>
                  <span className="-mt-1 size-3 rotate-45 rounded-sm bg-secondary shadow" />
                </div>
              </div>
            </div>
            <div className="absolute left-3 top-3 z-10 grid overflow-hidden rounded-xl border border-primary/10 bg-white shadow-sm">
              <button
                type="button"
                aria-label="Zoom in"
                className="flex size-10 items-center justify-center text-primary hover:bg-secondary/25"
                onClick={() => changeZoom(zoom + 1)}
              >
                <Plus className="size-4" />
              </button>
              <button
                type="button"
                aria-label="Zoom out"
                className="flex size-10 items-center justify-center border-t border-primary/10 text-primary hover:bg-secondary/25"
                onClick={() => changeZoom(zoom - 1)}
              >
                <Minus className="size-4" />
              </button>
            </div>
            <div className="pointer-events-none absolute right-3 bottom-3 left-3 z-10 flex flex-col gap-2 rounded-xl border border-primary/10 bg-white/95 p-3 text-xs text-primary shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <span>Drag, click, or zoom the map. The center pin is the saved location.</span>
              <Button
                type="button"
                variant="outline"
                className="pointer-events-auto h-8 rounded-lg bg-white px-3 text-xs"
                onClick={recenterMap}
              >
                <LocateFixed className="size-3" />
                Center map on pin
              </Button>
            </div>
            <a
              className="absolute bottom-1 right-2 z-10 rounded bg-white/80 px-1 text-[10px] text-primary/70"
              href="https://www.openstreetmap.org/copyright"
              target="_blank"
              rel="noreferrer"
            >
              OSM
            </a>
          </div>
        ) : (
          <div className="flex h-44 items-center justify-center px-5 text-center text-sm leading-6 text-muted-foreground">
            Add latitude and longitude, or use your current location, to preview the physical visit pin.
          </div>
        )}
      </div>
    </section>
  );
}

function formatCoordinate(value?: number) {
  return typeof value === "number" && Number.isFinite(value)
    ? String(Number(value.toFixed(6)))
    : "";
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getVisibleTiles(
  latitude: number,
  longitude: number,
  zoom: number,
  mapSize: { width: number; height: number },
) {
  if (mapSize.width <= 0 || mapSize.height <= 0) {
    return [];
  }

  const center = latLngToWorldPixel(latitude, longitude, zoom);
  const minTileX = Math.floor((center.x - mapSize.width / 2) / TILE_SIZE) - 1;
  const maxTileX = Math.floor((center.x + mapSize.width / 2) / TILE_SIZE) + 1;
  const minTileY = Math.floor((center.y - mapSize.height / 2) / TILE_SIZE) - 1;
  const maxTileY = Math.floor((center.y + mapSize.height / 2) / TILE_SIZE) + 1;
  const tileCount = 2 ** zoom;
  const tiles: Array<{
    x: number;
    y: number;
    wrappedX: number;
    zoom: number;
    left: number;
    top: number;
  }> = [];

  for (let x = minTileX; x <= maxTileX; x += 1) {
    for (let y = minTileY; y <= maxTileY; y += 1) {
      if (y < 0 || y >= tileCount) continue;

      tiles.push({
        x,
        y,
        wrappedX: ((x % tileCount) + tileCount) % tileCount,
        zoom,
        left: x * TILE_SIZE - center.x + mapSize.width / 2,
        top: y * TILE_SIZE - center.y + mapSize.height / 2,
      });
    }
  }

  return tiles;
}

function latLngToWorldPixel(latitude: number, longitude: number, zoom: number) {
  const sinLatitude = Math.sin((clamp(latitude, -85, 85) * Math.PI) / 180);
  const scale = TILE_SIZE * 2 ** zoom;

  return {
    x: ((normalizeLongitude(longitude) + 180) / 360) * scale,
    y:
      (0.5 -
        Math.log((1 + sinLatitude) / (1 - sinLatitude)) / (4 * Math.PI)) *
      scale,
  };
}

function worldPixelToLatLng(x: number, y: number, zoom: number) {
  const scale = TILE_SIZE * 2 ** zoom;
  const longitude = (x / scale) * 360 - 180;
  const mercatorY = 0.5 - y / scale;
  const latitude =
    90 -
    (360 * Math.atan(Math.exp(-mercatorY * 2 * Math.PI))) / Math.PI;

  return {
    latitude: clamp(latitude, -85, 85),
    longitude: normalizeLongitude(longitude),
  };
}

function normalizeLongitude(longitude: number) {
  return ((((longitude + 180) % 360) + 360) % 360) - 180;
}
