from fastapi import FastAPI, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import random
import math
from datetime import datetime, timedelta
from typing import Optional, List

app = FastAPI(title="HemoSync AI API", version="2.5.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BLOOD_GROUPS = ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"]

HOSPITALS = [
    {
        "id": "h1",
        "name": "RIMS Blood Bank (Bariatu)",
        "type": "blood_bank",
        "lat": 23.3897,
        "lng": 85.3490,
        "city": "Bariatu, Ranchi",
        "address": "Rajendra Institute of Medical Sciences, Bariatu Rd, Ranchi 834009",
        "phone": "+91 651 254 1533",
        "cold_storage_capacity": 650,
        "cold_storage_temp": 4.1,
        "photo": "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=900&q=80",
        "director": {
            "name": "Dr. Vikramaditya Rao",
            "title": "Chief Transfusion Officer",
            "avatar": "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=300&q=80",
        },
    },
    {
        "id": "h2",
        "name": "Sadar Hospital Ranchi",
        "type": "hospital",
        "lat": 23.3687,
        "lng": 85.3292,
        "city": "Purulia Road, Ranchi",
        "address": "Purulia Road, Near Albert Ekka Chowk, Ranchi, Jharkhand 834001",
        "phone": "+91 651 221 1800",
        "cold_storage_capacity": 480,
        "cold_storage_temp": 4.2,
        "photo": "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=900&q=80",
        "director": {
            "name": "Dr. Meera Krishnan",
            "title": "Head of Emergency & Trauma",
            "avatar": "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=300&q=80",
        },
    },
    {
        "id": "h3",
        "name": "Bhagwan Mahavir Medica Superspecialty",
        "type": "hospital",
        "lat": 23.3792,
        "lng": 85.3578,
        "city": "Booty Road, Bariatu",
        "address": "P.H.E.D. Colony, Booty Rd, Bariatu, Ranchi 834009",
        "phone": "+91 651 660 6000",
        "cold_storage_capacity": 520,
        "cold_storage_temp": 4.0,
        "photo": "https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&w=900&q=80",
        "director": {
            "name": "Dr. Siddharth Malhotra",
            "title": "Director of Hematology",
            "avatar": "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=300&q=80",
        },
    },
    {
        "id": "h4",
        "name": "Orchid Medical Centre",
        "type": "hospital",
        "lat": 23.3712,
        "lng": 85.3358,
        "city": "Circular Road, Lalpur",
        "address": "H.B. Road, Near Plaza Chowk, Lalpur, Ranchi 834001",
        "phone": "+91 651 710 0100",
        "cold_storage_capacity": 540,
        "cold_storage_temp": 4.1,
        "photo": "https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&w=900&q=80",
        "director": {
            "name": "Dr. Ananya Deshmukh",
            "title": "Medical Director, Blood Services",
            "avatar": "https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&w=300&q=80",
        },
    },
    {
        "id": "h5",
        "name": "Raj Hospital (Main Road)",
        "type": "hospital",
        "lat": 23.3549,
        "lng": 85.3248,
        "city": "Main Road, Ranchi",
        "address": "Mahatma Gandhi Main Rd, Behind Daily Market, Ranchi 834001",
        "phone": "+91 651 233 0222",
        "cold_storage_capacity": 440,
        "cold_storage_temp": 4.3,
        "photo": "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=900&q=80",
        "director": {
            "name": "Dr. Rajeshwar Nair",
            "title": "Chief of Surgical Services",
            "avatar": "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=300&q=80",
        },
    },
    {
        "id": "h6",
        "name": "Devkamal Hospital (Ratu Road)",
        "type": "hospital",
        "lat": 23.3772,
        "lng": 85.2918,
        "city": "Ratu Road, Ranchi",
        "address": "Bajra, Itki-Ratu Road Corridor, Ranchi, Jharkhand 834005",
        "phone": "+91 651 251 3990",
        "cold_storage_capacity": 460,
        "cold_storage_temp": 4.2,
        "photo": "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=900&q=80",
        "director": {
            "name": "Dr. Kabir Verma",
            "title": "Transfusion Medicine Lead",
            "avatar": "https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&w=300&q=80",
        },
    },
    {
        "id": "h7",
        "name": "Red Cross Blood Center Ranchi",
        "type": "blood_bank",
        "lat": 23.3776,
        "lng": 85.3204,
        "city": "Morabadi, Ranchi",
        "address": "Indian Red Cross Bhavan, Morabadi Ground Rd, Ranchi 834008",
        "phone": "+91 651 220 6712",
        "cold_storage_capacity": 580,
        "cold_storage_temp": 3.9,
        "photo": "https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&w=900&q=80",
        "director": {
            "name": "Dr. Priya Sengupta",
            "title": "Regional Cold-Chain Chief",
            "avatar": "https://images.unsplash.com/photo-1651008376811-b90baee60c1f?auto=format&fit=crop&w=300&q=80",
        },
    },
    {
        "id": "h8",
        "name": "Alam Hospital (Bariatu)",
        "type": "hospital",
        "lat": 23.3958,
        "lng": 85.3586,
        "city": "Bariatu, Ranchi",
        "address": "Bariatu Road, Near Army Camp, Ranchi, Jharkhand 834009",
        "phone": "+91 651 254 8801",
        "cold_storage_capacity": 500,
        "cold_storage_temp": 4.1,
        "photo": "https://images.unsplash.com/photo-1504439468489-c8920d796a29?auto=format&fit=crop&w=900&q=80",
        "director": {
            "name": "Dr. Rohan Kapoor",
            "title": "Critical Care Blood Lead",
            "avatar": "https://images.unsplash.com/photo-1638202993928-7267aad84c31?auto=format&fit=crop&w=300&q=80",
        },
    },
    {
        "id": "h9",
        "name": "Paras HEC Hospital (Dhurwa)",
        "type": "hospital",
        "lat": 23.3106,
        "lng": 85.2804,
        "city": "Dhurwa, Ranchi",
        "address": "HEC Sector III, Dhurwa Township, Ranchi, Jharkhand 834004",
        "phone": "+91 651 660 8800",
        "cold_storage_capacity": 510,
        "cold_storage_temp": 4.0,
        "photo": "https://images.unsplash.com/photo-1512678080530-7760d81faba6?auto=format&fit=crop&w=900&q=80",
        "director": {
            "name": "Dr. Arvind Prasad",
            "title": "Trauma & Transfusion Chief",
            "avatar": "https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&w=300&q=80",
        },
    },
    {
        "id": "h10",
        "name": "Guru Nanak Hospital (Station Road)",
        "type": "hospital",
        "lat": 23.3519,
        "lng": 85.3347,
        "city": "Station Road, Ranchi",
        "address": "Station Road, Near Siromtoli Chowk, Ranchi, Jharkhand 834001",
        "phone": "+91 651 246 0892",
        "cold_storage_capacity": 430,
        "cold_storage_temp": 4.2,
        "photo": "https://images.unsplash.com/photo-1586773860383-dab5f3bc1bcc?auto=format&fit=crop&w=900&q=80",
        "director": {
            "name": "Dr. Harpreet Kaur",
            "title": "Blood Bank Medical Officer",
            "avatar": "https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&w=300&q=80",
        },
    },
    {
        "id": "h11",
        "name": "Pulse Superspecialty Hospital (Bariatu)",
        "type": "hospital",
        "lat": 23.3976,
        "lng": 85.3418,
        "city": "Bariatu, Ranchi",
        "address": "Bariatu Housing Colony Rd, Near RIMS Gate, Ranchi 834009",
        "phone": "+91 651 712 4000",
        "cold_storage_capacity": 470,
        "cold_storage_temp": 4.1,
        "photo": "https://images.unsplash.com/photo-1519494080410-f9aa76cb4283?auto=format&fit=crop&w=900&q=80",
        "director": {
            "name": "Dr. Niharika Sinha",
            "title": "Hematology & ICU Director",
            "avatar": "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=300&q=80",
        },
    },
    {
        "id": "h12",
        "name": "CCL Central Hospital (Gandhinagar)",
        "type": "hospital",
        "lat": 23.4002,
        "lng": 85.3175,
        "city": "Gandhinagar, Kanke Road",
        "address": "CCL Colony, Gandhinagar, Kanke Road, Ranchi 834008",
        "phone": "+91 651 223 0418",
        "cold_storage_capacity": 550,
        "cold_storage_temp": 4.0,
        "photo": "https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&w=900&q=80",
        "director": {
            "name": "Dr. Subhashis Chatterjee",
            "title": "Chief Medical Superintendent",
            "avatar": "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=300&q=80",
        },
    },
]

