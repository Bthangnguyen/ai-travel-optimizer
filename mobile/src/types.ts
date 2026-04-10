export type Origin = {
  name: string;
  lat: number;
  lon: number;
};

export type ConstraintBundle = {
  budget_max: number;
  soft_tags: string[];
  hard_start: string;
  hard_end: string;
  max_stops: number;
};

export type ItineraryStop = {
  poi_id: string;
  name: string;
  lat: number;
  lon: number;
  arrival_time: string;
  departure_time: string;
  travel_minutes: number;
  visit_minutes: number;
  ticket_price: number;
  outdoor: boolean;
  tags: string[];
};

export type DiscardedPoi = {
  poi_id: string;
  name: string;
  reason: string;
};

export type PlanResponse = {
  trip_id: string;
  prompt_snapshot: string;
  city: string;
  weather: "clear" | "rain";
  engine_used: string;
  fallback_level: number;
  constraints: ConstraintBundle;
  origin: Origin;
  itinerary: ItineraryStop[];
  discarded_pois: DiscardedPoi[];
  diagnostics: {
    parsed_tags: string[];
    candidate_count: number;
    matrix_source: string;
    notes: string[];
  };
};

