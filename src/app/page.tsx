"use client";

import { useEffect, useMemo, useState } from "react";

type WeekData = {
  week: number;
  days: number;
  intensity: string;
  osta: string;
  card: string;
  rad: string;
  selank: string;
  nac: string;
};

const cycleData: WeekData[] = [
  {
    week: 1,
    days: 7,
    intensity: "Tolerance Check",
    osta: "1 cap (15mg)",
    card: "1 cap (12.5mg)",
    rad: "1 cap (10mg)",
    selank: "200-300mcg",
    nac: "600-900mg",
  },
  {
    week: 2,
    days: 7,
    intensity: "Ramp Up",
    osta: "1 cap (15mg)",
    card: "1 cap (12.5mg)",
    rad: "1 cap (10mg)",
    selank: "300-500mcg",
    nac: "900mg",
  },
  {
    week: 3,
    days: 7,
    intensity: "Ramp Up",
    osta: "1 cap (15mg)",
    card: "1 cap (12.5mg)",
    rad: "1 cap (10mg)",
    selank: "300-500mcg",
    nac: "900mg",
  },
  {
    week: 4,
    days: 7,
    intensity: "Ramp Up",
    osta: "2 caps (30mg)",
    card: "1 cap (12.5mg)",
    rad: "1 cap (10mg)",
    selank: "300-500mcg",
    nac: "900mg",
  },
  {
    week: 5,
    days: 7,
    intensity: "Peak Phase",
    osta: "2 caps (30mg)",
    card: "1 cap (12.5mg)",
    rad: "2 caps (20mg)",
    selank: "300-500mcg",
    nac: "900-1200mg",
  },
  {
    week: 6,
    days: 7,
    intensity: "Peak Phase",
    osta: "2 caps (30mg)",
    card: "1 cap (12.5mg)",
    rad: "2 caps (20mg)",
    selank: "300-500mcg",
    nac: "900-1200mg",
  },
  {
    week: 7,
    days: 7,
    intensity: "Peak Phase",
    osta: "1-2 caps (15-30mg)",
    card: "1 cap (12.5mg)",
    rad: "1 cap (10mg)",
    selank: "300-500mcg",
    nac: "900-1200mg",
  },
  {
    week: 8,
    days: 7,
    intensity: "Taper",
    osta: "1 cap (15mg)",
    card: "1 cap (12.5mg)",
    rad: "1 cap (10mg)",
    selank: "200-300mcg",
    nac: "900mg",
  },
  {
    week: 9,
    days: 7,
    intensity: "Taper",
    osta: "1 cap (15mg)",
    card: "1 cap (12.5mg)",
    rad: "1 cap (10mg)",
    selank: "200-300mcg",
    nac: "900mg",
  },
];

type WeekWithDays = WeekData & {
  startDay: number;
  endDay: number;
  dayNumbers: number[];
};

type CapsuleKey = "osta" | "rad" | "card";

type DailyCapsules = Record<CapsuleKey, number>;

const capsuleSupply: Record<CapsuleKey, number> = {
  osta: 100,
  rad: 90,
  card: 60,
};

const capsuleLabels: Record<CapsuleKey, string> = {
  osta: "Ostarine",
  rad: "RAD-140",
  card: "Cardarine",
};

const parseCapsuleCount = (value: string) => {
  const match = value.match(/\d+/);
  return match ? Number(match[0]) : 0;
};

type StoredProgress = {
  checkedDays: Record<number, boolean>;
  dailyCapsules: Record<number, DailyCapsules>;
  startDate?: string;
};

const STORAGE_KEY = "cycle-progress-v1";

