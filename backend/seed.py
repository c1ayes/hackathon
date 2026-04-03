"""
Run from the backend/ directory:
    python seed.py
"""
from datetime import datetime
from repositories.database import engine, Base, SessionLocal
from models.models import (
    DistrictModel,
    ReportModel,
    DistrictSnapshotModel,
    AIInsightModel,
    ActionModel,
    SimulationResultModel,
)

Base.metadata.create_all(engine)

db = SessionLocal()

# ── Clear existing data (order matters for FK constraints) ──────────────────
for model in [SimulationResultModel, ActionModel, AIInsightModel,
              DistrictSnapshotModel, ReportModel, DistrictModel]:
    db.query(model).delete()
db.commit()

# ── Districts ───────────────────────────────────────────────────────────────
districts_data = [
    # 2 critical
    dict(name="Алмалы",    slug="almaly",    status="critical", risk_score=0.87, mood_index=42.0, pollution_index=0.71, traffic_index=0.88, complaints_count=312, x=43.25, y=76.92),
    dict(name="Ауэзов",    slug="auezov",    status="critical", risk_score=0.82, mood_index=39.0, pollution_index=0.76, traffic_index=0.79, complaints_count=278, x=43.29, y=76.85),
    # 4 warning
    dict(name="Наурызбай", slug="nauryzbay", status="warning",  risk_score=0.67, mood_index=51.0, pollution_index=0.58, traffic_index=0.72, complaints_count=198, x=43.18, y=76.78),
    dict(name="Медеу",     slug="medeu",     status="warning",  risk_score=0.61, mood_index=58.0, pollution_index=0.34, traffic_index=0.55, complaints_count=147, x=43.16, y=76.97),
    dict(name="Жетысу",   slug="zhetysu",   status="warning",  risk_score=0.55, mood_index=63.0, pollution_index=0.48, traffic_index=0.61, complaints_count=134, x=43.32, y=77.01),
    dict(name="Сарыарка", slug="saryarka",  status="warning",  risk_score=0.59, mood_index=55.0, pollution_index=0.51, traffic_index=0.68, complaints_count=167, x=43.30, y=76.93),
    # 3 normal
    dict(name="Бостандык", slug="bostandyk", status="normal",  risk_score=0.38, mood_index=74.0, pollution_index=0.28, traffic_index=0.42, complaints_count=89,  x=43.22, y=76.87),
    dict(name="Турксиб",   slug="turksib",   status="normal",  risk_score=0.31, mood_index=79.0, pollution_index=0.22, traffic_index=0.35, complaints_count=54,  x=43.35, y=77.05),
    dict(name="Алатау",    slug="alatau",    status="normal",  risk_score=0.24, mood_index=83.0, pollution_index=0.19, traffic_index=0.29, complaints_count=38,  x=43.37, y=76.82),
]

district_objs = []
for d in districts_data:
    obj = DistrictModel(**d)
    db.add(obj)
    district_objs.append(obj)
db.flush()  # get IDs

# ── Reports ─────────────────────────────────────────────────────────────────
# Direction 1 — Road Decay ROI (Алмалы = index 0)
almaly_id = district_objs[0].id
auezov_id = district_objs[1].id
nauryzbay_id = district_objs[2].id