HOSPITAL_MAP = {h["id"]: h for h in HOSPITALS}


def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    r = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng / 2) ** 2
    )
    return round(r * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a)), 1)


def classify_status(units: int, critical_threshold: int = 15) -> str:
    low_ceiling = max(critical_threshold + 18, 35)
    if units < critical_threshold:
        return "critical"
    elif units < low_ceiling:
        return "low"
    return "safe"


def _facility_seed(hospital_id: str) -> int:
    return sum((idx + 1) * ord(c) for idx, c in enumerate(hospital_id))


def gen_inventory(
    hospital_id: str,
    scenario: str = "normal",
    critical_threshold: int = 15,
    expiry_window_hours: int = 48,
):
    seed = _facility_seed(hospital_id)
    rng = random.Random(seed)
    is_hub = HOSPITAL_MAP.get(hospital_id, {}).get("type") == "blood_bank"
    window_mult = 0.55 if expiry_window_hours <= 24 else 1.45 if expiry_window_hours >= 72 else 1.0

    inventory = {}
    for bg in BLOOD_GROUPS:
        if not is_hub and rng.random() < 0.12:
            base = 0
        else:
            base = rng.randint(42, 120) if is_hub else rng.randint(5, 112)
        if base > 0 and scenario == "holiday":
            base = max(2, int(base * 0.55))
        elif base > 0 and scenario == "dengue":
            if bg in ["O+", "O-", "A+"]:
                base = max(2, int(base * 0.3))
            else:
                base = int(base * 1.1)

        status = classify_status(base, critical_threshold)
        raw_expiring = rng.randint(0, min(5, base))
        expiring_soon = min(base, max(0, int(round(raw_expiring * window_mult))))
        inventory[bg] = {
            "units": base,
            "status": status,
            "expiring_48h": expiring_soon,
        }
    return inventory


def get_hospital_status(inventory: dict) -> str:
    critical_count = sum(1 for v in inventory.values() if v["status"] == "critical")
    low_count = sum(1 for v in inventory.values() if v["status"] == "low")
    if critical_count >= 2:
        return "critical"
    elif critical_count >= 1 or low_count >= 3:
        return "low"
    return "safe"


# Live in-memory operational state
_transfer_log = []
_inventory_overrides = {}
_absolute_overrides = {}
_trauma_overrides = {}
_active_dispatches = []
_donor_campaigns = []
_en_route_donors = []
_registered_donors = []


def _seed_initial_dispatches():
    if _active_dispatches:
        return
    h_from = HOSPITAL_MAP["h1"]
    h_to = HOSPITAL_MAP["h6"]
    dist = haversine_km(h_from["lat"], h_from["lng"], h_to["lat"], h_to["lng"])
    now = datetime.now()
    _active_dispatches.append({
        "dispatch_id": "DSP-9041",
        "transfer_id": "seed-h1-h6-O+",
        "vehicle_id": "AMB-JH01-04",
        "courier_name": "Ranchi Cold-Chain Rapid Unit 04",
        "driver": "Rajesh Mahato",
        "blood_group": "O+",
        "units": 12,
        "from_id": h_from["id"],
        "from_hospital": h_from["name"],
        "from_lat": h_from["lat"],
        "from_lng": h_from["lng"],
        "to_id": h_to["id"],
        "to_hospital": h_to["name"],
        "to_lat": h_to["lat"],
        "to_lng": h_to["lng"],
        "distance_km": dist,
        "temp_c": 4.2,
        "eta_seconds": 16 * 60 + 25,
        "total_seconds": 24 * 60,
        "status": "in_transit",
        "priority": "MEDIUM",
        "dispatched_at": (now - timedelta(minutes=8)).isoformat(),
    })


_seed_initial_dispatches()