export default function Home() {
  const [checkedDays, setCheckedDays] = useState<Record<number, boolean>>({});
  const [dailyCapsules, setDailyCapsules] = useState<
    Record<number, DailyCapsules>
  >({});
  const [startDate, setStartDate] = useState<string>("");

  const weeks = useMemo<WeekWithDays[]>(() => {
    let dayCounter = 1;
    return cycleData.map((week) => {
      const startDay = dayCounter;
      const endDay = dayCounter + week.days - 1;
      const dayNumbers = Array.from({ length: week.days }, (_, index) => {
        return startDay + index;
      });
      dayCounter += week.days;
      return { ...week, startDay, endDay, dayNumbers };
    });
  }, []);

  const defaultCapsulesByDay = useMemo<Record<number, DailyCapsules>>(() => {
    const defaults: Record<number, DailyCapsules> = {};
    weeks.forEach((week) => {
      const dayDefaults: DailyCapsules = {
        osta: parseCapsuleCount(week.osta),
        rad: parseCapsuleCount(week.rad),
        card: parseCapsuleCount(week.card),
      };
      week.dayNumbers.forEach((day) => {
        defaults[day] = dayDefaults;
      });
    });
    return defaults;
  }, [weeks]);

  useEffect(() => {
    const totalDays = cycleData.reduce((sum, week) => sum + week.days, 0);
    const emptyCapsules: Record<number, DailyCapsules> = {};
    for (let day = 1; day <= totalDays; day += 1) {
      emptyCapsules[day] = defaultCapsulesByDay[day] ?? {
        osta: 0,
        rad: 0,
        card: 0,
      };
    }

    if (typeof window === "undefined") {
      return;
    }

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setDailyCapsules(emptyCapsules);
        return;
      }
      const parsed = JSON.parse(raw) as StoredProgress;
      setCheckedDays(parsed.checkedDays ?? {});
      setDailyCapsules(parsed.dailyCapsules ?? emptyCapsules);
      setStartDate(parsed.startDate ?? "");
    } catch (error) {
      setDailyCapsules(emptyCapsules);
    }
  }, []);

  const handleToggle = (day: number) => {
    return (event: React.ChangeEvent<HTMLInputElement>) => {
      const { checked } = event.target;
      setCheckedDays((prev) => ({ ...prev, [day]: checked }));
      if (checked && !startDate) {
        const today = new Date();
        const isoDate = today.toISOString().slice(0, 10);
        setStartDate(isoDate);
      }
      if (!checked && day === 1) {
        setStartDate("");
      }
    };
  };

  const handleCapsuleChange = (day: number, key: CapsuleKey) => {
    return (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = Number(event.target.value);
      const safeValue = Number.isNaN(value) ? 0 : Math.max(0, value);
      setDailyCapsules((prev) => ({
        ...prev,
        [day]: {
          ...(prev[day] ?? { osta: 0, rad: 0, card: 0 }),
          [key]: safeValue,
        },
      }));
    };
  };

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const payload: StoredProgress = {
      checkedDays,
      dailyCapsules,
      startDate: startDate || undefined,
    };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (error) {
      // If storage is unavailable or full, avoid breaking the UI.
    }
  }, [checkedDays, dailyCapsules, startDate]);

  const handleStartDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setStartDate(event.target.value);
  };

  const getDayDateLabel = (day: number) => {
    if (!startDate) {
      return "Set start date";
    }
    const baseDate = new Date(`${startDate}T00:00:00`);
    const dayDate = new Date(baseDate);
    dayDate.setDate(baseDate.getDate() + (day - 1));
    return dayDate.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const remainingCapsules = useMemo(() => {
    const totals: Record<CapsuleKey, number> = { osta: 0, rad: 0, card: 0 };
    Object.values(dailyCapsules).forEach((entry) => {
      totals.osta += entry.osta || 0;
      totals.rad += entry.rad || 0;
      totals.card += entry.card || 0;
    });
    return {
      osta: capsuleSupply.osta - totals.osta,
      rad: capsuleSupply.rad - totals.rad,
      card: capsuleSupply.card - totals.card,
    };
  }, [dailyCapsules]);

  return (
    <div className="container">
      <header className="header">
        <h1>💪 9-Week SARM Cycle Calendar</h1>
        <p>Maximum Gains Protocol - Track Your Daily Progress</p>
      </header>

      <section className="start-date">
        <div className="start-date-card">
          <div>
            <h2>📅 Cycle Start Date</h2>
            <p>
              Choose a start date to display calendar dates for every day of
              the cycle.
            </p>
          </div>
          <label className="start-date-input">
            <span>Start date</span>
            <input
              type="date"
              value={startDate}
              onChange={handleStartDateChange}
            />
          </label>
        </div>
      </section>

      <section className="capsules-summary">
        <h2>💊 Capsule Tracker</h2>
        <p className="capsules-subtitle">
          Enter how many capsules you used each day. Remaining total updates
          automatically.
        </p>
        <div className="capsules-grid">
          {(["osta", "rad", "card"] as CapsuleKey[]).map((key) => (
            <div className="capsule-card" key={key}>
              <div className="capsule-title">{capsuleLabels[key]}</div>
              <div className="capsule-stat">
                <span>Supply:</span>
                <strong>{capsuleSupply[key]}</strong>
              </div>
              <div className="capsule-stat">
                <span>Remaining:</span>
                <strong>{remainingCapsules[key]}</strong>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="legend">
        <h2 className="legend-title">🎨 Cycle Intensity Legend</h2>
        <div className="legend-grid">
          <div className="legend-item">
            <div className="legend-color legend-week1" />
            <span>Week 1: Tolerance Check (Low)</span>
          </div>
          <div className="legend-item">
            <div className="legend-color legend-week2" />
            <span>Weeks 2-4: Ramp Up (Medium)</span>
          </div>
          <div className="legend-item">
            <div className="legend-color legend-week5" />
            <span>Weeks 5-7: Peak Phase (High)</span>
          </div>
          <div className="legend-item">
            <div className="legend-color legend-week8" />
            <span>Weeks 8-9: Taper (Medium-Low)</span>
          </div>
        </div>
      </section>

      <section className="week-container">
        {weeks.map((week) => (
          <div className={`week week${week.week}`} key={week.week}>
            <div className="week-header">
              <span>
                Week {week.week} (Days {week.startDay}-{week.endDay})
              </span>
              <span className="intensity-badge">{week.intensity}</span>
            </div>

            <div className="days-grid">
              {week.dayNumbers.map((day) => (
                <div className="day-card" key={day}>
                  <div className="day-number">Day {day}</div>
                  <div className="day-date">{getDayDateLabel(day)}</div>
                  <div className="dosage-info">
                    <div className="dosage-item">
                      <strong>Osta:</strong> {week.osta}
                    </div>
                    <div className="dosage-item">
                      <strong>Card:</strong> {week.card}
                    </div>
                    <div className="dosage-item">
                      <strong>RAD:</strong> {week.rad}
                    </div>
                    <div className="dosage-item">
                      <strong>Selank:</strong> {week.selank}
                    </div>
                    <div className="dosage-item">
                      <strong>NAC:</strong> {week.nac}
                    </div>
                  </div>
                  <div className="capsule-inputs">
                    <div className="capsule-input">
                      <label htmlFor={`day${day}-osta`}>Osta caps</label>
                      <input
                        id={`day${day}-osta`}
                        type="number"
                        min={0}
                        value={
                          dailyCapsules[day]?.osta ??
                          defaultCapsulesByDay[day]?.osta ??
                          0
                        }
                        onChange={handleCapsuleChange(day, "osta")}
                      />
                    </div>
                    <div className="capsule-input">
                      <label htmlFor={`day${day}-rad`}>RAD caps</label>
                      <input
                        id={`day${day}-rad`}
                        type="number"
                        min={0}
                        value={
                          dailyCapsules[day]?.rad ??
                          defaultCapsulesByDay[day]?.rad ??
                          0
                        }
                        onChange={handleCapsuleChange(day, "rad")}
                      />
                    </div>
                    <div className="capsule-input">
                      <label htmlFor={`day${day}-card`}>Card caps</label>
                      <input
                        id={`day${day}-card`}
                        type="number"
                        min={0}
                        value={
                          dailyCapsules[day]?.card ??
                          defaultCapsulesByDay[day]?.card ??
                          0
                        }
                        onChange={handleCapsuleChange(day, "card")}
                      />
                    </div>
                  </div>
                  <div className="checkbox-container">
                    <input
                      type="checkbox"
                      className="checkbox"
                      id={`day${day}`}
                      checked={Boolean(checkedDays[day])}
                      onChange={handleToggle(day)}
                    />
                    <label htmlFor={`day${day}`}>Complete</label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="notes-section">
        <h2>📋 Important Notes &amp; Guidelines</h2>

        <div className="note-card">
          <h3>🕐 Timing &amp; Administration</h3>
          <ul>
            <li>
              <strong>All oral SARMs:</strong> Take once daily in the morning with
              food containing fat (breakfast) for optimal absorption
            </li>
            <li>
              <strong>Selank:</strong> Spray 1-2x daily (morning + evening if
              needed) for mood/focus/anxiety control
            </li>
            <li>
              <strong>NAC:</strong> Split into 2 doses (morning + evening) for
              liver/antioxidant support
            </li>
            <li>
              <strong>Half-lives:</strong> All SARMs have 16-24 hour half-lives,
              so once-daily dosing is sufficient
            </li>
          </ul>
        </div>

        <div className="note-card">
          <h3>🏋️ Training &amp; Nutrition</h3>
          <ul>
            <li>
              <strong>Training frequency:</strong> 5-6x per week with heavy
              progressive overload compounds
            </li>
            <li>
              <strong>Cardio:</strong> Include moderate cardio to maximize
              Cardarine benefits
            </li>
            <li>
              <strong>Caloric surplus:</strong> 400-600 calories above
              maintenance
            </li>
            <li>
              <strong>Protein intake:</strong> 2.2g+ per kg bodyweight daily
            </li>
            <li>
              <strong>Hydration:</strong> Drink plenty of water throughout the
              day
            </li>
          </ul>
        </div>

        <div className="note-card">
          <h3>💊 Capsule Usage Summary</h3>
          <ul>
            <li>
              <strong>Ostarine (15mg caps):</strong> 84-91 caps needed depending
              on Week 7 choice (9-16 caps remaining from your 100 supply)
            </li>
            <li>
              <strong>RAD-140 (10mg caps):</strong> ~77 caps needed (13 caps
              remaining from your 90 supply)
            </li>
            <li>
              <strong>Cardarine (12.5mg caps):</strong> ~63 caps needed (3 caps
              short - skip last 3 days or source more)
            </li>
            <li>
              <strong>Note:</strong> Ostarine at 2 caps during Weeks 4-6,
              optional 2 caps Week 7; RAD at 2 caps during Weeks 5-6 only
            </li>
          </ul>
        </div>

        <div className="note-card">
          <h3>⚕️ Health Monitoring</h3>
          <ul>
            <li>
              <strong>Bloodwork:</strong> Get baseline before cycle, mid-cycle
              check if possible, and 4 weeks post-PCT
            </li>
            <li>
              <strong>Watch for:</strong> Lethargy, suppression signs, unusual
              mood changes, joint pain
            </li>
            <li>
              <strong>If sides appear:</strong> Prioritize dropping RAD-140
              first, then reduce other compounds
            </li>
            <li>
              <strong>Sleep:</strong> Ensure 7-9 hours quality sleep nightly for
              recovery
            </li>
          </ul>
        </div>

        <div className="note-card">
          <h3>🔄 PCT Protocol (Weeks 10-13, Days 64-91)</h3>
          <p>
            <strong>Nolvadex (Nolvamed 20mg):</strong>
          </p>
          <ul>
            <li>Weeks 10-11 (Days 64-77): 20mg daily</li>
            <li>Weeks 12-13 (Days 78-91): 10mg daily</li>
          </ul>
          <p className="note-subheading">
            <strong>Optional Support:</strong>
          </p>
          <ul>
            <li>Continue NAC (600mg 2x/day) for 2-4 weeks post-cycle</li>
            <li>Continue Selank (200mcg/day) for mood/recovery support</li>
            <li>Get bloodwork ~4 weeks after PCT ends to verify recovery</li>
          </ul>
        </div>

        <div className="note-card">
          <h3>🎯 Expected Results</h3>
          <ul>
            <li>
              <strong>Lean mass gain:</strong> 12-18+ lbs with proper diet and
              training
            </li>
            <li>
              <strong>Fat loss:</strong> Significant recomp effect from
              Cardarine
            </li>
            <li>
              <strong>Strength:</strong> Notable increases in all major lifts
            </li>
            <li>
              <strong>Endurance:</strong> Enhanced cardiovascular capacity and
              work capacity
            </li>
            <li>
              <strong>Recovery:</strong> Faster recovery between workouts
            </li>
          </ul>
        </div>

        <div className="note-card">
          <h3>⚠️ Safety Reminders</h3>
          <ul>
            <li>Do not exceed recommended dosages</li>
            <li>Stay hydrated throughout the cycle</li>
            <li>Listen to your body - adjust if experiencing negative sides</li>
            <li>Do not extend cycle beyond 9 weeks without proper break</li>
            <li>Complete full PCT protocol for hormonal recovery</li>
            <li>Wait minimum 8-12 weeks before starting another cycle</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
