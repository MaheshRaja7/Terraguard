from typing import Dict, Any, List

def generate_multi_tier_alert_messages(
    zone_id: str = "TG-018",
    zone_name: str = "Gangtok - Singtam Corridor (NH-10)",
    district: str = "East Sikkim",
    state: str = "Sikkim",
    risk_score: float = 87.0,
    severity: str = "CRITICAL",
    rain_24h: float = 120.0,
    soil_moisture: float = 0.48,
    road_name: str = "NH-10 Lifeline Highway"
) -> Dict[str, Any]:
    """
    Generates standardized Common Alerting Protocol (CAP) and NDMA-compliant alert
    messages specifically structured for three key disaster management tiers:
    1. District Administrations (DM / DC / SDM / DDMA)
    2. Disaster Management Authorities (NDMA / SDMA / NDRF / BRO)
    3. Local Communities & Citizens (Bilingual public safety warning)
    """

    # 1. District Administration Directive
    admin_msg = (
        f"[TERRAGUARD-CAP / DISTRICT ADMIN DIRECTIVE]\n"
        f"PRIORITY: URGENT | SEVERITY: {severity} (Hazard Index: {int(risk_score)}/100)\n"
        f"TARGET: District Magistrate / DEOC Controller, {district}, {state}\n"
        f"LOCATION: Zone {zone_id} ({zone_name})\n"
        f"METEOROLOGY: 24h Rainfall: {rain_24h:.1f}mm | Soil Moisture: {soil_moisture:.2f} m³/m³ (Threshold Exceeded)\n"
        f"MANDATORY DIRECTIVES:\n"
        f"1. Convene District Emergency Operations Centre (DEOC) Level-2 Incident Command.\n"
        f"2. Issue preventive evacuation orders for vulnerable hillside habitations.\n"
        f"3. Pre-position earth-moving excavators/JCBs at strategic chokepoints along {road_name}.\n"
        f"4. Exercise emergency powers under Sec 30/34 of Disaster Management Act 2005."
    )

    # 2. Tactical Disaster Management Authorities Alert
    tactical_msg = (
        f"[TERRAGUARD-CAP / TACTICAL DM AUTHORITY ALERT]\n"
        f"AGENCY: NDMA / SDMA / NDRF / BRO QUICK RESPONSE TEAMS\n"
        f"SECTOR: Zone {zone_id} ({district}) | HAZARD: Debris Flow & Slope Shear\n"
        f"RISK: {int(risk_score)}/100 ({severity}) | RAIN ACCUM: {rain_24h:.1f}mm/24h\n"
        f"TACTICAL ACTION PLAN:\n"
        f"1. Place NDRF/SDRF Search & Rescue companies on immediate 15-minute rollout standby.\n"
        f"2. BRO Project Swastik QRT mobilize bulldozers and rock-breakers along {road_name}.\n"
        f"3. Initiate tactical drone reconnaissance along tension fissures.\n"
        f"4. Switch tactical communications to VHF Emergency Net Channel-4 / Satellite trunking."
    )

    # 3. Local Community & Citizen Public Warning (Bilingual: English + Hindi)
    community_msg = (
        f"[TERRAGUARD PUBLIC SAFETY WARNING / आपदा चेतावनी]\n"
        f"⚠️ URGENT LANDSLIDE WARNING for {district} ({zone_id})!\n"
        f"RISK LEVEL: {severity} ({int(risk_score)}/100) due to heavy rainfall ({rain_24h:.0f}mm).\n"
        f"SAFETY INSTRUCTIONS FOR RESIDENTS:\n"
        f"1. Move immediately away from steep slope edges and swelling streams to relief shelters.\n"
        f"2. AVOID traveling on hill roads or {road_name} — active rockfall and mudflow reported.\n"
        f"3. Keep emergency grab-bag ready (torch, dry food, water, ID, first-aid, power bank).\n"
        f"4. HELPLINES: Call 1077 (District Disaster Control) or 112 (Police) for rescue assistance.\n"
        f"सावधान: भारी बारिश के कारण भूस्खलन का गंभीर खतरा है। कृपया तुरंत सुरक्षित स्थानों पर शरण लें।"
    )

    return {
        "zone_info": {
            "zone_id": zone_id,
            "zone_name": zone_name,
            "district": district,
            "state": state,
            "risk_score": risk_score,
            "severity": severity,
            "rain_24h": rain_24h,
            "soil_moisture": soil_moisture,
            "road_name": road_name
        },
        "tiers": {
            "DISTRICT_ADMIN": {
                "id": "DISTRICT_ADMIN",
                "label": "District Administration",
                "subtext": "DM / DC / SDM / DDMA Emergency Operations",
                "badgeColor": "indigo",
                "recipients": [
                    {"name": "District Magistrate & DEOC Controller (East Sikkim)", "phone": "+919876543210", "role": "DM / Collector"},
                    {"name": "Sub-Divisional Magistrate (SDM Gangtok)", "phone": "+919436000001", "role": "SDM / Incident Commander"}
                ],
                "channels": ["SMS_GATEWAY", "APP_BROADCAST", "CAP_INDIA_XML"],
                "protocol": "CAP-IN v1.2 (Section 34 DMA)",
                "message": admin_msg
            },
            "DISASTER_AUTHORITIES": {
                "id": "DISASTER_AUTHORITIES",
                "label": "Disaster Management Authorities",
                "subtext": "NDMA / SDMA / NDRF / BRO Quick Response",
                "badgeColor": "purple",
                "recipients": [
                    {"name": "NDRF 2nd Battalion Regional HQ", "phone": "+919436123456", "role": "NDRF Commander"},
                    {"name": "BRO Project Swastik Task Force", "phone": "+919436998877", "role": "BRO Road Corridor Head"}
                ],
                "channels": ["SMS_GATEWAY", "APP_BROADCAST", "VHF_EMERGENCY_NET"],
                "protocol": "NDMA-SOP Tactical Rollout",
                "message": tactical_msg
            },
            "COMMUNITY": {
                "id": "COMMUNITY",
                "label": "Local Communities & Citizens",
                "subtext": "Village Panchayats / Wardens / Public Alert",
                "badgeColor": "amber",
                "recipients": [
                    {"name": "Tathangchen Village Disaster Committee", "phone": "+919811223344", "role": "Village Head (Gram Pradhan)"},
                    {"name": "29th Mile Ward Council & Community Radio", "phone": "+919822334455", "role": "Community Warden"}
                ],
                "channels": ["SMS_BROADCAST", "CITIZEN_APP_ALERT", "PUBLIC_SIREN"],
                "protocol": "Public Multilingual Broadcast (ENG/HIN)",
                "message": community_msg
            }
        }
    }
