/** One logged shot as the history endpoint returns it: only what stats and gapping need. */
export interface HistoryShot {
  timestamp: string;
  club: string;
  profile_id: string;
  mode: string | null;
  ball_speed_mph: number;
  club_speed_mph: number | null;
  smash_factor: number | null;
  estimated_carry_yards: number;
  carry_spin_adjusted: number | null;
  launch_angle_vertical: number | null;
  launch_angle_horizontal: number | null;
  spin_rpm: number | null;
  spin_axis_deg: number | null;
  /** Session log file the shot came from. */
  session: string;
}

export interface HistorySnapshot {
  profile_id: string;
  shots: HistoryShot[];
  session_count: number;
}