def build_hospitals(
    scenario: str = "normal",
    critical_threshold: int = 15,
    expiry_window_hours: int = 48,
):
    result = []
    for h in HOSPITALS:
        inv = gen_inventory(h["id"], scenario, critical_threshold, expiry_window_hours)

        if h["id"] in _absolute_overrides:
            for bg, override in _absolute_overrides[h["id"]].items():
                if bg in inv:
                    inv[bg]["units"] = max(0, int(override["units"]))
                    if "expiring_48h" in override and override["expiring_48h"] is not None:
                        inv[bg]["expiring_48h"] = max(0, min(inv[bg]["units"], int(override["expiring_48h"])))
                    else:
                        inv[bg]["expiring_48h"] = min(inv[bg]["expiring_48h"], inv[bg]["units"])
                    inv[bg]["status"] = classify_status(inv[bg]["units"], critical_threshold)

        if h["id"] in _trauma_overrides:
            for bg, override in _trauma_overrides[h["id"]].items():
                if bg in inv:
                    inv[bg]["units"] = max(0, int(override["units"]))
                    inv[bg]["expiring_48h"] = 0
                    inv[bg]["status"] = classify_status(inv[bg]["units"], critical_threshold)

        if h["id"] in _inventory_overrides:
            for bg, delta in _inventory_overrides[h["id"]].items():
                if bg in inv:
                    inv[bg]["units"] = max(0, inv[bg]["units"] + delta)
                    inv[bg]["expiring_48h"] = min(inv[bg]["expiring_48h"], inv[bg]["units"])
                    inv[bg]["status"] = classify_status(inv[bg]["units"], critical_threshold)

        status = get_hospital_status(inv)
        total_used = sum(v["units"] for v in inv.values())
        incoming_donors = [
            d for d in _en_route_donors if d["hospital_id"] == h["id"]
        ]
        result.append({
            **h,
            "status": status,
            "inventory": inv,
            "cold_storage_used": total_used,
            "incoming_donors": incoming_donors,
        })
    return result


class TransferApproveBody(BaseModel):
    from_id: Optional[str] = None
    to_id: Optional[str] = None
    blood_group: Optional[str] = None
    units: Optional[int] = None
    priority: Optional[str] = None


class TransferRequestBody(BaseModel):
    to_id: str
    blood_group: str
    units: int = 10
    from_id: Optional[str] = None
    priority: str = "HIGH"


class TraumaSimBody(BaseModel):
    hospital_id: Optional[str] = None
    blood_group: str = "O-"


class CsvRow(BaseModel):
    hospital: str
    blood_group: str
    units: int
    expiring_48h: Optional[int] = None


class CsvImportBody(BaseModel):
    rows: List[CsvRow]


class DonorAlertBody(BaseModel):
    blood_group: str = "O-"
    radius_km: int = 12
    channels: Optional[List[str]] = None
    hospital_id: Optional[str] = "h2"
    message: Optional[str] = None


class DonorConfirmEnRouteBody(BaseModel):
    donor_id: str
    donor_name: str
    hospital_id: str
    blood_group: str
    units: int = 1
    eta_minutes: int = 14
    distance_km: float = 1.2
    neighborhood: Optional[str] = None


class DonorRegisterBody(BaseModel):
    name: str
    blood_group: str
    neighborhood: str = "Bariatu"
    phone: str = "+91 98350 00000"
    eligible_90_days: bool = True


def _create_dispatch(from_id: str, to_id: str, bg: str, units: int, transfer_id: str, priority: str = "HIGH"):
    from_h = HOSPITAL_MAP.get(from_id)
    to_h = HOSPITAL_MAP.get(to_id)
    if not from_h or not to_h:
        return None

    _inventory_overrides.setdefault(from_id, {})
    _inventory_overrides.setdefault(to_id, {})
    _inventory_overrides[from_id][bg] = _inventory_overrides[from_id].get(bg, 0) - units
    _inventory_overrides[to_id][bg] = _inventory_overrides[to_id].get(bg, 0) + units

    dist = max(1.6, haversine_km(from_h["lat"], from_h["lng"], to_h["lat"], to_h["lng"]))
    eta_mins = max(7, int(round(dist * 2.3 + 4)))
    total_secs = eta_mins * 60
    veh_num = 10 + (len(_active_dispatches) % 85)

    dispatch = {
        "dispatch_id": f"DSP-{9041 + len(_active_dispatches) + 1}",
        "transfer_id": transfer_id,
        "vehicle_id": f"AMB-JH01-{veh_num}",
        "courier_name": f"Ranchi Cold-Chain Unit {veh_num}",
        "driver": ["Vikram Oraon", "Arjun Munda", "Deepak Verma", "Sandeep Tirkey"][len(_active_dispatches) % 4],
        "blood_group": bg,
        "units": units,
        "from_id": from_h["id"],
        "from_hospital": from_h["name"],
        "from_lat": from_h["lat"],
        "from_lng": from_h["lng"],
        "to_id": to_h["id"],
        "to_hospital": to_h["name"],
        "to_lat": to_h["lat"],
        "to_lng": to_h["lng"],
        "distance_km": dist,
        "temp_c": round(4.0 + ((len(_active_dispatches) % 4) * 0.1), 1),
        "eta_seconds": total_secs,
        "total_seconds": total_secs,
        "status": "in_transit",
        "priority": priority,
        "dispatched_at": datetime.now().isoformat(),
    }
    _active_dispatches.insert(0, dispatch)
    _transfer_log.append({
        "id": transfer_id,
        "status": "approved",
        "units": units,
        "blood_group": bg,
        "from_id": from_id,
        "to_id": to_id,
        "timestamp": datetime.now().isoformat(),
    })
    return dispatch


@app.get("/api/kpi")
def get_kpi(
    scenario: str = "normal",
    critical_threshold: int = 15,
    expiry_window_hours: int = 48,
):
    total_units = 0
    critical_alerts = 0
    expiring_soon = 0
    hospitals_data = build_hospitals(scenario, critical_threshold, expiry_window_hours)

    for h in hospitals_data:
        for _, data in h["inventory"].items():
            total_units += data["units"]
            if data["status"] == "critical":
                critical_alerts += 1
            expiring_soon += data["expiring_48h"]

    active_transfers = len([d for d in _active_dispatches if d.get("status") == "in_transit"])

    return {
        "total_units": total_units,
        "critical_alerts": critical_alerts,
        "expiring_soon_units": expiring_soon,
        "active_transfers": active_transfers,
        "dispatched_session": len(_transfer_log),
        "nodes": len(hospitals_data),
        "en_route_donors": len(_en_route_donors),
    }


