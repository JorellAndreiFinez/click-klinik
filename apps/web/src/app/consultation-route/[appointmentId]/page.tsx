"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";
import {
  ArrowLeft,
  Clock3,
  ExternalLink,
  MapPin,
  Navigation,
  Route,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  getMyDoctorAppointments,
  getMyPatientAppointments,
  type Appointment,
} from "@/lib/appointments-api";
import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase";

const TILE_SIZE = 256;
const MIN_MAP_ZOOM = 10;
const MAX_MAP_ZOOM = 15;

export default function ConsultationRoutePage() {
  const params = useParams<{ appointmentId: string }>();
  const router = useRouter();
  const configured = isFirebaseConfigured();
  const [user, setUser] = useState<User | null>(null);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [message, setMessage] = useState(
    configured ? "Loading route..." : "Authentication is not configured yet.",
  );

  useEffect(() => {
    if (!configured) {
      return;
    }

    return onAuthStateChanged(getFirebaseAuth(), (nextUser) => {
      if (!nextUser) {
        router.replace("/auth");
        return;
      }

      setUser(nextUser);
      void loadAppointment(nextUser, params.appointmentId)
        .then((nextAppointment) => {
          setAppointment(nextAppointment);
          setMessage("");
        })
        .catch((error: unknown) => {
          setMessage(
            error instanceof Error
              ? error.message
              : "Unable to load this consultation route.",
          );
        });
    });
  }, [configured, params.appointmentId, router]);

  const route = useMemo(() => {
    if (!appointment) {
      return null;
    }

    return buildRouteModel(appointment);
  }, [appointment]);

  if (!appointment || !route) {
    return (
      <main className="clinic-grid flex min-h-screen items-center justify-center px-5">
        <div className="max-w-md rounded-2xl border border-border bg-card p-8 text-center">
          <MapPin className="mx-auto size-10 text-primary" />
          <p className="mt-5 text-sm text-muted-foreground">{message}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f2e8]">
      <section className="border-b border-[#12324d]/10 bg-white px-5 py-5 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold tracking-[0.18em] text-primary uppercase">
              Click Klinik route
            </p>
            <h1 className="mt-2 text-2xl font-bold text-primary sm:text-3xl">
              Physical visit directions
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              This in-app route uses saved patient and clinic map pins. Use it
              as guidance and confirm travel details before leaving.
            </p>
          </div>
          <Button
            asChild
            variant="outline"
            className="h-11 rounded-xl bg-white"
          >
            <Link href={getBackHref(user, appointment)}>
              <ArrowLeft className="size-4" />
              Back
            </Link>
          </Button>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-5 px-5 py-5 sm:px-8 xl:grid-cols-[1fr_360px]">
        <div className="overflow-hidden rounded-2xl border border-[#12324d]/10 bg-white">
          {route.hasCoordinates ? (
            <RouteMap route={route} />
          ) : (
            <div className="flex min-h-[460px] items-center justify-center px-6 text-center">
              <div className="max-w-md">
                <MapPin className="mx-auto size-10 text-primary" />
                <p className="mt-4 font-bold text-primary">
                  Exact map pins are missing.
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Ask the patient and doctor to save their profile map pins,
                  then this page can draw the route line without Google Maps.
                </p>
              </div>
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <section className="rounded-2xl border border-[#12324d]/10 bg-white p-5">
            <p className="text-xs font-bold tracking-[0.16em] text-primary uppercase">
              Visit summary
            </p>
            <h2 className="mt-2 text-xl font-bold text-primary">
              {appointment.doctorName}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {appointment.consultationLabel || appointment.specializationName}
            </p>
            <div className="mt-4 grid gap-3">
              <RouteInfo
                icon={<Clock3 className="size-4" />}
                label="Schedule"
                value={formatTimeRange(
                  appointment.scheduledStartAt,
                  appointment.scheduledEndAt,
                )}
              />
              <RouteInfo
                icon={<Route className="size-4" />}
                label="Estimated distance"
                value={
                  route.distanceKm
                    ? `${route.distanceKm.toFixed(1)} km straight-line`
                    : "Needs exact pins"
                }
              />
              <RouteInfo
                icon={<Navigation className="size-4" />}
                label="Estimated travel"
                value={
                  route.distanceKm
                    ? `${estimateTravelMinutes(route.distanceKm)} min by road estimate`
                    : "Unavailable"
                }
              />
            </div>
          </section>

          <section className="rounded-2xl border border-[#12324d]/10 bg-white p-5">
            <p className="text-xs font-bold tracking-[0.16em] text-primary uppercase">
              Route points
            </p>
            <div className="mt-4 grid gap-3">
              <LocationBlock label="Patient start" value={route.originLabel} />
              <LocationBlock
                label="Clinic destination"
                value={route.destinationLabel}
              />
            </div>
          </section>
        </aside>
      </section>
    </main>
  );
}

async function loadAppointment(user: User, appointmentId: string) {
  const patientAppointments = await getMyPatientAppointments(user).catch(
    () => [],
  );
  const patientAppointment = patientAppointments.find(
    (appointment) => appointment._id === appointmentId,
  );
  if (patientAppointment) {
    return patientAppointment;
  }

  const doctorAppointments = await getMyDoctorAppointments(user).catch(
    () => [],
  );
  const doctorAppointment = doctorAppointments.find(
    (appointment) => appointment._id === appointmentId,
  );
  if (doctorAppointment) {
    return doctorAppointment;
  }

  throw new Error("Physical visit route was not found for this account.");
}

function RouteMap({ route }: { route: RouteModel }) {
  const [roadRoute, setRoadRoute] = useState<RoutePath | null>(null);
  const [routeStatus, setRouteStatus] = useState("Drawing route...");
  const routePath = roadRoute ?? createFallbackRoutePath(route);
  const pathBounds = getPathBounds(routePath.points);
  const center = {
    latitude: (pathBounds.minLatitude + pathBounds.maxLatitude) / 2,
    longitude: (pathBounds.minLongitude + pathBounds.maxLongitude) / 2,
  };
  const mapSize = { width: 960, height: 560 };
  const zoom = chooseZoomForBounds(pathBounds, mapSize);
  const tiles = getVisibleTiles(
    center.latitude,
    center.longitude,
    zoom,
    mapSize,
  );
  const originPoint = latLngToViewportPoint(
    route.origin.latitude,
    route.origin.longitude,
    center,
    zoom,
    mapSize,
  );
  const destinationPoint = latLngToViewportPoint(
    route.destination.latitude,
    route.destination.longitude,
    center,
    zoom,
    mapSize,
  );
  const routePoints = routePath.points.map((point) =>
    latLngToViewportPoint(
      point.latitude,
      point.longitude,
      center,
      zoom,
      mapSize,
    ),
  );
  const linePoints = routePoints
    .map((point) => `${point.x},${point.y}`)
    .join(" ");

  useEffect(() => {
    let active = true;

    void fetchRoadRoute(route)
      .then((nextRoute) => {
        if (!active) {
          return;
        }

        if (nextRoute) {
          setRoadRoute(nextRoute);
          setRouteStatus("Road route estimate");
          return;
        }

        setRouteStatus("Visual route estimate");
      })
      .catch(() => {
        if (active) {
          setRouteStatus("Visual route estimate");
        }
      });

    return () => {
      active = false;
    };
  }, [
    route.origin.latitude,
    route.origin.longitude,
    route.destination.latitude,
    route.destination.longitude,
  ]);

  return (
    <div className="relative h-[min(70vh,640px)] min-h-[460px] overflow-hidden bg-[#dfe8df]">
      <div className="absolute inset-0">
        {tiles.map((tile) => (
          <img
            key={`${tile.zoom}-${tile.x}-${tile.y}`}
            alt=""
            src={`https://a.basemaps.cartocdn.com/rastertiles/voyager/${tile.zoom}/${tile.wrappedX}/${tile.y}.png`}
            className="absolute size-64 max-w-none select-none"
            draggable={false}
            style={{ left: `${tile.left}%`, top: `${tile.top}%` }}
          />
        ))}
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-[#082b45]/10" />
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        preserveAspectRatio="none"
        viewBox="0 0 100 100"
      >
        <polyline
          points={linePoints}
          fill="none"
          stroke="#ffffff"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
        <polyline
          points={linePoints}
          fill="none"
          stroke="#2563eb"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.1"
        />
        <polyline
          points={linePoints}
          fill="none"
          stroke="#5b21b6"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeOpacity="0.85"
          strokeWidth="0.45"
        />
      </svg>
      <RouteDistancePill
        point={getRouteLabelPoint(routePoints)}
        distanceKm={routePath.distanceKm}
        status={routeStatus}
      />
      <MapMarker point={originPoint} label="Patient" tone="start" />
      <MapMarker point={destinationPoint} label="Clinic" tone="clinic" />
      <div className="absolute bottom-4 left-4 right-4 grid gap-3 sm:left-auto sm:w-[390px]">
        <div className="grid grid-cols-2 gap-2">
          <a
            href={getOpenStreetMapDirectionsUrl(route)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-3 py-3 text-xs font-bold text-white shadow-lg"
          >
            Open full map
            <ExternalLink className="size-3.5" />
          </a>
          <a
            href={getOsrmDemoUrl(route)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#12324d]/10 bg-white px-3 py-3 text-xs font-bold text-primary shadow-lg"
          >
            OSRM route
            <ExternalLink className="size-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}

function RouteDistancePill({
  point,
  distanceKm,
  status,
}: {
  point: { x: number; y: number };
  distanceKm: number;
  status: string;
}) {
  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[#12324d]/10 bg-white/95 px-4 py-3 text-center shadow-xl backdrop-blur"
      style={{ left: `${point.x}%`, top: `${point.y}%` }}
    >
      <p className="text-[10px] font-bold tracking-[0.14em] text-primary uppercase">
        {status}
      </p>
      <p className="mt-1 text-sm font-bold text-primary">
        {distanceKm.toFixed(1)} km route
      </p>
    </div>
  );
}

function MapMarker({
  point,
  label,
  tone,
}: {
  point: { x: number; y: number };
  label: string;
  tone: "start" | "clinic";
}) {
  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-full"
      style={{ left: `${point.x}%`, top: `${point.y}%` }}
    >
      <div className="flex flex-col items-center">
        <span
          className={
            tone === "clinic"
              ? "flex size-12 items-center justify-center rounded-full border-4 border-white bg-secondary text-primary shadow-xl"
              : "flex size-12 items-center justify-center rounded-full border-4 border-white bg-primary text-white shadow-xl"
          }
        >
          <MapPin className="size-6 fill-current" />
        </span>
        <span className="mt-2 rounded-full bg-white px-3 py-1 text-xs font-bold text-primary shadow">
          {label}
        </span>
      </div>
    </div>
  );
}

function RouteInfo({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-[#12324d]/10 bg-[#fcfaf5] px-4 py-3">
      <p className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
        {icon}
        {label}
      </p>
      <p className="mt-2 text-sm font-bold text-primary">{value}</p>
    </div>
  );
}

function LocationBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#12324d]/10 bg-[#fcfaf5] px-4 py-3">
      <p className="text-[10px] font-bold tracking-[0.14em] text-muted-foreground uppercase">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold leading-6 text-primary">
        {value}
      </p>
    </div>
  );
}

type RouteModel = {
  origin: { latitude: number; longitude: number };
  destination: { latitude: number; longitude: number };
  originLabel: string;
  destinationLabel: string;
  hasCoordinates: boolean;
  distanceKm?: number;
};

type RoutePath = {
  points: Array<{ latitude: number; longitude: number }>;
  distanceKm: number;
};

function buildRouteModel(appointment: Appointment): RouteModel {
  const hasCoordinates =
    isValidCoordinate(
      appointment.patientLatitude,
      appointment.patientLongitude,
    ) &&
    isValidCoordinate(appointment.doctorLatitude, appointment.doctorLongitude);
  const origin = {
    latitude: appointment.patientLatitude ?? 14.5995,
    longitude: appointment.patientLongitude ?? 120.9842,
  };
  const destination = {
    latitude: appointment.doctorLatitude ?? origin.latitude + 0.01,
    longitude: appointment.doctorLongitude ?? origin.longitude + 0.01,
  };

  return {
    origin,
    destination,
    originLabel: appointment.patientLocation ?? "Saved patient location",
    destinationLabel:
      appointment.doctorLocation ??
      appointment.doctorClinicOrHospital ??
      "Doctor clinic location",
    hasCoordinates,
    distanceKm: hasCoordinates
      ? calculateDistanceKm(
          origin.latitude,
          origin.longitude,
          destination.latitude,
          destination.longitude,
        )
      : undefined,
  };
}

function getRouteBounds(route: RouteModel) {
  const padding = 0.01;
  return {
    minLatitude:
      Math.min(route.origin.latitude, route.destination.latitude) - padding,
    maxLatitude:
      Math.max(route.origin.latitude, route.destination.latitude) + padding,
    minLongitude:
      Math.min(route.origin.longitude, route.destination.longitude) - padding,
    maxLongitude:
      Math.max(route.origin.longitude, route.destination.longitude) + padding,
  };
}

function getPathBounds(points: RoutePath["points"]) {
  const latitudes = points.map((point) => point.latitude);
  const longitudes = points.map((point) => point.longitude);
  const latitudeSpan = Math.max(...latitudes) - Math.min(...latitudes);
  const longitudeSpan = Math.max(...longitudes) - Math.min(...longitudes);
  const padding = Math.max(latitudeSpan, longitudeSpan, 0.01) * 0.18;

  return {
    minLatitude: Math.min(...latitudes) - padding,
    maxLatitude: Math.max(...latitudes) + padding,
    minLongitude: Math.min(...longitudes) - padding,
    maxLongitude: Math.max(...longitudes) + padding,
  };
}

function chooseZoomForBounds(
  bounds: ReturnType<typeof getPathBounds>,
  mapSize: { width: number; height: number },
) {
  const center = {
    latitude: (bounds.minLatitude + bounds.maxLatitude) / 2,
    longitude: (bounds.minLongitude + bounds.maxLongitude) / 2,
  };

  for (let zoom = MAX_MAP_ZOOM; zoom >= MIN_MAP_ZOOM; zoom -= 1) {
    const northWest = latLngToWorldPixel(
      bounds.maxLatitude,
      bounds.minLongitude,
      zoom,
    );
    const southEast = latLngToWorldPixel(
      bounds.minLatitude,
      bounds.maxLongitude,
      zoom,
    );
    const centerPoint = latLngToWorldPixel(
      center.latitude,
      center.longitude,
      zoom,
    );
    const width = Math.abs(southEast.x - northWest.x);
    const height = Math.abs(southEast.y - northWest.y);
    const fitsWidth = width <= mapSize.width * 0.82;
    const fitsHeight = height <= mapSize.height * 0.76;
    const centerInWorld =
      Number.isFinite(centerPoint.x) && Number.isFinite(centerPoint.y);

    if (fitsWidth && fitsHeight && centerInWorld) {
      return zoom;
    }
  }

  return MIN_MAP_ZOOM;
}

async function fetchRoadRoute(route: RouteModel): Promise<RoutePath | null> {
  const url = new URL(
    `https://router.project-osrm.org/route/v1/driving/${route.origin.longitude},${route.origin.latitude};${route.destination.longitude},${route.destination.latitude}`,
  );
  url.searchParams.set("overview", "full");
  url.searchParams.set("geometries", "geojson");
  url.searchParams.set("alternatives", "false");
  url.searchParams.set("steps", "false");

  const response = await fetch(url.toString(), { cache: "no-store" });
  if (!response.ok) {
    return null;
  }

  const result = (await response.json()) as {
    routes?: Array<{
      distance?: number;
      geometry?: {
        coordinates?: Array<[number, number]>;
      };
    }>;
  };
  const bestRoute = result.routes?.[0];
  const coordinates = bestRoute?.geometry?.coordinates;

  if (!coordinates || coordinates.length < 2 || !bestRoute.distance) {
    return null;
  }

  return {
    distanceKm: bestRoute.distance / 1000,
    points: coordinates.map(([longitude, latitude]) => ({
      latitude,
      longitude,
    })),
  };
}

function createFallbackRoutePath(route: RouteModel): RoutePath {
  const { origin, destination } = route;
  const midLatitude = (origin.latitude + destination.latitude) / 2;
  const midLongitude = (origin.longitude + destination.longitude) / 2;
  const latitudeDelta = destination.latitude - origin.latitude;
  const longitudeDelta = destination.longitude - origin.longitude;
  const bend =
    Math.max(Math.abs(latitudeDelta), Math.abs(longitudeDelta)) * 0.18;
  const bendDirection = longitudeDelta >= 0 ? 1 : -1;
  const points = [
    origin,
    {
      latitude: origin.latitude + latitudeDelta * 0.16,
      longitude:
        origin.longitude + longitudeDelta * 0.08 + bend * bendDirection,
    },
    {
      latitude: origin.latitude + latitudeDelta * 0.32,
      longitude:
        origin.longitude + longitudeDelta * 0.26 + bend * bendDirection,
    },
    {
      latitude: midLatitude,
      longitude: midLongitude,
    },
    {
      latitude: origin.latitude + latitudeDelta * 0.68,
      longitude:
        origin.longitude + longitudeDelta * 0.74 - bend * bendDirection * 0.5,
    },
    {
      latitude: origin.latitude + latitudeDelta * 0.84,
      longitude: origin.longitude + longitudeDelta * 0.92,
    },
    destination,
  ];
  const routeDistanceKm = points.slice(1).reduce((sum, point, index) => {
    const previous = points[index];
    return (
      sum +
      calculateDistanceKm(
        previous.latitude,
        previous.longitude,
        point.latitude,
        point.longitude,
      )
    );
  }, 0);

  return {
    points,
    distanceKm: Math.max(routeDistanceKm, route.distanceKm ?? 0),
  };
}

function getRouteLabelPoint(points: Array<{ x: number; y: number }>) {
  if (points.length === 0) {
    return { x: 50, y: 50 };
  }

  const middlePoint = points[Math.floor(points.length / 2)];
  return {
    x: clamp(middlePoint.x, 18, 82),
    y: clamp(middlePoint.y - 8, 14, 86),
  };
}

function getOpenStreetMapDirectionsUrl(route: RouteModel) {
  const start = `${route.origin.latitude},${route.origin.longitude}`;
  const end = `${route.destination.latitude},${route.destination.longitude}`;
  return `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${encodeURIComponent(
    `${start};${end}`,
  )}`;
}

function getOsrmDemoUrl(route: RouteModel) {
  return `https://map.project-osrm.org/?z=12&center=${route.origin.latitude},${route.origin.longitude}&loc=${route.origin.latitude},${route.origin.longitude}&loc=${route.destination.latitude},${route.destination.longitude}&hl=en&alt=0&srv=0`;
}

function latLngToViewportPoint(
  latitude: number,
  longitude: number,
  center: { latitude: number; longitude: number },
  zoom: number,
  size: { width: number; height: number },
) {
  const centerPoint = latLngToWorldPixel(
    center.latitude,
    center.longitude,
    zoom,
  );
  const point = latLngToWorldPixel(latitude, longitude, zoom);
  return {
    x: ((point.x - centerPoint.x + size.width / 2) / size.width) * 100,
    y: ((point.y - centerPoint.y + size.height / 2) / size.height) * 100,
  };
}

function getVisibleTiles(
  latitude: number,
  longitude: number,
  zoom: number,
  mapSize: { width: number; height: number },
) {
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
        left:
          ((x * TILE_SIZE - center.x + mapSize.width / 2) / mapSize.width) *
          100,
        top:
          ((y * TILE_SIZE - center.y + mapSize.height / 2) / mapSize.height) *
          100,
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
      (0.5 - Math.log((1 + sinLatitude) / (1 - sinLatitude)) / (4 * Math.PI)) *
      scale,
  };
}

function calculateDistanceKm(
  startLatitude: number,
  startLongitude: number,
  endLatitude: number,
  endLongitude: number,
) {
  const earthRadiusKm = 6371;
  const deltaLatitude = toRadians(endLatitude - startLatitude);
  const deltaLongitude = toRadians(endLongitude - startLongitude);
  const startLatRad = toRadians(startLatitude);
  const endLatRad = toRadians(endLatitude);
  const value =
    Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos(startLatRad) *
      Math.cos(endLatRad) *
      Math.sin(deltaLongitude / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function isValidCoordinate(latitude?: number, longitude?: number) {
  return (
    typeof latitude === "number" &&
    typeof longitude === "number" &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude)
  );
}

function estimateTravelMinutes(distanceKm: number) {
  return Math.max(Math.round((distanceKm / 18) * 60), 8);
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function normalizeLongitude(longitude: number) {
  return ((((longitude + 180) % 360) + 360) % 360) - 180;
}

function formatTimeRange(startAt: string, endAt: string) {
  return `${formatTime(startAt)} - ${formatTime(endAt)}`;
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Manila",
  }).format(new Date(value));
}

function getBackHref(user: User | null, appointment: Appointment) {
  if (user?.email === appointment.doctorEmail) {
    return "/doctor/schedule/calendar";
  }

  return "/patient/appointments";
}