reports_data = [
    # Алмалы — Direction 1: Road Decay
    dict(district_id=almaly_id, source="2gis",      category="road",    sentiment_score=-0.91, severity_score=0.93, text="Ул. Розыбакиева полностью разбита, колейность 15 см. Машины объезжают по тротуару, уже 3 аварии за месяц. Аварийный ремонт обойдётся в 340 млн тг против 80 млн при плановом."),
    dict(district_id=almaly_id, source="threads",   category="road",    sentiment_score=-0.88, severity_score=0.89, text="Проспект Алтынсарина: ямы глубиной 20 см, плановый ремонт просрочен на 2 года. Промедление ещё на год увеличит стоимость до 180 млн тг против текущих 45 млн."),
    dict(district_id=almaly_id, source="instagram", category="road",    sentiment_score=-0.82, severity_score=0.85, text="Перекресток Сейфуллина/Жибек Жолы — асфальт просел, трамвайные рельсы торчат на 8 см. Риск схода рельса оценивается в 120 млн тг ущерба."),
    dict(district_id=almaly_id, source="2gis",      category="safety",  sentiment_score=-0.79, severity_score=0.81, text="Камеры отсутствуют на 4 из 7 ключевых перекрестков района. За 2024 год 23 ДТП в непокрытых зонах, 0 — в зонах с камерами."),
    dict(district_id=almaly_id, source="form",      category="ecology", sentiment_score=-0.61, severity_score=0.62, text="Дизельные автобусы маршрута 37 простаивают у школы №18. Превышение PM2.5 в 3.2 раза от нормы по данным КАЗГИДРОМЕТ."),

    # Ауэзов — Direction 2: Traffic Safety Allocation
    dict(district_id=auezov_id, source="instagram", category="safety",  sentiment_score=-0.93, severity_score=0.91, text="Перекресток Саина/Тимирязева — ни одной камеры, каждую неделю ДТП. 47 аварий в 2024 году, расчётный потенциал штрафов: 380 млн тг/год при установке 2 камер."),
    dict(district_id=auezov_id, source="news",      category="safety",  sentiment_score=-0.86, severity_score=0.88, text="Камеры покрывают лишь 30% дорог Ауэзовского района. По модели ROI: 18 новых точек дадут 2.1 млрд тг/год штрафных поступлений, окупаемость — 8 месяцев."),
    dict(district_id=auezov_id, source="2gis",      category="road",    sentiment_score=-0.77, severity_score=0.79, text="Алатауский проспект: просадка асфальта после ливней 2024, срок службы истёк в 2022. Промедление переводит участок в аварийный — стоимость вырастает с 60 до 210 млн тг."),
    dict(district_id=auezov_id, source="threads",   category="safety",  sentiment_score=-0.73, severity_score=0.75, text="Дворы ул. Майлина без освещения — рост уличных преступлений на 34% за год. Установка 40 фонарей (12 млн тг) снизит нагрузку на полицию оценочно на 28%."),
    dict(district_id=auezov_id, source="form",      category="traffic", sentiment_score=-0.66, severity_score=0.68, text="Ул. Момышулы в час-пик: пробки 45–60 минут ежедневно. Потери бизнеса района — 85 млн тг/мес по данным Торговой палаты Алматы."),

    # Наурызбай — mixed warning
    dict(district_id=nauryzbay_id, source="2gis",      category="road",    sentiment_score=-0.75, severity_score=0.77, text="Коллекторная дорога разрушена после весенней оттепели, ямы до 30 см. Закрытие участка неизбежно через 2–3 месяца без вмешательства."),
    dict(district_id=nauryzbay_id, source="instagram", category="safety",  sentiment_score=-0.70, severity_score=0.72, text="Объездная дорога без камер скорости — водители разгоняются до 100+ км/ч в жилой зоне. 12 пострадавших за полгода."),
    dict(district_id=nauryzbay_id, source="threads",   category="ecology", sentiment_score=-0.56, severity_score=0.58, text="Незаконная свалка у реки Есентай горит раз в 2–3 недели. Штрафы с нарушителей за год не покрыли даже 10% стоимости рекультивации."),

    # Медеу — warning
    dict(district_id=district_objs[3].id, source="form",      category="housing", sentiment_score=-0.64, severity_score=0.63, text="Дом на ул. Горного Гиганта: канализация не ремонтировалась с 2011 года. Протечки в 14 квартирах, акт КСК составлен но решения нет 8 месяцев."),
    dict(district_id=district_objs[3].id, source="2gis",      category="traffic", sentiment_score=-0.58, severity_score=0.57, text="Пробка у рынка Зелёный базар ежедневно с 7:00 до 10:00. Объездных маршрутов нет, автобусы опаздывают на 20–35 минут."),

    # Жетысу — warning
    dict(district_id=district_objs[4].id, source="instagram", category="road",    sentiment_score=-0.59, severity_score=0.56, text="Ул. Абая в районе Жетысу: ямочный ремонт 2023 года расслоился за одну зиму. Требуется полная замена основания — 95 млн тг."),
    dict(district_id=district_objs[4].id, source="threads",   category="ecology", sentiment_score=-0.52, severity_score=0.50, text="ТЭЦ-2 в дни без ветра создаёт смог над районом. Жалобы в акимат — без ответа 3 месяца."),

    # Сарыарка — warning
    dict(district_id=district_objs[5].id, source="form",      category="safety",  sentiment_score=-0.60, severity_score=0.59, text="Рынок Алтын Орда: 6 камер видеонаблюдения из 12 неисправны, зафиксировано 18 карманных краж за квартал."),
    dict(district_id=district_objs[5].id, source="2gis",      category="housing", sentiment_score=-0.54, severity_score=0.53, text="Отопление в 3 домах по ул. Сыганак подаётся с перебоями. Температура в квартирах 14–16°C при норме 20°C."),

    # Бостандык — normal, mild
    dict(district_id=district_objs[6].id, source="form",      category="road",    sentiment_score=-0.31, severity_score=0.32, text="Тротуар у парка Горького требует косметического ремонта плитки — небольшие сколы после зимы."),

    # Турксиб — normal, mild
    dict(district_id=district_objs[7].id, source="2gis",      category="ecology", sentiment_score=-0.28, severity_score=0.27, text="Промышленная зона Турксиб: пыль в ветреные дни превышает норму на 15%. Рекомендовано полить дороги."),

    # Алатау — normal, mild
    dict(district_id=district_objs[8].id, source="instagram", category="traffic", sentiment_score=-0.22, severity_score=0.21, text="Пешеходный переход у новой школы на ул. Момышулы без светофора — родители просят установить."),
]

for r in reports_data:
    db.add(ReportModel(**r))

# ── Snapshots (time-series baseline) ────────────────────────────────────────
for d in district_objs:
    db.add(DistrictSnapshotModel(
        district_id=d.id,
        complaints_count=d.complaints_count,
        negative_reports_count=int(d.complaints_count * 0.7),
        traffic_index=d.traffic_index,
        pollution_index=d.pollution_index,
        risk_score=d.risk_score,
        mood_index=d.mood_index,
        top_category="road" if d.risk_score > 0.7 else "traffic",
        timestamp=datetime.utcnow(),
    ))

db.commit()
db.close()

print(f"Seeded {len(districts_data)} districts and {len(reports_data)} reports.")