@app.get("/api/hospitals")
def get_hospitals(
    scenario: str = "normal",
    critical_threshold: int = 15,
    expiry_window_hours: int = 48,
):
    return build_hospitals(scenario, critical_threshold, expiry_window_hours)


@app.get("/api/forecast")
def get_forecast(
    blood_group: str = "O-",
    scenario: str = "normal",
    component: str = "packed_rbc",
    surgical_load_pct: int = 0,
    seasonal_spike_pct: int = 0,
):
    today = datetime.now()
    days = []
    current = []
    predicted_demand = []
    confidence_low = []
    confidence_high = []
    shortage_day = None

    hospitals_data = build_hospitals(scenario)
    total_inv = sum(h["inventory"].get(blood_group, {}).get("units", 0) for h in hospitals_data)

    component_profiles = {
        "packed_rbc": {
            "label": "Packed Red Blood Cells (PRBC)",
            "inv_factor": 1.0,
            "demand_factor": 1.0,
            "shelf_life": "42 days (2–6°C)",
            "dengue_boost": 1.0,
            "daily_expiry_loss": 0.015,
        },
        "platelets": {
            "label": "Platelets (SDP / RDP)",
            "inv_factor": 0.42,
            "demand_factor": 0.72,
            "shelf_life": "5 days (20–24°C agitated)",
            "dengue_boost": 1.65,
            "daily_expiry_loss": 0.14,
        },
        "plasma": {
            "label": "Fresh Frozen Plasma (FFP)",
            "inv_factor": 0.78,
            "demand_factor": 0.65,
            "shelf_life": "12 months (-30°C)",
            "dengue_boost": 1.15,
            "daily_expiry_loss": 0.005,
        },
    }
    comp = component_profiles.get(component, component_profiles["packed_rbc"])

    daily_usage = {
        "O-": 18, "O+": 22, "A-": 10, "A+": 20,
        "B-": 8, "B+": 18, "AB-": 4, "AB+": 12,
    }
    base_usage = daily_usage.get(blood_group, 15) * comp["demand_factor"]

    scenario_data = {
        "normal": {"usage_mult": 1.0, "replenish_rate": 0.7},
        "holiday": {"usage_mult": 0.7, "replenish_rate": 0.4},
        "dengue": {
            "usage_mult": (1.8 if blood_group in ["O+", "O-", "A+"] else 1.0) * comp["dengue_boost"],
            "replenish_rate": 0.5,
        },
    }
    s = scenario_data.get(scenario, scenario_data["normal"])

    surgical_mult = max(0.5, 1.0 + (surgical_load_pct / 100.0))
    seasonal_mult = max(0.8, 1.0 + (seasonal_spike_pct / 100.0))
    effective_usage_mult = s["usage_mult"] * surgical_mult * seasonal_mult

    running_inv = float(total_inv) * comp["inv_factor"]
    rng = random.Random(hash((blood_group, scenario, component, surgical_load_pct, seasonal_spike_pct)) & 0xFFFFFFFF)

    for i in range(14):
        day = today + timedelta(days=i)
        days.append(day.strftime("%b %d"))

        usage = base_usage * effective_usage_mult
        if day.weekday() in [5, 6]:
            replenish = base_usage * s["replenish_rate"] * 0.5
        else:
            replenish = base_usage * s["replenish_rate"]

        expiry_wastage = running_inv * comp["daily_expiry_loss"]
        noise = rng.uniform(-1.5, 1.5)
        running_inv = max(0, running_inv - usage - expiry_wastage + replenish + noise)

        demand_val = round(usage * (1 + 0.03 * i))
        inv_val = round(running_inv)
        spread = max(3, round(inv_val * (0.04 + 0.012 * i)))

        current.append(inv_val)
        predicted_demand.append(demand_val)
        confidence_low.append(max(0, inv_val - spread))
        confidence_high.append(inv_val + spread)

        if running_inv < 20 and shortage_day is None:
            shortage_day = i

    avg_daily_demand = max(1, round(sum(predicted_demand) / len(predicted_demand)))
    starting_units = round(float(total_inv) * comp["inv_factor"])
    days_of_supply = round(starting_units / avg_daily_demand, 1)

    return {
        "days": days,
        "current_inventory": current,
        "predicted_demand": predicted_demand,
        "confidence_low": confidence_low,
        "confidence_high": confidence_high,
        "shortage_day_index": shortage_day,
        "shortage_day_label": days[shortage_day] if shortage_day is not None else None,
        "blood_group": blood_group,
        "scenario": scenario,
        "component": component,
        "component_label": comp["label"],
        "shelf_life": comp["shelf_life"],
        "starting_units": starting_units,
        "avg_daily_demand": avg_daily_demand,
        "days_of_supply": days_of_supply,
        "surgical_load_pct": surgical_load_pct,
        "seasonal_spike_pct": seasonal_spike_pct,
    }


@app.get("/api/transfers")
def get_transfers(scenario: str = "normal", critical_threshold: int = 15):
    recommendations = []
    hospitals_data = build_hospitals(scenario, critical_threshold)

    for h in hospitals_data:
        for bg, inv_data in h["inventory"].items():
            if inv_data["status"] == "critical":
                best_donor = None
                best_score = -1
                for dh in hospitals_data:
                    if dh["id"] == h["id"]:
                        continue
                    donor_inv = dh["inventory"].get(bg, {})
                    units_avail = donor_inv.get("units", 0)
                    if donor_inv.get("status") == "safe" and units_avail > best_score:
                        best_score = units_avail
                        best_donor = dh

                if best_donor:
                    transfer_units = min(15, max(5, best_score // 4))
                    expiring = best_donor["inventory"][bg]["expiring_48h"]
                    priority = "HIGH" if inv_data["units"] < max(8, critical_threshold // 2) else "MEDIUM"
                    dist = haversine_km(best_donor["lat"], best_donor["lng"], h["lat"], h["lng"])

                    recommendations.append({
                        "id": f"{best_donor['id']}-{h['id']}-{bg}",
                        "blood_group": bg,
                        "from_hospital": best_donor["name"],
                        "from_id": best_donor["id"],
                        "from_lat": best_donor["lat"],
                        "from_lng": best_donor["lng"],
                        "to_hospital": h["name"],
                        "to_id": h["id"],
                        "to_lat": h["lat"],
                        "to_lng": h["lng"],
                        "distance_km": dist,
                        "eta_minutes": max(7, int(round(dist * 2.3 + 4))),
                        "units": transfer_units,
                        "expiring_units": expiring,
                        "priority": priority,
                        "reason": f"{inv_data['units']} units remaining — critically low"
                        + (f", {expiring} expiring in <48h" if expiring > 0 else ""),
                        "status": "pending",
                    })

    recommendations.sort(key=lambda x: (0 if x["priority"] == "HIGH" else 1, -x["expiring_units"]))
    return recommendations[:10]


@app.post("/api/transfers/{transfer_id}/approve")
def approve_transfer(transfer_id: str, body: Optional[TransferApproveBody] = Body(default=None)):
    parsed = body if isinstance(body, TransferApproveBody) else None
    from_id = parsed.from_id if parsed and parsed.from_id else None
    to_id = parsed.to_id if parsed and parsed.to_id else None
    bg = parsed.blood_group if parsed and parsed.blood_group else None
    units = parsed.units if parsed and parsed.units else 10
    priority = parsed.priority if parsed and parsed.priority else "HIGH"

    if not (from_id and to_id and bg):
        parts = transfer_id.split("-", 2)
        if len(parts) == 3:
            from_id = from_id or parts[0]
            to_id = to_id or parts[1]
            bg = bg or parts[2]

    dispatch = None
    if from_id and to_id and bg:
        dispatch = _create_dispatch(from_id, to_id, bg, units, transfer_id, priority)
    else:
        _transfer_log.append({
            "id": transfer_id,
            "status": "approved",
            "timestamp": datetime.now().isoformat(),
        })

    return {
        "success": True,
        "message": "Transfer approved and cold-chain courier dispatched!",
        "transfer_id": transfer_id,
        "dispatch": dispatch,
    }


@app.post("/api/transfers/request")
def request_transfer(
    body: TransferRequestBody,
    scenario: str = "normal",
    critical_threshold: int = 15,
):
    hospitals_data = build_hospitals(scenario, critical_threshold)
    h_by_id = {h["id"]: h for h in hospitals_data}
    target = h_by_id.get(body.to_id)
    if not target:
        return {"success": False, "error": "Target hospital not found"}

    donor = None
    if body.from_id and body.from_id != body.to_id and body.from_id in h_by_id:
        donor = h_by_id[body.from_id]
    else:
        candidates = [
            dh for dh in hospitals_data
            if dh["id"] != body.to_id and dh["inventory"].get(body.blood_group, {}).get("units", 0) >= body.units
        ]
        if not candidates:
            candidates = [dh for dh in hospitals_data if dh["id"] != body.to_id]
        candidates.sort(
            key=lambda dh: (
                0 if dh["type"] == "blood_bank" else 1,
                -dh["inventory"].get(body.blood_group, {}).get("units", 0),
            )
        )
        donor = candidates[0]

    transfer_id = f"req-{donor['id']}-{target['id']}-{body.blood_group}-{len(_active_dispatches)+1}"
    dispatch = _create_dispatch(donor["id"], target["id"], body.blood_group, body.units, transfer_id, body.priority)
    return {
        "success": True,
        "message": f"Dispatched {body.units}u {body.blood_group} from {donor['name']} to {target['name']}",
        "dispatch": dispatch,
    }


@app.post("/api/simulate-trauma")
def simulate_trauma(
    body: Optional[TraumaSimBody] = Body(default=None),
    scenario: str = "normal",
    critical_threshold: int = 15,
):
    parsed = body if isinstance(body, TraumaSimBody) else None
    target_bg = parsed.blood_group if parsed else "O-"
    hospitals_data = build_hospitals(scenario, critical_threshold)

    target = None
    if parsed and parsed.hospital_id:
        target = next((h for h in hospitals_data if h["id"] == parsed.hospital_id), None)
    if not target:
        target = next(
            (h for h in hospitals_data if h["id"] == "h2" and h["inventory"][target_bg]["units"] > 2),
            None,
        ) or next(
            (h for h in hospitals_data if h["type"] == "hospital" and h["inventory"][target_bg]["units"] > 2),
            hospitals_data[1],
        )

    previous_units = target["inventory"][target_bg]["units"]
    _trauma_overrides.setdefault(target["id"], {})
    _trauma_overrides[target["id"]][target_bg] = {"units": 2}
    if target["id"] in _inventory_overrides and target_bg in _inventory_overrides[target["id"]]:
        _inventory_overrides[target["id"]][target_bg] = 0

    updated_hospitals = build_hospitals(scenario, critical_threshold)
    updated_target = next(h for h in updated_hospitals if h["id"] == target["id"])

    reroute_options = []
    for dh in updated_hospitals:
        if dh["id"] == target["id"]:
            continue
        avail = dh["inventory"][target_bg]["units"]
        if avail >= 12:
            dist = haversine_km(dh["lat"], dh["lng"], target["lat"], target["lng"])
            eta = max(6, int(round(dist * 2.1 + 3)))
            suggested_units = min(16, max(8, avail // 3))
            score = round((avail * 1.4) - (dist * 3.5) + (15 if dh["type"] == "blood_bank" else 0), 1)
            reroute_options.append({
                "from_id": dh["id"],
                "from_hospital": dh["name"],
                "from_type": dh["type"],
                "available_units": avail,
                "suggested_units": suggested_units,
                "expiring_48h": dh["inventory"][target_bg]["expiring_48h"],
                "distance_km": dist,
                "eta_minutes": eta,
                "ai_confidence": min(99, max(82, int(86 + score / 10))),
                "score": score,
            })

    reroute_options.sort(key=lambda x: -x["score"])
    return {
        "success": True,
        "incident_id": f"TRM-{datetime.now().strftime('%H%M%S')}",
        "blood_group": target_bg,
        "previous_units": previous_units,
        "current_units": 2,
        "hospital": updated_target,
        "reroute_options": reroute_options[:4],
    }


@app.post("/api/resolve-emergency")
def resolve_emergency():
    _trauma_overrides.clear()
    return {
        "success": True,
        "message": "Trauma emergency cleared and hospital emergency reserve stabilized.",
    }


@app.post("/api/inventory/csv")
def import_csv_inventory(body: CsvImportBody, scenario: str = "normal"):
    updated_count = 0
    matched_facilities = set()
    name_lookup = {h["name"].lower(): h["id"] for h in HOSPITALS}
    id_lookup = {h["id"].lower(): h["id"] for h in HOSPITALS}

    for row in body.rows:
        key = row.hospital.strip().lower()
        hid = id_lookup.get(key) or name_lookup.get(key)
        if not hid:
            hid = next((h["id"] for h in HOSPITALS if key in h["name"].lower()), None)
        bg = row.blood_group.strip().upper()
        if hid and bg in BLOOD_GROUPS:
            _absolute_overrides.setdefault(hid, {})
            _absolute_overrides[hid][bg] = {
                "units": max(0, row.units),
                "expiring_48h": row.expiring_48h,
            }
            if hid in _inventory_overrides and bg in _inventory_overrides[hid]:
                _inventory_overrides[hid][bg] = 0
            updated_count += 1
            matched_facilities.add(HOSPITAL_MAP[hid]["name"])

    return {
        "success": True,
        "updated_records": updated_count,
        "facilities_updated": sorted(matched_facilities),
        "hospitals": build_hospitals(scenario),
    }


@app.post("/api/demo/reset")
def reset_demo():
    _inventory_overrides.clear()
    _absolute_overrides.clear()
    _trauma_overrides.clear()
    _transfer_log.clear()
    _active_dispatches.clear()
    _en_route_donors.clear()
    _registered_donors.clear()
    _seed_initial_dispatches()
    return {"success": True, "message": "Regional simulation state restored to baseline"}


@app.get("/api/cold-chain")
def get_cold_chain(
    scenario: str = "normal",
    critical_threshold: int = 15,
    expiry_window_hours: int = 48,
):
    hospitals_data = build_hospitals(scenario, critical_threshold, expiry_window_hours)
    batches = []
    components = ["Packed Red Cells", "Platelets (SDP)", "Fresh Frozen Plasma"]
    now = datetime.now()

    for h_idx, h in enumerate(hospitals_data):
        rng = random.Random(_facility_seed(h["id"]) + 99)
        for bg_idx, (bg, inv) in enumerate(h["inventory"].items()):
            exp_units = inv["expiring_48h"]
            if exp_units > 0:
                max_span = max(24, expiry_window_hours - 8)
                hours_left = 6 + ((h_idx * 5 + bg_idx * 7) % max_span)
                bucket = "<24h" if hours_left < 24 else "<48h" if hours_left < 48 else "<7d"
                comp = "Platelets (SDP)" if hours_left < 20 and bg_idx % 2 == 0 else components[(h_idx + bg_idx) % 2]
                batches.append({
                    "batch_id": f"HS-JH-{bg.replace('+', 'P').replace('-', 'N')}-{810 + h_idx * 13 + bg_idx}",
                    "hospital_id": h["id"],
                    "hospital_name": h["name"],
                    "city": h["city"],
                    "blood_group": bg,
                    "component": comp,
                    "units": exp_units,
                    "hours_remaining": hours_left,
                    "bucket": bucket,
                    "temp_c": h["cold_storage_temp"],
                    "collected_at": (now - timedelta(days=39 if comp == "Packed Red Cells" else 4)).strftime("%b %d, %H:%M"),
                    "expires_at": (now + timedelta(hours=hours_left)).strftime("%b %d, %H:%M"),
                })

            if inv["units"] >= 18 and (h_idx + bg_idx) % 3 == 0:
                hours_7d = 54 + ((h_idx * 17 + bg_idx * 11) % 108)
                batches.append({
                    "batch_id": f"HS-JH-{bg.replace('+', 'P').replace('-', 'N')}-{410 + h_idx * 19 + bg_idx}",
                    "hospital_id": h["id"],
                    "hospital_name": h["name"],
                    "city": h["city"],
                    "blood_group": bg,
                    "component": components[(h_idx + bg_idx) % 3],
                    "units": rng.randint(4, min(14, inv["units"])),
                    "hours_remaining": hours_7d,
                    "bucket": "<7d",
                    "temp_c": h["cold_storage_temp"],
                    "collected_at": (now - timedelta(days=35)).strftime("%b %d, %H:%M"),
                    "expires_at": (now + timedelta(hours=hours_7d)).strftime("%b %d, %H:%M"),
                })

    batches.sort(key=lambda b: b["hours_remaining"])
    return {
        "batches": batches,
        "dispatches": _active_dispatches,
        "summary": {
            "under_24h": sum(b["units"] for b in batches if b["bucket"] == "<24h"),
            "under_48h": sum(b["units"] for b in batches if b["bucket"] == "<48h"),
            "under_7d": sum(b["units"] for b in batches if b["bucket"] == "<7d"),
            "active_couriers": len(_active_dispatches),
            "avg_temp_c": 4.2,
        },
    }


def _build_donor_pool():
    first_names = [
        "Aarav", "Ishita", "Kabir", "Neha", "Vivaan", "Riya", "Aditya", "Pooja",
        "Rohan", "Ananya", "Karan", "Sneha", "Devansh", "Tanya", "Nikhil", "Shreya",
        "Manish", "Divya", "Harsh", "Kriti", "Pranav", "Megha", "Siddharth", "Nandini",
        "Ayush", "Sakshi", "Ankit", "Priyanka", "Gaurav", "Swati", "Vikash", "Simran",
        "Abhishek", "Nidhi", "Deepak", "Sonal",
    ]
    last_names = [
        "Sharma", "Oraon", "Munda", "Tirkey", "Gupta", "Mehta", "Joshi", "Mahato",
        "Sinha", "Chauhan", "Soren", "Agarwal", "Kulkarni", "Verma", "Prasad", "Rao",
        "Kachhap", "Toppo", "Kujur", "Singh",
    ]
    zones = [
        ("Bariatu", 23.3895, 85.3492),
        ("Purulia Road", 23.3680, 85.3302),
        ("Booty Road", 23.3798, 85.3568),
        ("Lalpur", 23.3715, 85.3365),
        ("Main Road", 23.3552, 85.3245),
        ("Ratu Road", 23.3768, 85.2925),
        ("Morabadi", 23.3782, 85.3208),
        ("Dhurwa", 23.3114, 85.2812),
        ("Station Road", 23.3524, 85.3349),
        ("Gandhinagar", 23.3996, 85.3182),
        ("Kanke Road", 23.3940, 85.3160),
        ("Harmu Housing", 23.3560, 85.3020),
    ]
    rng = random.Random(202611)
    donors = []
    en_route_ids = {d["donor_id"]: d for d in _en_route_donors}
    for i in range(36):
        z_name, z_lat, z_lng = zones[i % len(zones)]
        lat = round(z_lat + rng.uniform(-0.008, 0.008), 4)
        lng = round(z_lng + rng.uniform(-0.009, 0.009), 4)
        bg = BLOOD_GROUPS[i % len(BLOOD_GROUPS)]
        if i in (0, 3, 8, 12, 16, 20, 26, 31):
            bg = "O-"
        days_ago = rng.randint(92, 240) if i % 5 != 0 else rng.randint(25, 70)
        eligible = days_ago >= 90
        dist = haversine_km(23.3630, 85.3240, lat, lng)
        donor_id = f"DNR-{4010 + i}"
        donors.append({
            "id": donor_id,
            "name": f"{first_names[i]} {last_names[i % len(last_names)]}",
            "blood_group": bg,
            "neighborhood": z_name,
            "lat": lat,
            "lng": lng,
            "distance_km": dist,
            "last_donated_days": days_ago,
            "eligible": eligible,
            "verified": True,
            "donations_count": rng.randint(2, 18),
            "channels": ["WhatsApp", "SMS", "App Push"] if i % 3 != 0 else ["SMS", "WhatsApp"],
            "phone_masked": f"+91 9835{i % 10} **{120 + i}",
            "response_score": rng.randint(82, 99),
            "en_route": en_route_ids.get(donor_id),
        })
    return donors


@app.get("/api/donors")
def get_donors():
    return {
        "donors": _registered_donors + _build_donor_pool(),
        "campaigns": _donor_campaigns,
        "en_route_donors": _en_route_donors,
    }


@app.post("/api/donors/register")
def register_donor(body: DonorRegisterBody):
    zone_coords = {
        "Bariatu": (23.3895, 85.3492),
        "Purulia Road": (23.3680, 85.3302),
        "Lalpur": (23.3715, 85.3365),
        "Main Road": (23.3552, 85.3245),
        "Ratu Road": (23.3768, 85.2925),
        "Morabadi": (23.3782, 85.3208),
        "Dhurwa": (23.3114, 85.2812),
        "Station Road": (23.3524, 85.3349),
        "Gandhinagar": (23.3996, 85.3182),
        "Kanke": (23.3960, 85.3168),
        "Kanke Road": (23.3940, 85.3160),
    }
    neighborhood = body.neighborhood.strip()
    lat, lng = zone_coords.get(neighborhood, (23.3630, 85.3240))
    dist = max(0.5, haversine_km(23.3630, 85.3240, lat, lng))
    clean_phone = body.phone.strip()
    masked = (
        f"{clean_phone[:7]} ***{clean_phone[-3:]}"
        if len(clean_phone) >= 10
        else "+91 9835* ***01"
    )
    donor = {
        "id": f"VOL-{5001 + len(_registered_donors)}",
        "name": body.name.strip(),
        "blood_group": body.blood_group.strip().upper(),
        "neighborhood": neighborhood,
        "lat": lat,
        "lng": lng,
        "distance_km": dist,
        "last_donated_days": 120 if body.eligible_90_days else 42,
        "eligible": bool(body.eligible_90_days),
        "verified": True,
        "newly_registered": True,
        "donations_count": 1,
        "channels": ["Direct Call", "SMS", "WhatsApp"],
        "phone_masked": masked,
        "response_score": 98,
        "en_route": None,
    }
    _registered_donors.insert(0, donor)
    return {
        "success": True,
        "message": f"Thank you {donor['name']}! Registered as a voluntary {donor['blood_group']} donor in {donor['neighborhood']}.",
        "donor": donor,
    }


@app.get("/api/donors/nearby")
def get_nearby_donors(
    hospital_id: str = "h2",
    blood_group: str = "O-",
    max_km: float = 3.0,
    limit: int = 5,
):
    hospital = HOSPITAL_MAP.get(hospital_id, HOSPITAL_MAP["h2"])
    zone_short = hospital["city"].split(",")[0].strip()
    en_route_map = {
        (d["donor_id"], d["hospital_id"], d["blood_group"]): d for d in _en_route_donors
    }

    # Include newly registered matching eligible donors first when near the hospital (or same Ranchi zone)
    registered_matches = []
    for d in _registered_donors:
        if d["eligible"] and d["blood_group"] == blood_group:
            dist = max(0.4, haversine_km(hospital["lat"], hospital["lng"], d["lat"], d["lng"]))
            same_zone = d["neighborhood"].lower() in hospital["city"].lower() or d["neighborhood"].lower() in hospital["name"].lower()
            if dist <= max(max_km, 3.5) or same_zone:
                key = (d["id"], hospital["id"], blood_group)
                registered_matches.append({
                    **d,
                    "distance_km": dist,
                    "eta_minutes": max(4, int(round(dist * 3.5 + 4))),
                    "en_route": en_route_map.get(key),
                })

    # Combine matching pool donors within max_km + deterministic hyper-local verified rapid-response donors (<3km)
    pool = _build_donor_pool()
    local_matches = []
    for d in pool:
        if d["eligible"] and d["blood_group"] == blood_group:
            dist = haversine_km(hospital["lat"], hospital["lng"], d["lat"], d["lng"])
            if dist <= max_km:
                key = (d["id"], hospital["id"], blood_group)
                local_matches.append({
                    **d,
                    "distance_km": max(0.4, dist),
                    "eta_minutes": max(5, int(round(dist * 3.5 + 4))),
                    "en_route": en_route_map.get(key) or d.get("en_route"),
                })

    # Ensure 5 verified local Ranchi donors < 3km are always available for emergency voice dispatch
    seed_base = _facility_seed(hospital["id"]) + sum(ord(c) for c in blood_group)
    rng = random.Random(seed_base)
    local_first = [
        "Saurabh", "Anjali", "Rajiv", "Shweta", "Prashant",
        "Meenakshi", "Tarun", "Komal", "Abhinav", "Nupur",
    ]
    local_last = ["Kachhap", "Tiwari", "Munda", "Chatterjee", "Soren", "Mishra", "Sinha", "Tirkey"]
    subzones = [zone_short, "Bariatu", "Lalpur", "Morabadi", "Main Road", "Kanke Road"]

    idx_offset = 0
    while len(registered_matches) + len(local_matches) < limit:
        f_name = local_first[(seed_base + idx_offset) % len(local_first)]
        l_name = local_last[(seed_base + idx_offset * 3) % len(local_last)]
        donor_id = f"LOC-{hospital['id'].upper()}-{blood_group.replace('+', 'P').replace('-', 'N')}-{idx_offset + 1}"
        dist = round(rng.uniform(0.6, min(2.8, max_km - 0.1)), 1)
        days_ago = rng.randint(96, 215)
        area = zone_short if idx_offset < 3 else subzones[(seed_base + idx_offset) % len(subzones)]
        key = (donor_id, hospital["id"], blood_group)
        local_matches.append({
            "id": donor_id,
            "name": f"{f_name} {l_name}",
            "blood_group": blood_group,
            "neighborhood": area,
            "lat": round(hospital["lat"] + rng.uniform(-0.012, 0.012), 4),
            "lng": round(hospital["lng"] + rng.uniform(-0.012, 0.012), 4),
            "distance_km": dist,
            "eta_minutes": max(5, int(round(dist * 4 + 4))),
            "last_donated_days": days_ago,
            "eligible": True,
            "verified": True,
            "donations_count": rng.randint(4, 15),
            "channels": ["Direct Call", "WhatsApp", "SMS"],
            "phone_masked": f"+91 9431{rng.randint(0,9)} **{rng.randint(100,999)}",
            "response_score": rng.randint(89, 99),
            "en_route": en_route_map.get(key),
        })
        idx_offset += 1

    local_matches.sort(key=lambda x: x["distance_km"])
    combined = registered_matches + local_matches
    return {
        "hospital_id": hospital["id"],
        "hospital_name": hospital["name"],
        "blood_group": blood_group,
        "max_km": max_km,
        "donors": combined[:limit],
    }


@app.post("/api/donors/confirm-en-route")
def confirm_donor_en_route(body: DonorConfirmEnRouteBody):
    hospital = HOSPITAL_MAP.get(body.hospital_id)
    if not hospital:
        return {"success": False, "error": "Hospital not found"}

    _inventory_overrides.setdefault(body.hospital_id, {})
    _inventory_overrides[body.hospital_id][body.blood_group] = (
        _inventory_overrides[body.hospital_id].get(body.blood_group, 0) + max(1, body.units)
    )

    record = {
        "dispatch_id": f"DNR-CALL-{len(_en_route_donors) + 101}",
        "donor_id": body.donor_id,
        "donor_name": body.donor_name,
        "hospital_id": body.hospital_id,
        "hospital_name": hospital["name"],
        "blood_group": body.blood_group,
        "units": max(1, body.units),
        "eta_minutes": body.eta_minutes,
        "distance_km": body.distance_km,
        "neighborhood": body.neighborhood or hospital["city"].split(",")[0].strip(),
        "confirmed_at": datetime.now().strftime("%H:%M:%S"),
        "status": "en_route",
    }
    _en_route_donors.insert(0, record)

    return {
        "success": True,
        "message": f"Donor {body.donor_name} ({body.blood_group}) confirmed en route to {hospital['name']} (+{body.units}u logged)",
        "record": record,
    }


@app.post("/api/donor-alert")
def trigger_donor_alert(
    blood_group: str = "O-",
    body: Optional[DonorAlertBody] = Body(default=None),
):
    parsed = body if isinstance(body, DonorAlertBody) else None
    bg = parsed.blood_group if parsed and parsed.blood_group else blood_group
    radius_km = parsed.radius_km if parsed else 12
    channels = parsed.channels if parsed and parsed.channels else ["SMS", "App Push", "WhatsApp"]
    hospital_id = parsed.hospital_id if parsed and parsed.hospital_id else "h2"
    hospital = HOSPITAL_MAP.get(hospital_id, HOSPITAL_MAP["h1"])

    rng = random.Random()
    donors_notified = rng.randint(58, 174)
    delivered = max(1, int(donors_notified * rng.uniform(0.93, 0.98)))
    opened = max(1, int(delivered * rng.uniform(0.68, 0.84)))
    confirmed = max(2, int(opened * rng.uniform(0.18, 0.31)))

    campaign = {
        "campaign_id": f"CMP-{datetime.now().strftime('%H%M%S')}",
        "blood_group": bg,
        "hospital_name": hospital["name"],
        "radius_km": radius_km,
        "channels": channels,
        "donors_notified": donors_notified,
        "delivered": delivered,
        "opened": opened,
        "confirmed_appointments": confirmed,
        "delivery_rate_pct": round((delivered / donors_notified) * 100, 1),
        "read_rate_pct": round((opened / delivered) * 100, 1),
        "estimated_response_time": "1.5–3 hours",
        "sent_at": datetime.now().strftime("%H:%M:%S"),
    }
    _donor_campaigns.insert(0, campaign)

    return {
        "success": True,
        "blood_group": bg,
        "donors_notified": donors_notified,
        "message": f"Emergency alert sent to {donors_notified} nearby Ranchi donors for {bg} blood type!",
        "channels": channels,
        "estimated_response_time": campaign["estimated_response_time"],
        "campaign": campaign,
    }


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "service": "HemoSync AI",
        "region": "Ranchi, Jharkhand",
        "version": "2.5.0",
        "nodes": len(HOSPITALS),
        "timestamp": datetime.now().isoformat(),
    }
